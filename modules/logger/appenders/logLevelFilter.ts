import { AppenderFn, Configuration, LevelEnum } from '../configuration'
import { Level } from '../Level'
import { LoggingEvent } from '../LoggingEvent'

function logLevelFilter(
  minLevelString: LevelEnum | undefined,
  maxLevelString: LevelEnum | undefined,
  appender: AppenderFn
) {
  const minLevel = Level.getLevel(minLevelString)
  const maxLevel = Level.getLevel(maxLevelString, Level.FATAL)
  return (logEvent: LoggingEvent) => {
    const eventLevel = logEvent.level
    if (
      minLevel.isLessThanOrEqualTo(eventLevel) &&
      maxLevel.isGreaterThanOrEqualTo(eventLevel)
    ) {
      appender(logEvent)
    }
  }
}

export function configure(
  config: Configuration & {
    level?: LevelEnum
    maxLevel: LevelEnum | undefined
  },
  layouts: any,
  findAppender: (appender?: string) => AppenderFn,
  level?: Level
) {
  const appender = findAppender(config.appender)
  return logLevelFilter(config.level, config.maxLevel, appender)
}
