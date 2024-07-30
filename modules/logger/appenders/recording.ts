import createDebug from 'debug'
import { LoggingEvent } from '../LoggingEvent'
import { Configuration } from '../configuration'

const debug = createDebug('logger:recording')

const recordedEvents = [] as LoggingEvent[]

export function configure(config: Configuration & { maxLength?: number }) {
  return function (logEvent: LoggingEvent) {
    debug(
      `received logEvent, number of events now ${recordedEvents.length + 1}`
    )
    debug('log event was ', logEvent)
    if (config.maxLength && recordedEvents.length >= config.maxLength) {
      recordedEvents.shift()
    }
    recordedEvents.push(logEvent)
  }
}

export function replay() {
  return recordedEvents.slice()
}

export function reset() {
  recordedEvents.length = 0
}

export const playback = replay

export const erase = reset
