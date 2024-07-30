import { Configuration } from '../configuration'
import { LoggingEvent } from '../LoggingEvent'

// eslint-disable-next-line no-console
const consoleLog = console.log.bind(console)

function consoleAppender(
  layout: (loggingEvent: LoggingEvent, timezoneOffset?: number) => string,
  timezoneOffset?: number
) {
  return (loggingEvent: LoggingEvent) => {
    consoleLog(layout(loggingEvent, timezoneOffset))
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
  return consoleAppender(layout, config.timezoneOffset)
}
