export function getPopupFeatures(): string {
  if (typeof window === 'undefined') return ''
  // Fixes dual-screen position                             Most browsers      Firefox
  const dualScreenLeft =
    window.screenLeft !== undefined ? window.screenLeft : window.screenX
  const dualScreenTop =
    window.screenTop !== undefined ? window.screenTop : window.screenY

  const w = 1200
  const h = 700

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : window.screen.width

  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : window.screen.height

  const systemZoom = 1 // No reliable estimate

  const left = Math.abs((width - w) / 2 / systemZoom + dualScreenLeft)
  const top = Math.abs((height - h) / 2 / systemZoom + dualScreenTop)
  const features = `titlebar=0,toolbar=0,status=0,location=0,menubar=0,height=${h / systemZoom},width=${w / systemZoom},top=${top},left=${left}`
  return features
}

export type HashQueryParamResult = {
  sessionId?: string
  sessionNamespace?: string
  error?: string
  state?: string
}

export function getTimeout(isMobileOrTablet?: boolean) {
  if (isMobileOrTablet) {
    return 1000 * 60 * 5 // 5 minutes to finish the login
  }
  return 1000 * 10 // 10 seconds
}

export const UX_MODE = {
  POPUP: 'popup',
  REDIRECT: 'redirect'
} as const

export type UX_MODE_TYPE = (typeof UX_MODE)[keyof typeof UX_MODE]

export const MFA_FACTOR = {
  DEVICE: 'deviceShareFactor',
  BACKUP_SHARE: 'backUpShareFactor',
  SOCIAL_BACKUP: 'socialBackupFactor',
  PASSWORD: 'passwordFactor',
  PASSKEYS: 'passkeysFactor',
  AUTHENTICATOR: 'authenticatorFactor'
} as const
export type MFA_FACTOR_TYPE = (typeof MFA_FACTOR)[keyof typeof MFA_FACTOR]
export type MFA_SETTINGS = {
  enable: boolean
  priority?: number
  mandatory?: boolean
}

export type MfaSettings = Partial<Record<MFA_FACTOR_TYPE, MFA_SETTINGS>>

export class Deferred<T> {
  private readonly _promise: Promise<T>
  private _resolve: (value: T | PromiseLike<T>) => void
  private _reject: (reason?: any) => void

  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  get promise(): Promise<T> {
    return this._promise
  }

  resolve = (value = undefined as T | PromiseLike<T>): void => {
    this._resolve(value)
  }

  reject = (reason?: any): void => {
    this._reject(reason)
  }
}
