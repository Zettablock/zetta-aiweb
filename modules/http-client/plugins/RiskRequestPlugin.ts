import { AxiosInterceptorOptions, AxiosRequestConfig } from 'axios'
import { RequestPlugin } from './BasePlugin'
import { getCurrentPlatform } from '@/modules/sniffer'

export class RiskRequestPlugin extends RequestPlugin {
  constructor(
    public options: AxiosInterceptorOptions & {
      riskHeaderName?: string
      getRiskInfo?: () => Promise<any>
    }
  ) {
    super(options)
  }

  public handle = async <V extends AxiosRequestConfig>(value: V) => {
    if (getCurrentPlatform().isNativePlatform) return value

    const riskHeaderName =
      (value as any).riskHeaderName || this.options.riskHeaderName

    if (this.options.getRiskInfo) {
      if (riskHeaderName && value.headers && value.headers[riskHeaderName]) {
        return value
      }
      const headers = await this.options.getRiskInfo()
      value.headers = {
        ...value.headers,
        ...headers
      }
    }
    return value
  }
}
