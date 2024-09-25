import { AnalyticsBrowser } from '@segment/analytics-next'
import { Configuration, LoggingEvent } from '@/modules/logger'

import {
  getCommonIdentify,
  getCommonTraits,
  isClient,
  IdentifyConfig
} from './common'

function segmentAppender(
  layout: (loggingEvent: LoggingEvent) => string,
  config: IdentifyConfig & {
    analytics: AnalyticsBrowser
  }
) {
  const analytics =
    (isClient && ((window as any).analytics as AnalyticsBrowser)) ||
    config.analytics
  analytics.identify(getCommonIdentify(config))
  return (loggingEvent: LoggingEvent, context?: any) => {
    analytics.track(
      layout(loggingEvent),
      Object.assign(getCommonTraits(loggingEvent), context)
    )
  }
}

export function configure(
  config: Configuration &
    IdentifyConfig & {
      analytics: AnalyticsBrowser
    },
  layouts: any
) {
  let layout = layouts.basic
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout)
  }
  return segmentAppender(layout, config)
}
