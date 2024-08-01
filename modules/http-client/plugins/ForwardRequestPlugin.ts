import { AxiosInterceptorOptions, AxiosRequestConfig } from 'axios'
import { RequestPlugin } from './BasePlugin'

export class ForwardRequestPlugin extends RequestPlugin {
  constructor(
    public options: AxiosInterceptorOptions & {
      forwardQuery?: () => any
      forwardCookies?: () => any
      forwardHeaders?: () => any
    }
  ) {
    super(options)
  }

  public handle = <V extends AxiosRequestConfig>(value: V) => {
    if (this.options.forwardQuery) {
      value.params = {
        ...value.params,
        ...this.options.forwardQuery()
      }
    }
    if (this.options.forwardHeaders) {
      value.headers = {
        ...value.headers,
        ...this.options.forwardHeaders()
      }
    }
    if (this.options.forwardCookies) {
      let cookie = value.headers?.Cookie || ''
      const cookies = this.options.forwardCookies()
      Object.keys(cookies).forEach(key => {
        cookie += `${key}=${cookies[key]}; `
      })
      value.headers!.Cookie = cookie
      const etag = cookies.ETag
      if (etag) {
        value.headers!.ETag = etag
      }
    }
    return value
  }
}
