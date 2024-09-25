import createDebug from 'debug'
import path from 'path'
import streams from 'streamroller'
import os from 'os'
import { Configuration, LoggingEvent } from '@/modules/logger'

const debug = createDebug('log4node:file')

const eol = os.EOL

let mainSighupListenerStarted = false
const sighupListeners = new Set()
function mainSighupHandler() {
  sighupListeners.forEach((app: any) => {
    app.sighupHandler()
  })
}

/**
 * File Appender writing the logs to a text file. Supports rolling of logs by size.
 *
 * @param file the file log messages will be written to
 * @param layout a function that takes a logEvent and returns a string
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
    'Creating file appender (',
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

  function openTheStream(
    filePath: string,
    fileSize: number,
    numFiles: number,
    opt: any
  ) {
    const stream = new streams.RollingFileStream(
      filePath,
      fileSize,
      numFiles,
      opt
    )
    stream.on('error', (err: Error) => {
      // eslint-disable-next-line no-console
      console.error(
        'log4node.fileAppender - Writing to file %s, error happened ',
        filePath,
        err
      )
    })
    stream.on('drain', () => {
      process.emit('logger:pause' as any, false as any)
    })
    return stream
  }

  let writer = openTheStream(file, logSize, numBackups, options)

  const app = function (loggingEvent: LoggingEvent) {
    if (!writer.writable) {
      return
    }
    if (options.removeColor === true) {
      // eslint-disable-next-line no-control-regex
      const regex = /\x1b[[0-9;]*m/g
      loggingEvent.data = loggingEvent.data.map(d => {
        if (typeof d === 'string') return d.replace(regex, '')
        return d
      })
    }
    if (!writer.write(layout(loggingEvent, timezoneOffset) + eol, 'utf8')) {
      process.emit('logger:pause' as any, true as any)
    }
  }

  app.reopen = function () {
    writer.end(() => {
      writer = openTheStream(file, logSize, numBackups, options)
    })
  }

  app.sighupHandler = function () {
    debug('SIGHUP handler called.')
    app.reopen()
  }

  app.shutdown = function (complete: any) {
    sighupListeners.delete(app)
    if (sighupListeners.size === 0 && mainSighupListenerStarted) {
      process.removeListener('SIGHUP', mainSighupHandler)
      mainSighupListenerStarted = false
    }
    writer.end('', 'utf-8', complete)
  }

  // On SIGHUP, close and reopen all files. This allows this appender to work with
  // logrotate. Note that if you are using logrotate, you should not set
  // `logSize`.
  sighupListeners.add(app)
  if (!mainSighupListenerStarted) {
    process.on('SIGHUP', mainSighupHandler)
    mainSighupListenerStarted = true
  }

  return app
}

export function configure(
  config: Configuration & {
    mode?: number | string
    filename: string
    maxLogSize: number
    backups: number
    timezoneOffset?: number
  },
  layouts: any
) {
  let layout = layouts.basicLayout
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout)
  }

  // security default (instead of relying on streamroller default)
  config.mode = config.mode || 0o600

  return fileAppender(
    config.filename,
    layout,
    config.maxLogSize,
    config.backups,
    config,
    config.timezoneOffset
  )
}
