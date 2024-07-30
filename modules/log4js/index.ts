import { configure, getLogger, LevelEnum, appenders } from '@/modules/logger'
import * as segmentAppender from './appenders/segment'
import * as beaconAppender from './appenders/beacon'

appenders.set('segment', segmentAppender)
appenders.set('beacon', beaconAppender)

configure({
  appenders: {
    segment: { type: 'segment', layout: { type: 'basic' } }
  },
  categories: {
    default: { appenders: ['segment'], level: LevelEnum.TRACE }
  }
})

export const apiLogger = getLogger('Api')
export const errorLogger = getLogger('Error')
export const trackLogger = getLogger('Track')

export default errorLogger
