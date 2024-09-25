import { Configuration, LoggingEvent } from '@/modules/logger'

function stdoutAppender(
  layout: (logEvent: LoggingEvent, timezoneOffset?: number) => string,
  timezoneOffset?: number
) {
  return (loggingEvent: LoggingEvent) => {
    process.stdout.write(`${layout(loggingEvent, timezoneOffset)}\n`)
  }
}

export function configure(
  config: Configuration & { timezoneOffset?: number },
  layouts: any
) {
  let layout = layouts.colouredLayout
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout)
  }
  return stdoutAppender(layout, config.timezoneOffset)
}
