import { clustering, Configuration, LoggingEvent } from '@/modules/logger'
import createDebug from 'debug'
import net from 'net'

const debug = createDebug('log4node:tcp-server')

const DELIMITER = '__LOG4NODE__'

export const configure = (
  config: Configuration & { loggerPort?: number; loggerHost?: string }
) => {
  debug('configure called with ', config)

  const server = net.createServer(socket => {
    let dataSoFar = ''
    const send = (data: string) => {
      if (data) {
        dataSoFar += data
        if (dataSoFar.indexOf(DELIMITER)) {
          const events = dataSoFar.split(DELIMITER)
          if (!dataSoFar.endsWith(DELIMITER)) {
            dataSoFar = events.pop()!
          } else {
            dataSoFar = ''
          }
          events
            .filter(e => e.length)
            .forEach(e => {
              clustering.send(LoggingEvent.deserialise(e))
            })
        } else {
          dataSoFar = ''
        }
      }
    }
    socket.setEncoding('utf8')
    socket.on('data', send)
    socket.on('end', send)
  })

  server.listen(
    config.loggerPort || 5000,
    config.loggerHost || 'localhost',
    () => {
      debug(
        `listening on ${config.loggerHost || 'localhost'}:${config.loggerPort || 5000}`
      )
      server.unref()
    }
  )

  return {
    shutdown: (cb: () => void) => {
      debug('shutdown called.')
      server.close(cb)
    }
  }
}
