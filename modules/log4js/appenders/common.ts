import { LoggingEvent } from '@/modules/logger'
import { crc32 } from './crc32'

export interface IdentifyConfig {
  appId: number | string
  appType: 'pc' | 'h5' | 'miniapp'
  bizIid: number | string
  groupId: number | string
  device?: number | string
  env: number | string
  version: string
}

export enum LoggerCategory {
  Api = 'Api',
  Error = 'Error',
  Track = 'Track'
}

export const isClient = typeof window !== 'undefined'

const generateRandomStr = (len: number = 16) => {
  let res = ''
  while (res.length < len) {
    const extra = len - res.length
    res += Math.random()
      .toString(36)
      .substring(2, extra + 2)
  }
  return res
}

export function getCommonIdentify(config: IdentifyConfig) {
  return {
    app_id: config.appId,
    biz_id: config.bizIid,
    group_id: config.groupId,
    app_type: config.appType,
    device: config.device || generateRandomStr(),
    env: config.env,
    version: config.version,
    ...(isClient
      ? {
          userAgent: window.navigator.userAgent,
          language: window.navigator.language,
          platform: window.navigator.platform
        }
      : {}),
    ...(isClient
      ? {
          hostname: window.location.hostname,
          href: window.location.href,
          origin: window.location.origin,
          pathname: window.location.pathname
        }
      : {}),
    ...((isClient && (window.navigator as any).connection) ?? {})
  }
}

async function bodyStringify(body: Response['body']) {
  if (!body) return ''

  const reader = body.getReader() // `ReadableStreamDefaultReader`
  const decoder = new TextDecoder()
  const chunks = [] as string[]

  async function read() {
    const { done, value } = await reader.read()

    // all chunks have been read?
    if (done) {
      return chunks.join('')
    }

    const chunk = decoder.decode(value, { stream: true })
    chunks.push(chunk)
    return read() // read the next chunk
  }

  return read()
}

export async function getCommonTraits(logEvent: LoggingEvent) {
  const random = Number((Math.random() + '').slice(3, 9))

  const traits = {
    ...logEvent.context,
    random: random, // 随机数，int，6位
    crc32: crc32(Date.now() + '-' + random)
  }

  if (logEvent.categoryName === LoggerCategory.Api) {
    const response = logEvent.data.find((item: any) => item instanceof Response)
    if (response) {
      const bodyUsed = response.bodyUsed
      const body = bodyUsed ? await bodyStringify(response.body) : ''
      const headers = Array.from(response.headers.entries())
      const isFormData = response.headers
        .get('content-type')
        ?.includes('form-data')
      const content = isFormData ? 'formData' : await response.text()

      Object.assign(traits, {
        body,
        bodyUsed,
        headers: JSON.stringify(headers),
        ok: response.ok,
        redirected: response.redirected,
        status: response.status,
        statusText: response.statusText,
        type: response.type,
        url: response.url,
        reqLen: body.length,
        rspLen: isFormData ? -1 : content.length
      })
    }
  } else if (logEvent.categoryName === LoggerCategory.Error) {
    const error =
      logEvent.data.find((item: any) => item instanceof Error) || ({} as Error)

    Object.assign(traits, {
      errorMessage: error.message,
      stack: error.stack,
      fileName: logEvent.fileName,
      lineNumber: logEvent.lineNumber,
      columnNumber: logEvent.columnNumber,
      callStack: logEvent.callStack,
      className: logEvent.className,
      functionName: logEvent.functionName,
      functionAlias: logEvent.functionAlias,
      callerName: logEvent.callerName
    })
  }
  return traits
}
