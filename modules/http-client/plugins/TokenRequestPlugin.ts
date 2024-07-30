import { AxiosInterceptorOptions, AxiosRequestConfig } from 'axios'
import { RequestPlugin } from './BasePlugin'

export class TokenRequestPlugin extends RequestPlugin {
  constructor(
    public options: AxiosInterceptorOptions & {
      tokenHeaderName?: string
      getTokenHeader?: () => Promise<any>
    }
  ) {
    super(options)
  }

  public async handle<V extends AxiosRequestConfig>(value: V) {
    const tokenHeaderName =
      (value as any).tokenHeaderName || this.options.tokenHeaderName

    if (this.options.getTokenHeader) {
      if (tokenHeaderName && value.headers && value.headers[tokenHeaderName]) {
        return value
      }
      const headers = await this.options.getTokenHeader()
      value.headers = {
        ...value.headers,
        ...headers
      }
    }
    return value
  }
}
