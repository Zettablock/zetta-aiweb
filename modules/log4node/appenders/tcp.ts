import { Configuration, LoggingEvent } from '@/modules/logger'
import createDebug from 'debug'
import net, { Socket } from 'net'

const debug = createDebug('log4node:tcp')

function appender(
  config: Configuration & {
    loggerPort?: number
    loggerHost?: string
    endMsg?: string
  },
  layout: (logEvent: LoggingEvent) => string
) {
  let canWrite = false
  const buffer = [] as LoggingEvent[]
  let socket: Socket
  let shutdownAttempts = 3
  let endMsg = '__LOG4NODE__'

  function write(loggingEvent: LoggingEvent) {
    debug('Writing log event to socket')
    canWrite = socket.write(`${layout(loggingEvent)}${endMsg}`, 'utf8')
  }

  function emptyBuffer() {
    let evt
    debug('emptying buffer')
    while ((evt = buffer.shift())) {
      write(evt)
    }
  }

  function createSocket() {
    debug(
      `appender creating socket to ${config.loggerHost || 'localhost'}:${
        config.loggerPort || 5000
      }`
    )
    endMsg = `${config.endMsg || '__LOG4NODE__'}`
    socket = net.createConnection(
      config.loggerPort || 5000,
      config.loggerHost || 'localhost'
    )
    socket.on('connect', () => {
      debug('socket connected')
      emptyBuffer()
      canWrite = true
    })
    socket.on('drain', () => {
      debug('drain event received, emptying buffer')
      canWrite = true
      emptyBuffer()
    })
    socket.on('timeout', socket.end.bind(socket))
    socket.on('error', e => {
      debug('connection error', e)
      canWrite = false
      emptyBuffer()
    })
    socket.on('close', createSocket)
  }

  createSocket()

  function log(loggingEvent: LoggingEvent) {
    if (canWrite) {
      write(loggingEvent)
    } else {
      debug('buffering log event because it cannot write at the moment')
      buffer.push(loggingEvent)
    }
  }

  log.shutdown = function (cb: () => void) {
    debug('shutdown called')
    if (buffer.length && shutdownAttempts) {
      debug('buffer has items, waiting 100ms to empty')
      shutdownAttempts -= 1
      setTimeout(() => {
        log.shutdown(cb)
      }, 100)
    } else {
      socket.removeAllListeners('close')
      socket.end(cb)
    }
  }
  return log
}

export function configure(
  config: Configuration & {
    loggerPort?: number
    loggerHost?: string
    endMsg?: string
  },
  layouts: any
) {
  debug(`configure with config = ${config}`)
  let layout = function (loggingEvent: LoggingEvent) {
    return loggingEvent.serialise()
  }
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout)
  }
  return appender(config, layout)
}
