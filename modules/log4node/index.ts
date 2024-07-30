import {
  configure,
  LevelEnum,
  appenders,
  Configuration
} from '@/modules/logger'
import * as stdoutAppender from './appenders/stdout'
import * as stderrAppender from './appenders/stderr'
import * as fileAppender from './appenders/file'
import * as dateFileAppender from './appenders/dateFile'
import * as fileSyncAppender from './appenders/fileSync'
import * as tcpServerAppender from './appenders/tcp-server'
import * as tcpAppender from './appenders/tcp'
import { NodeLogger } from './lib/NodeLogger'
import { treeManager } from './lib/TreeManager'
import { init } from './lib/init'
export { setDomain, setNoSample, addServer } from './lib/util/treeConfig'
export * from './connect-logger'

let enabled = false
function getLogger(
  eventType: string,
  category: string,
  transtionType?: string
) {
  if (!enabled) {
    configure({
      treeManager,
      transtionType,
      appenders: { kvs: { type: 'console' } },
      categories: {
        default: {
          appenders: ['kvs'],
          level: LevelEnum.OFF
        }
      }
    } as Configuration)
  }
  return new NodeLogger(eventType as any, category || 'default')
}

appenders.set('stdout', stdoutAppender)
appenders.set('stderr', stderrAppender)
appenders.set('file', fileAppender)
appenders.set('dateFile', dateFileAppender)
appenders.set('fileSync', fileSyncAppender)
appenders.set('tcpServer', tcpServerAppender)
appenders.set('tcp', tcpAppender)

export const requestLogger = getLogger('Message', 'Request')
export const errorLogger = getLogger('Message', 'Error')
export const trackLogger = getLogger('Message', 'Track')
export const systemLogger = getLogger('Message', 'Track', 'SystemTranscation')
export const metricLogger = getLogger('Metric', 'Track', 'MetricTransaction')
export const heartbeatLogger = getLogger('Heartbeat', 'Track')

init(systemLogger)

export default errorLogger
