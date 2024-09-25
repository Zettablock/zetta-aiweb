import { PopupResponse, WindowPopup } from './WindowPopup'
import { MfaSettings, UX_MODE_TYPE, UX_MODE, getTimeout } from './util'
import { InitializationError, LoginError } from './AuthError'
import { uuid } from 'uuidv4'

export type AuthUserInfo = {
  email?: string
  name?: string
  profileImage?: string
  oAuthAccessToken?: string
  appState?: string
  touchIDPreference?: string
  isMfaEnabled?: boolean
}

export interface AuthSessionData {
  userInfo?: AuthUserInfo
  metadataNonce?: string
  authToken?: string
  factorKey?: string
  signatures?: string[]
  tssShareIndex?: number
  tssPubKey?: string
  tssShare?: string
  tssNonce?: number
  nodeIndexes?: number[]
  useCoreKitKey?: boolean
}

export type AuthOptions = {
  baseUrl: string
  clientId: string
  redirectUrl?: string
  uxMode?: UX_MODE_TYPE
  replaceUrlOnRedirect?: boolean
  originData?: Record<string, string>
  storage: any
  kv: any
  mfaSettings?: MfaSettings
}

export interface LoginParams {
  baseURL: string
  query?: Record<string, unknown>
  hash?: Record<string, unknown>
}

export function constructURL(params: LoginParams): string {
  const { baseURL, query, hash } = params

  const url = new URL(baseURL)
  if (query) {
    Object.keys(query).forEach(key => {
      url.searchParams.append(key, query[key] as string)
    })
  }
  if (hash) {
    const h = new URL(
      constructURL({ baseURL, query: hash })
    ).searchParams.toString()
    url.hash = h
  }
  return url.toString()
}

