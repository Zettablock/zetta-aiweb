import createDebug from 'debug'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { Configuration, LoggingEvent } from '@/modules/logger'

const debug = createDebug('log4node:fileSync')

const eol = os.EOL

function touchFile(file: string, options: any) {
  // attempt to create the directory
  const mkdir = (dir: string) => {
    try {
      return fs.mkdirSync(dir, { recursive: true })
    } catch (e) {
      const code = (e as any).code
      // backward-compatible fs.mkdirSync for nodejs pre-10.12.0 (without recursive option)
      // recursive creation of parent first
      if (code === 'ENOENT') {
        mkdir(path.dirname(dir))
        return mkdir(dir)
      }

      // throw error for all except EEXIST and EROFS (read-only filesystem)
      if (code !== 'EEXIST' && code !== 'EROFS') {
        throw e
      }

      // EEXIST: throw if file and not directory
      // EROFS : throw if directory not found
      else {
        try {
          if (fs.statSync(dir).isDirectory()) {
            return dir
          }
          throw e
        } catch (err) {
          throw e
        }
      }
    }
  }
  mkdir(path.dirname(file))

  // try to throw EISDIR, EROFS, EACCES
  fs.appendFileSync(file, '', { mode: options.mode, flag: options.flags })
}

class RollingFileSync {
  private currentSize: number
  constructor(
    private filename: string,
    private size: number,
    private backups: number,
    private options?: any
  ) {
    debug('In RollingFileStream')

    if (size < 0) {
      throw new Error(`maxLogSize (${size}) should be > 0`)
    }

    this.currentSize = 0

    function currentFileSize(file: string) {
      let fileSize = 0

      try {
        fileSize = fs.statSync(file).size
      } catch (e) {
        // file does not exist
        touchFile(file, options)
      }
      return fileSize
    }

    this.currentSize = currentFileSize(this.filename)
  }

  shouldRoll() {
    debug(
      'should roll with current size %d, and max size %d',
      this.currentSize,
      this.size
    )
    return this.currentSize >= this.size
  }

  roll(filename: string) {
    const that = this
    const nameMatcher = new RegExp(`^${path.basename(filename)}`)

    function justTheseFiles(item: string) {
      return nameMatcher.test(item)
    }

    function index(filename_: string) {
      return (
        parseInt(filename_.slice(`${path.basename(filename)}.`.length), 10) || 0
      )
    }

    function byIndex(a: string, b: string) {
      return index(a) - index(b)
    }

    function increaseFileIndex(fileToRename: string) {
      const idx = index(fileToRename)
      debug(`Index of ${fileToRename} is ${idx}`)
      if (that.backups === 0) {
        fs.truncateSync(filename, 0)
      } else if (idx < that.backups) {
        // on windows, you can get a EEXIST error if you rename a file to an existing file
        // so, we'll try to delete the file we're renaming to first
        try {
          fs.unlinkSync(`${filename}.${idx + 1}`)
        } catch (e) {
          // ignore err: if we could not delete, it's most likely that it doesn't exist
        }

        debug(`Renaming ${fileToRename} -> ${filename}.${idx + 1}`)
        fs.renameSync(
          path.join(path.dirname(filename), fileToRename),
          `${filename}.${idx + 1}`
        )
      }
    }

    function renameTheFiles() {
      // roll the backups (rename file.n to file.n+1, where n <= numBackups)
      debug('Renaming the old files')

      const files = fs.readdirSync(path.dirname(filename))
      files
        .filter(justTheseFiles)
        .sort(byIndex)
        .reverse()
        .forEach(increaseFileIndex)
    }

    debug('Rolling, rolling, rolling')
    renameTheFiles()
  }

  // eslint-disable-next-line no-unused-vars
  write(chunk: string, encoding: string) {
    const that = this

    function writeTheChunk() {
      debug('writing the chunk to the file')
      that.currentSize += chunk.length
      fs.appendFileSync(that.filename, chunk)
    }

    debug('in write')

    if (this.shouldRoll()) {
      this.currentSize = 0
      this.roll(this.filename)
    }

    writeTheChunk()
  }
}

/**
 * File Appender writing the logs to a text file. Supports rolling of logs by size.
 *
 * @param file the file log messages will be written to
 * @param layout a function that takes a logevent and returns a string
 *   (defaults to basicLayout).
 * @param logSize - the maximum size (in bytes) for a log file,
 *   if not provided then logs won't be rotated.
 * @param numBackups - the number of log files to keep after logSize
 *   has been reached (default 5)
 * @param options - options to be passed to the underlying stream
 * @param timezoneOffset - optional timezone offset in minutes (default system local)
 */
function fileAppender(
  file: string,
  layout: (loggingEvent: LoggingEvent, timezoneOffset?: number) => string,
  logSize: number,
  numBackups: number,
  options: any,
  timezoneOffset?: number
) {
  if (typeof file !== 'string' || file.length === 0) {
    throw new Error(`Invalid filename: ${file}`)
  } else if (file.endsWith(path.sep)) {
    throw new Error(`Filename is a directory: ${file}`)
  } else if (file.indexOf(`~${path.sep}`) === 0) {
    // handle ~ expansion: https://github.com/nodejs/node/issues/684
    // exclude ~ and ~filename as these can be valid files
    file = file.replace('~', os.homedir())
  }
  file = path.normalize(file)
  numBackups = !numBackups && numBackups !== 0 ? 5 : numBackups

  debug(
    'Creating fileSync appender (',
    file,
    ', ',
    logSize,
    ', ',
    numBackups,
    ', ',
    options,
    ', ',
    timezoneOffset,
    ')'
  )

  function openTheStream(filePath: string, fileSize: number, numFiles: number) {
    let stream

    if (fileSize) {
      stream = new RollingFileSync(filePath, fileSize, numFiles, options)
    } else {
      stream = (f => {
        // touch the file to apply flags (like w to truncate the file)
        touchFile(f, options)

        return {
          write(data: string) {
            fs.appendFileSync(f, data)
          }
        }
      })(filePath)
    }

    return stream
  }

  const logFile = openTheStream(file, logSize, numBackups)

  return (loggingEvent: LoggingEvent) => {
    ;(logFile as any).write(layout(loggingEvent, timezoneOffset) + eol)
  }
}

export function configure(
  config: Configuration & {
    flags: string
    encoding: string
    mode?: number | string
    filename: string
    maxLogSize: number
    backups: number
    timezoneOffset: number
  },
  layouts: any
) {
  let layout = layouts.basicLayout
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout)
  }

  const options = {
    flags: config.flags || 'a',
    encoding: config.encoding || 'utf8',
    mode: config.mode || 0o600
  }

  return fileAppender(
    config.filename,
    layout,
    config.maxLogSize,
    config.backups,
    options,
    config.timezoneOffset
  )
}
