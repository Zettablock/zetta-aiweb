/* eslint max-classes-per-file: ["error", 2] */
/* eslint no-underscore-dangle: ["error", { "allow": ["_getLocationKeys"] }] */

import flatted from 'flatted'
import { Level } from './Level'

export class SerDe {
  private deMap: any
  private serMap: any
  constructor() {
    const deserialise = {
      __LOGGER_undefined__: undefined,
      __LOGGER_NaN__: Number('abc'),
      __LOGGER_Infinity__: 1 / 0,
      '__LOGGER_-Infinity__': -1 / 0
    }
    this.deMap = deserialise
    this.serMap = {}
    Object.keys(this.deMap).forEach(key => {
      const value = this.deMap[key]
      this.serMap[value] = key
    })
  }

  canSerialise(key: string | number) {
    if (typeof key === 'string') return false
    try {
      return key in this.serMap
    } catch (e) {
      return false
    }
  }

  serialise(key: string | number) {
    if (this.canSerialise(key)) return this.serMap[key]
    return key
  }

  canDeserialise(key: string | number) {
    return key in this.deMap
  }

  deserialise(key: string | number) {
    if (this.canDeserialise(key)) return this.deMap[key]
    return key
  }
}
const serde = new SerDe()

/**
 * @name LoggingEvent
 * @namespace Logger
 */
export class LoggingEvent {
  public cluster?: {
    workerId: string
    pid?: number
  }
  public fileName?: string
  public lineNumber?: string
  public columnNumber?: string
  public callStack?: string
  public className?: string
  public functionName?: string
  public functionAlias?: string
  public callerName?: string
  public startTime: Date
  /**
   * Models a logging event.
   * @constructor
   * @param {string} categoryName name of category
   * @param {Logger.Level} level level of message
   * @param {Array} data objects to log
   * @param {Error} [error]
   * @author Seth Chisamore
   */
  constructor(
    public categoryName: string,
    public level: Level,
    public data: any[],
    public context = {} as any,
    public location?: any,
    public error?: Error,
    public pid?: number
  ) {
    this.startTime = new Date()

    if (typeof location !== 'undefined') {
      if (!location || typeof location !== 'object' || Array.isArray(location))
        throw new TypeError(
          'Invalid location type passed to LoggingEvent constructor'
        )
      ;(this.constructor as any)._getLocationKeys().forEach((key: string) => {
        if (typeof location[key] !== 'undefined')
          (this as any)[key] = location[key]
      })
    }
  }

  /** @private */
  static _getLocationKeys() {
    return [
      'fileName',
      'lineNumber',
      'columnNumber',
      'callStack',
      'className',
      'functionName',
      'functionAlias',
      'callerName'
    ]
  }

  serialise() {
    return flatted.stringify(this, (key, value) => {
      // JSON.stringify(new Error('test')) returns {}, which is not really useful for us.
      // The following allows us to serialize errors (semi) correctly.
      if (value instanceof Error) {
        // eslint-disable-next-line prefer-object-spread
        value = Object.assign(
          { message: value.message, stack: value.stack },
          value
        )
      }
      // JSON.stringify({a: Number('abc'), b: 1/0, c: -1/0}) returns {a: null, b: null, c: null}.
      // The following allows us to serialize to NaN, Infinity and -Infinity correctly.
      // JSON.stringify([undefined]) returns [null].
      // The following allows us to serialize to undefined correctly.
      return serde.serialise(value)
    })
  }

  static deserialise(serialised: string) {
    let event
    try {
      const rehydratedEvent = flatted.parse(serialised, (key, value) => {
        if (value && value.message && value.stack) {
          const fakeError = new Error(value) as any
          Object.keys(value).forEach(k => {
            fakeError[k] = value[k]
          })
          value = fakeError
        }
        return serde.deserialise(value)
      })
      this._getLocationKeys().forEach(key => {
        if (typeof rehydratedEvent[key] !== 'undefined') {
          if (!rehydratedEvent.location) rehydratedEvent.location = {}
          rehydratedEvent.location[key] = rehydratedEvent[key]
        }
      })
      event = new LoggingEvent(
        rehydratedEvent.categoryName,
        Level.getLevel(rehydratedEvent.level.levelStr),
        rehydratedEvent.data,
        rehydratedEvent.context,
        rehydratedEvent.location,
        rehydratedEvent.error
      )
      event.startTime = new Date(rehydratedEvent.startTime)
      event.pid = rehydratedEvent.pid
      if (rehydratedEvent.cluster) {
        event.cluster = rehydratedEvent.cluster
      }
    } catch (e) {
      event = new LoggingEvent('logger', Level.ERROR, [
        'Unable to parse log:',
        serialised,
        'because: ',
        String(e)
      ])
    }

    return event
  }
}
