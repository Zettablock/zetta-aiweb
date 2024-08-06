import { EventEmitter } from 'eventemitter3'
import { defer } from 'lodash-es'
import { LoginError } from './AuthError'
import { Deferred, getPopupFeatures } from './util'

export interface PopupResponse {
  sessionId?: string
  sessionNamespace?: string
  state?: string
  error?: string
}

export interface PopupHandlerEvents {
  close: []
}

export class WindowPopup extends EventEmitter<PopupHandlerEvents> {
  url: string

  target: string

  features: string

  window: Window | null

  windowTimer?: number

  iClosedWindow: boolean

  timeout: number

  codeDeferred = new Deferred()

  constructor({
    url,
    target,
    features,
    timeout = 30000
  }: {
    url: string
    target?: string
    features?: string
    timeout?: number
  }) {
    super()
    this.url = url
    this.target = target || '_blank'
    this.features = features || getPopupFeatures()
    this.window = null
    this.windowTimer = undefined
    this.iClosedWindow = false
    this.timeout = timeout
    this._setupTimer()
  }

  _setupTimer(): void {
    this.windowTimer = Number(
      setInterval(() => {
        if (this.window && this.window.closed) {
          clearInterval(this.windowTimer)
          setTimeout(() => {
            if (!this.iClosedWindow) {
              this.emit('close')
            }
            this.iClosedWindow = false
            this.window = null
          }, this.timeout)
        }
        if (this.window === undefined) clearInterval(this.windowTimer)
          try {
            const search = this.window?.name || ''
            if (search.startsWith('?code=')) {
              this.codeDeferred.resolve(search)
              
              clearInterval(this.windowTimer)
              this.close()
            }
        } catch(e) {

        }
        
      }, 500)
    )
  }

  open(): void {
    this.window = window.open(this.url, this.target, this.features)
    if (!this.window) throw LoginError.popupBlocked()
    if (this.window?.focus) this.window.focus()
  }

  close(): void {
    this.iClosedWindow = true
    if (this.window) this.window.close()
  }

  redirect(locationReplaceOnRedirect: boolean): void {
    if (locationReplaceOnRedirect) {
      window.location.replace(this.url)
    } else {
      window.location.href = this.url
    }
  }

  async listenOnChannel(): Promise<any> {
    this.close()

    return new Promise((resolve, reject) => {
      this.on('close', () => {
        reject(LoginError.popupClosed())
      })

      this.codeDeferred.promise.then(resolve, reject)
      try {
        this.open()
      } catch (error) {
        reject(error)
      }
    })
  }
}
