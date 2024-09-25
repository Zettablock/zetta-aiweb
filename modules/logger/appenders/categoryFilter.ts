import createDebug from 'debug'
import { LoggingEvent } from '../LoggingEvent';
import { AppenderFn, Configuration } from '../configuration';

const debug = createDebug('logger:categoryFilter');

function categoryFilter(excludes: string | string[], appender: (logEvent: LoggingEvent) => void) {
  if (typeof excludes === 'string') excludes = [excludes];
  return (logEvent: LoggingEvent) => {
    debug(`Checking ${logEvent.categoryName} against ${excludes}`);
    if (excludes.indexOf(logEvent.categoryName) === -1) {
      debug('Not excluded, sending to appender');
      appender(logEvent);
    }
  };
}

export function configure(config: Configuration, layouts: any, findAppender: (appender?: string) => AppenderFn) {
  const appender = findAppender(config.appender);
  return categoryFilter(config.exclude ?? [], appender);
}