export class OpenLogin {
  // state: AuthSessionData = {}
  // options: AuthOptions
  // private _storage: any
  // private _kv: any
  // constructor(options: AuthOptions) {
  //   if (!options.clientId)
  //     throw InitializationError.invalidParams('clientId is required')
  //   if (!options.redirectUrl && typeof window !== 'undefined') {
  //     options.redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
  //   }
  //   if (!options.uxMode) options.uxMode = UX_MODE.REDIRECT
  //   if (typeof options.replaceUrlOnRedirect !== 'boolean')
  //     options.replaceUrlOnRedirect = true
  //   if (!options.originData) options.originData = {}
  //   if (!options.mfaSettings) options.mfaSettings = {}
  //   this.options = options
  // }
  // async init(): Promise<void> {
  //   if (params.error) {
  //     throw LoginError.loginFailed(params.error)
  //   }
  //   if (params.sessionId) {
  //     this._storage.set('sessionId', params.sessionId)
  //     this._kv.sessionId = params.sessionId
  //   }
  //   if (this._kv.sessionId) {
  //     const data = await this._authorizeSession()
  //     // Fill state with correct info from session
  //     // If session is invalid all the data is unset here.
  //     this.updateState(data)
  //     if (Object.keys(data).length === 0) {
  //       // If session is invalid, unset the sessionId from localStorage.
  //       this._storage.set('sessionId', '')
  //     }
  //   }
  // }
  // async login(loginParams: LoginParams): Promise<{ privKey: string } | null> {
  //   const result = await this.authHandler(loginParams, getTimeout())
  //   if (this.options.uxMode === UX_MODE.REDIRECT) return null
  //   if (result?.error) {
  //     throw LoginError.loginFailed(result.error)
  //   }
  //   this._storage.set('sessionId', result.sessionId)
  //   await this.rehydrateSession()
  //   return { privKey: this.privKey }
  // }
  // async logout(): Promise<void> {
  //   if (!this._kv.sessionId) throw LoginError.userNotLoggedIn()
  //   await this._kv.invalidateSession()
  //   this.updateState({
  //     metadataNonce: '',
  //     userInfo: {
  //       name: '',
  //       profileImage: '',
  //       oAuthAccessToken: '',
  //       appState: '',
  //       email: '',
  //       isMfaEnabled: false
  //     },
  //     authToken: '',
  //     factorKey: '',
  //     signatures: [],
  //     tssShareIndex: -1,
  //     tssPubKey: '',
  //     tssShare: '',
  //     tssNonce: -1
  //   })
  //   this._storage.set('sessionId', '')
  // }
  // async enableMFA(params: Partial<LoginParams>): Promise<boolean> {
  //   if (!this.sessionId) throw LoginError.userNotLoggedIn()
  //   if (this.state.userInfo.isMfaEnabled) throw LoginError.mfaAlreadyEnabled()
  //   // in case of redirect mode, redirect url will be dapp specified
  //   // in case of popup mode, redirect url will be sdk specified
  //   const defaultParams: BaseRedirectParams = {
  //     redirectUrl: this.options.redirectUrl
  //   }
  //   const dataObject: AuthSessionConfig = {
  //     actionType: AUTH_ACTIONS.ENABLE_MFA,
  //     options: this.options,
  //     params: {
  //       ...defaultParams,
  //       ...params,
  //       loginProvider: this.state.userInfo.typeOfLogin,
  //       extraLoginOptions: {
  //         login_hint: this.state.userInfo.verifierId
  //       },
  //       mfaLevel: 'mandatory'
  //     },
  //     sessionId: this.sessionId
  //   }
  //   const result = await this.authHandler(
  //     `${this.baseUrl}/start`,
  //     dataObject,
  //     getTimeout(dataObject.params.loginProvider)
  //   )
  //   if (this.options.uxMode === UX_MODE.REDIRECT) return null
  //   if (result.error) {
  //     this.dappState = result.state
  //     throw LoginError.loginFailed(result.error)
  //   }
  //   this._kv.sessionId = result.sessionId
  //   this.options.sessionNamespace = result.sessionNamespace
  //   this._storage.set('sessionId', result.sessionId)
  //   await this.rehydrateSession()
  //   return Boolean(this.state.userInfo?.isMfaEnabled)
  // }
  // async manageMFA(params: Partial<LoginParams>): Promise<void> {
  //   if (!this.sessionId) throw LoginError.userNotLoggedIn()
  //   if (!this.state.userInfo.isMfaEnabled) throw LoginError.mfaNotEnabled()
  //   // in case of redirect mode, redirect url will be dapp specified
  //   // in case of popup mode, redirect url will be sdk specified
  //   const defaultParams = {
  //     redirectUrl: this.options.dashboardUrl,
  //     dappUrl: `${window.location.origin}${window.location.pathname}`
  //   }
  //   const loginId = _kv.generateRandomSessionKey()
  //   const dataObject: AuthSessionConfig = {
  //     actionType: AUTH_ACTIONS.MANAGE_MFA,
  //     options: this.options,
  //     params: {
  //       ...defaultParams,
  //       ...params,
  //       loginProvider: this.state.userInfo.typeOfLogin,
  //       extraLoginOptions: {
  //         login_hint: this.state.userInfo.verifierId
  //       },
  //       appState: jsonToBase64({ loginId })
  //     },
  //     sessionId: this.sessionId
  //   }
  //   this.createLoginSession(
  //     loginId,
  //     dataObject,
  //     dataObject.options.sessionTime,
  //     true
  //   )
  //   const configParams: BaseLoginParams = {
  //     loginId,
  //     sessionNamespace: this.options.sessionNamespace,
  //     storageServerUrl: this.options.storageServerUrl
  //   }
  //   const loginUrl = constructURL({
  //     baseURL: `${this.baseUrl}/start`,
  //     hash: { b64Params: jsonToBase64(configParams) }
  //   })
  //   window.open(loginUrl, '_blank')
  // }
  // async changeSocialFactor(
  //   params: Partial<BaseRedirectParams>
  // ): Promise<boolean> {
  //   if (!this.sessionId) throw LoginError.userNotLoggedIn()
  //   // in case of redirect mode, redirect url will be dapp specified
  //   // in case of popup mode, redirect url will be sdk specified
  //   const defaultParams: BaseRedirectParams = {
  //     redirectUrl: this.options.redirectUrl
  //   }
  //   const dataObject: AuthSessionConfig = {
  //     actionType: AUTH_ACTIONS.MODIFY_SOCIAL_FACTOR,
  //     options: this.options,
  //     params: {
  //       ...defaultParams,
  //       ...params
  //     },
  //     sessionId: this.sessionId
  //   }
  //   const result = await this.authHandler(`${this.baseUrl}/start`, dataObject)
  //   if (this.options.uxMode === UX_MODE.REDIRECT) return undefined
  //   if (result.error) return false
  //   return true
  // }
  // getUserInfo(): AuthUserInfo {
  //   if (!this._kv.sessionId) {
  //     throw LoginError.userNotLoggedIn()
  //   }
  //   return this.state.userInfo
  // }
  // private async createLoginSession(
  //   loginId: string,
  //   data: AuthSessionConfig,
  //   timeout = 600,
  //   skipAwait = false
  // ): Promise<void> {
  //   if (!this._kv) throw InitializationError.notInitialized()
  //   const loginSessionMgr = new _kv<AuthSessionConfig>({
  //     sessionServerBaseUrl: data.options.storageServerUrl,
  //     sessionNamespace: data.options.sessionNamespace,
  //     sessionTime: timeout, // each login key must be used with 10 mins (might be used at the end of popup redirect)
  //     sessionId: loginId
  //   })
  //   const promise = loginSessionMgr.createSession(
  //     JSON.parse(JSON.stringify(data))
  //   )
  //   if (data.options.uxMode === UX_MODE.REDIRECT && !skipAwait) {
  //     await promise
  //   }
  // }
  // private async _authorizeSession(): Promise<AuthSessionData> {
  //   try {
  //     if (!this._kv.sessionId) return {}
  //     const result = await this._kv.authorizeSession()
  //     return result
  //   } catch (err) {
  //     console.error('authorization failed', err)
  //     return {}
  //   }
  // }
  // private updateState(data: Partial<AuthSessionData>) {
  //   this.state = { ...this.state, ...data }
  // }
  // private async rehydrateSession(): Promise<void> {
  //   const result = await this._authorizeSession()
  //   this.updateState(result)
  // }
  // private async authHandler(
  //   params: {
  //     baseURL: string
  //     query?: Record<string, unknown>
  //     hash?: Record<string, unknown>
  //   },
  //   popupTimeout = 1000 * 10
  // ): Promise<PopupResponse | undefined> {
  //   const loginId = uuid()
  //   const loginUrl = constructURL(params)
  //   if (this.options.uxMode === UX_MODE.REDIRECT) {
  //     window.location.href = loginUrl
  //     return undefined
  //   }
  //   const currentWindow = new WindowPopup({
  //     url: loginUrl,
  //     timeout: popupTimeout
  //   })
  //   return new Promise((resolve, reject) => {
  //     currentWindow.on('close', () => {
  //       reject(LoginError.popupClosed())
  //     })
  //     currentWindow.listenOnChannel(loginId).then(resolve).catch(reject)
  //     try {
  //       currentWindow.open()
  //     } catch (error) {
  //       reject(error)
  //     }
  //   })
  // }
}
