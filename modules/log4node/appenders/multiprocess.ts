import createDebug from 'debug'
import net, { Socket } from 'net'
import {
  AppenderFn,
  Configuration,
  Level,
  LoggingEvent
} from '@/modules/logger'

const debug = createDebug('log4node:multiprocess')

const END_MSG = '__LOG4NODE__'

/**
 * Creates a server, listening on config.loggerPort, config.loggerHost.
 * Output goes to config.actualAppender (config.appender is used to
 * set up that appender).
 */
function logServer(
  config: Configuration & {
    mode?: number | string
    loggerPort?: number
    loggerHost?: string
  },
  actualAppender: AppenderFn
) {
  /**
   * Takes a utf-8 string, returns an object with
   * the correct log properties.
   */
  function deserializeLoggingEvent(clientSocket: Socket, msg: string) {
    debug('(master) deserialising log event')
    const loggingEvent = LoggingEvent.deserialise(msg) as any
    loggingEvent.remoteAddress = clientSocket.remoteAddress
    loggingEvent.remotePort = clientSocket.remotePort

    return loggingEvent
  }

  const server = net.createServer(clientSocket => {
    debug('(master) connection received')
    clientSocket.setEncoding('utf8')
    let logMessage = ''

    function logTheMessage(msg: string) {
      debug('(master) deserialising log event and sending to actual appender')
      actualAppender(deserializeLoggingEvent(clientSocket, msg))
    }

    function chunkReceived(chunk?: string) {
      debug('(master) chunk of data received')
      let event
      logMessage += chunk || ''
      if (logMessage.indexOf(END_MSG) > -1) {
        event = logMessage.slice(0, logMessage.indexOf(END_MSG))
        logTheMessage(event)
        logMessage = logMessage.slice(event.length + END_MSG.length) || ''
        // check for more, maybe it was a big chunk
        chunkReceived()
      }
    }

    function handleError(error: Error) {
      const loggingEvent = {
        startTime: new Date(),
        categoryName: 'log4node',
        level: Level.ERROR,
        data: ['A worker log process hung up unexpectedly', error],
        remoteAddress: clientSocket.remoteAddress,
        remotePort: clientSocket.remotePort
      }
      actualAppender(loggingEvent)
    }

    clientSocket.on('data', chunkReceived)
    clientSocket.on('end', chunkReceived)
    clientSocket.on('error', handleError)
  })

  server.listen(
    config.loggerPort || 5000,
    config.loggerHost || ('localhost' as any),
    ((e: Error) => {
      debug('(master) master server listening, error was ', e)
      // allow the process to exit, if this is the only socket active
      server.unref()
    }) as any
  )

  function app(event: LoggingEvent) {
    debug('(master) log event sent directly to actual appender (local event)')
    return actualAppender(event)
  }

  app.shutdown = function (cb: () => void) {
    debug('(master) master shutdown called, closing server')
    server.close(cb)
  }

  return app
}

function workerAppender(
  config: Configuration & {
    mode?: number | string
    loggerPort?: number
    loggerHost?: string
  }
) {
  let canWrite = false
  const buffer = [] as LoggingEvent[]
  let socket: Socket
  let shutdownAttempts = 3

  function write(loggingEvent: LoggingEvent) {
    debug('(worker) Writing log event to socket')
    socket.write(loggingEvent.serialise(), 'utf8')
    socket.write(END_MSG, 'utf8')
  }

  function emptyBuffer() {
    let evt
    debug('(worker) emptying worker buffer')
    while ((evt = buffer.shift())) {
      write(evt)
    }
  }

  function createSocket() {
    debug(
      `(worker) worker appender creating socket to ${
        config.loggerHost || 'localhost'
      }:${config.loggerPort || 5000}`
    )
    socket = net.createConnection(
      config.loggerPort || 5000,
      config.loggerHost || 'localhost'
    )
    socket.on('connect', () => {
      debug('(worker) worker socket connected')
      emptyBuffer()
      canWrite = true
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
      debug(
        '(worker) worker buffering log event because it cannot write at the moment'
      )
      buffer.push(loggingEvent)
    }
  }
  log.shutdown = function (cb: () => void) {
    debug('(worker) worker shutdown called')
    if (buffer.length && shutdownAttempts) {
      debug('(worker) worker buffer has items, waiting 100ms to empty')
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

function createAppender(
  config: Configuration & {
    mode?: number | string
    loggerPort?: number
    loggerHost?: string
  },
  appender: AppenderFn
) {
  if (config.mode === 'master') {
    debug('Creating master appender')
    return logServer(config, appender)
  }

  debug('Creating worker appender')
  return workerAppender(config)
}

export function configure(
  config: Configuration & {
    mode?: number | string
    loggerPort?: number
    loggerHost?: string
  },
  layouts: any,
  findAppender: (appender?: string) => AppenderFn
) {
  let appender!: AppenderFn
  debug(`configure with mode = ${config.mode}`)
  if (config.mode === 'master') {
    if (!config.appender) {
      debug(`no appender found in config ${config}`)
      throw new Error('multiprocess master must have an "appender" defined')
    }
    debug(`actual appender is ${config.appender}`)
    appender = findAppender(config.appender)
    if (!appender) {
      debug(`actual appender "${config.appender}" not found`)
      throw new Error(
        `multiprocess master appender "${config.appender}" not defined`
      )
    }
  }
  return createAppender(config, appender)
}
