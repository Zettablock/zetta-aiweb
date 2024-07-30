import streams from 'streamroller'
import os from 'os'
import { Configuration, LoggingEvent } from '@/modules/logger'

const eol = os.EOL

function openTheStream(
  filename: string,
  pattern?: string | object,
  options?: any
) {
  const stream = new streams.DateRollingFileStream(filename, pattern, options)
  stream.on('error', (err: Error) => {
    // eslint-disable-next-line no-console
    console.error(
      'log4node.dateFileAppender - Writing to file %s, error happened ',
      filename,
      err
    )
  })
  stream.on('drain', () => {
    process.emit('logger:pause' as any, true as any)
  })
  return stream
}

/**
 * File appender that rolls files according to a date pattern.
 * @param filename base filename.
 * @param pattern the format that will be added to the end of filename when rolling,
 *          also used to check when to roll files - defaults to '.yyyy-MM-dd'
 * @param layout layout function for log messages - defaults to basicLayout
 * @param options - options to be passed to the underlying stream
 * @param timezoneOffset - optional timezone offset in minutes (default system local)
 */
function appender(
  filename: string,
  layout: (loggingEvent: LoggingEvent, timezoneOffset?: number) => string,
  pattern: string | object,
  options: any,
  timezoneOffset?: number
) {
  // the options for file appender use maxLogSize, but the docs say any file appender
  // options should work for dateFile as well.
  options.maxSize = options.maxLogSize

  const writer = openTheStream(filename, pattern, options)

  const app = function (logEvent: LoggingEvent) {
    if (!writer.writable) {
      return
    }
    if (!writer.write(layout(logEvent, timezoneOffset) + eol, 'utf8')) {
      process.emit('logger:pause' as any, false as any)
    }
  }

  app.shutdown = function (complete: any) {
    writer.end('', 'utf-8', complete)
  }

  return app
}

export function configure(
  config: Configuration & {
    alwaysIncludePattern?: boolean
    mode?: number | string
    filename: string
    pattern: string | object
    timezoneOffset?: number
  },
  layouts: any
) {
  let layout = layouts.basicLayout
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout)
  }

  if (!config.alwaysIncludePattern) {
    config.alwaysIncludePattern = false
  }

  // security default (instead of relying on streamroller default)
  config.mode = config.mode || 0o600

  return appender(
    config.filename,
    layout,
    config.pattern,
    config,
    config.timezoneOffset
  )
}
