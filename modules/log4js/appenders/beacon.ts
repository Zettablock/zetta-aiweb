import createDebug from 'debug'
import { Configuration, LoggingEvent } from '@/modules/logger'

import { getCommonIdentify, getCommonTraits, IdentifyConfig } from './common'

const debug = createDebug('log4js:xhr')

const send = (url: string, data: string) => {
  try {
    if (window && navigator?.sendBeacon) {
      const success = navigator.sendBeacon(url, data)
      if (success) return
    }
    sendXhr(url, data)
  } catch (err) {
    debug('send error', err)
  }
}

const sendXhr = (url: string, data: string) => {
  var xhr = new XMLHttpRequest()
  xhr.open('POST', url, true)
  xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8')
  xhr.withCredentials = true
  xhr.send(data)
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
      }
    }
  }
}

function beaconAppender(
  layout: (loggingEvent: LoggingEvent) => string,
  config: IdentifyConfig & { logApi: string }
) {
  return (loggingEvent: LoggingEvent, context?: any) => {
    send(
      config.logApi,
      Object.assign(
        getCommonIdentify(config),
        getCommonTraits(loggingEvent),
        context,
        { logContent: layout(loggingEvent) }
      )
    )
  }
}

export function configure(
  config: Configuration & IdentifyConfig & { logApi: string },
  layouts: any
) {
  let layout = layouts.basic
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout)
  }
  return beaconAppender(layout, config)
}
