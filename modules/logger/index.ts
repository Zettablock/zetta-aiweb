/**
 * @fileoverview logger is a library to log in JavaScript in similar manner
 * than in log4j for Java (but not really).
 *
 * <h3>Example:</h3>
 * <pre>
 *  const logging = require('logger');
 *  const log = logging.getLogger('some-category');
 *
 *  //call the log
 *  log.trace('trace me' );
 * </pre>
 *
 * NOTE: the authors below are the original browser-based logger authors
 * don't try to contact them about bugs in this version :)
 * @author Stephan Strittmatter - http://jroller.com/page/stritti
 * @author Seth Chisamore - http://www.chisamore.com
 * @since 2005-05-20
 * Website: http://logger.berlios.de
 */
import createDebug from 'debug'
import rfdc from 'rfdc'

import * as configuration from './configuration'
import { addLayout, dataFormat } from './layouts'
import { Level } from './Level'
import { appenders, init } from './appenders'
import * as categories from './categories'
import { Logger } from './Logger'
import * as clustering from './clustering'
import * as recordingModule from './appenders/recording'
import { LoggingEvent } from './LoggingEvent'

export * from './configuration'

const debug = createDebug('logger:main')
const deepClone = rfdc({ proto: true })
let enabled = false

function sendLogEventToAppender(logEvent: LoggingEvent) {
  if (!enabled) return
  debug('Received log event ', logEvent)
  const categoryAppenders = categories.appendersForCategory(
    logEvent.categoryName
  )
  categoryAppenders.forEach(appender => {
    appender(logEvent)
  })
}

function configure(configurationFileOrObject: configuration.Configuration) {
  if (enabled) {
    // eslint-disable-next-line no-use-before-define
    shutdown()
  }

  let configObject = configurationFileOrObject

  debug(`Configuration is ${configObject}`)

  configuration.configure(deepClone(configObject))

  clustering.onMessage(sendLogEventToAppender)

  enabled = true

  // eslint-disable-next-line no-use-before-define
  return logger
}

function isConfigured() {
  return enabled
}

function recording() {
  return recordingModule
}

/**
 * This callback type is called `shutdownCallback` and is displayed as a global symbol.
 *
 * @callback shutdownCallback
 * @param {Error} [error]
 */

/**
 * Shutdown all log appenders. This will first disable all writing to appenders
 * and then call the shutdown function each appender.
 *
 * @param {shutdownCallback} [callback] - The callback to be invoked once all appenders have
 *  shutdown. If an error occurs, the callback will be given the error object
 *  as the first argument.
 */
function shutdown(callback = (err?: Error) => {}) {
  if (typeof callback !== 'function') {
    throw new TypeError('Invalid callback passed to shutdown')
  }
  debug('Shutdown called. Disabling all log writing.')
  // First, disable all writing to appenders. This prevents appenders from
  // not being able to be drained because of run-away log writes.
  enabled = false

  // Clone out to maintain a reference
  const appendersToCheck = Array.from(appenders.values())

  // Reset immediately to prevent leaks
  init()
  categories.init()

  // Count the number of shutdown functions
  const shutdownFunctions = appendersToCheck.reduce(
    (accum, next) => (next.shutdown ? accum + 1 : accum),
    0
  )
  if (shutdownFunctions === 0) {
    debug('No appenders with shutdown functions found.')
    callback()
  }

  let completed = 0
  let error: Error
  debug(`Found ${shutdownFunctions} appenders with shutdown functions.`)
  function complete(err: Error) {
    error = error || err
    completed += 1
    debug(`Appender shutdowns complete: ${completed} / ${shutdownFunctions}`)
    if (completed >= shutdownFunctions) {
      debug('All shutdown functions completed.')
      callback(error)
    }
  }

  // Call each of the shutdown functions
  appendersToCheck.filter(a => a.shutdown).forEach(a => a.shutdown(complete))
}

/**
 * Get a logger instance.
 * @static
 * @param {string} [category=default]
 * @return {Logger} instance of logger for the category
 */
function getLogger(category: string) {
  if (!enabled) {
    configure({
      appenders: { 'console-appender': { type: 'console' } },
      categories: {
        default: {
          appenders: ['console-appender'],
          level: configuration.LevelEnum.OFF
        }
      }
    })
  }
  return new Logger(category || 'default')
}

export type AppenderFn = configuration.AppenderFn

const logger = {
  getLogger,
  configure,
  isConfigured,
  shutdown,
  addLayout,
  dataFormat,
  recording,
  Level,
  Logger,
  appenders,
  LoggingEvent,
  clustering
}

/**
 * @property getLogger
 * @property configure
 * @property shutdown
 */
export {
  getLogger,
  configure,
  isConfigured,
  shutdown,
  addLayout,
  dataFormat,
  recording,
  Level,
  Logger,
  appenders,
  LoggingEvent,
  clustering
}

export default logger
