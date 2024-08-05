import { getHttpClient } from './client'

export * from './decorator'
export * from './plugins'

export const defaultPlguinsConfig = {
  TokenRequestPlugin: {
    enable: true
  },
  ForwardRequestPlugin: {
    enable: true
  },
  RiskRequestPlugin: {
    enable: true
  },
  ErrorResponsePlugin: {
    enable: true
  },
  FallbackResponsePlugin: {
    enable: true
  },
  ValidateResponsePlugin: {
    enable: true
  }
}

export const httpClient = getHttpClient(
  { withCredentials: true },
  res => res.data.data,
  defaultPlguinsConfig
)
