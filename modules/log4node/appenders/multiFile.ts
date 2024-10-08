import createDebug from 'debug'
import path from 'path'
import * as fileAppender from './file'
import { Configuration, LoggingEvent } from '@/modules/logger'

const debug = createDebug('log4node:multiFile')

const findFileKey = (property: string, event: LoggingEvent) =>
  (event as any)[property] || event.context[property]

export const configure = (
  config: Configuration & {
    property: string
    base: string
    timeout?: number
    extension: string
    mode?: number | string
    filename: string
    maxLogSize: number
    backups: number
    timezoneOffset?: number
  },
  layouts: any
) => {
  debug('Creating a multi-file appender')
  const files = new Map()
  const timers = new Map()

  function checkForTimeout(fileKey: string) {
    const timer = timers.get(fileKey)
    const app = files.get(fileKey)
    /* istanbul ignore else: failsafe */
    if (timer && app) {
      if (Date.now() - timer.lastUsed > timer.timeout) {
        debug('%s not used for > %d ms => close', fileKey, timer.timeout)
        clearInterval(timer.interval)
        timers.delete(fileKey)
        files.delete(fileKey)
        app.shutdown((err: Error) => {
          if (err) {
            debug('ignore error on file shutdown: %s', err.message)
          }
        })
      }
    } else {
      // will never get here as files and timers are coupled to be added and deleted at same place
      debug('timer or app does not exist')
    }
  }

  const appender = (logEvent: LoggingEvent) => {
    const fileKey = findFileKey(config.property, logEvent)
    debug('fileKey for property ', config.property, ' is ', fileKey)
    if (fileKey) {
      let file = files.get(fileKey)
      debug('existing file appender is ', file)
      if (!file) {
        debug('creating new file appender')
        config.filename = path.join(config.base, fileKey + config.extension)
        file = fileAppender.configure(config, layouts)
        files.set(fileKey, file)
        if (config.timeout) {
          debug('creating new timer')
          timers.set(fileKey, {
            timeout: config.timeout,
            lastUsed: Date.now(),
            interval: setInterval(
              checkForTimeout.bind(null, fileKey),
              config.timeout
            )
          })
        }
      } else if (config.timeout) {
        debug('%s extending activity', fileKey)
        timers.get(fileKey).lastUsed = Date.now()
      }

      file(logEvent)
    } else {
      debug('No fileKey for logEvent, quietly ignoring this log event')
    }
  }

  appender.shutdown = (cb: (err?: Error) => void) => {
    let shutdownFunctions = files.size
    if (shutdownFunctions <= 0) {
      cb()
    }
    let error: Error
    timers.forEach((timer, fileKey) => {
      debug('clearing timer for ', fileKey)
      clearInterval(timer.interval)
    })
    files.forEach((app, fileKey) => {
      debug('calling shutdown for ', fileKey)
      app.shutdown((err: Error) => {
        error = error || err
        shutdownFunctions -= 1
        if (shutdownFunctions <= 0) {
          cb(error)
        }
      })
    })
  }

  return appender
}
