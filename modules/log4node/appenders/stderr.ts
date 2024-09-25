import { Configuration, LoggingEvent } from '@/modules/logger'

function stderrAppender(
  layout: (logEvent: LoggingEvent, timezoneOffset?: number) => string,
  timezoneOffset?: number
) {
  return (loggingEvent: LoggingEvent) => {
    process.stderr.write(`${layout(loggingEvent, timezoneOffset)}\n`)
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
  return stderrAppender(layout, config.timezoneOffset)
}
