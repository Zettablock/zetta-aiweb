import { Web3AuthNoModal } from '@web3auth/no-modal'
import createDebug from 'debug'
import { IProvider, WALLET_ADAPTERS } from '@web3auth/base'
import { authConfig } from './auth.config'
// import { z } from 'zod'
// TODO
// import { getUser } from './app/login/actions'
import {
  LOGIN_PROVIDER_TYPE,
  OpenloginAdapter
} from '@web3auth/openlogin-adapter'

const debug = createDebug('App-Auth')
let web3auth: Web3AuthNoModal | null = null
let web3authProvider: IProvider | null = null

export const signIn = async () => {
  if (!web3auth) {
    debug('web3auth not initialized yet')
  }
  web3auth = new Web3AuthNoModal({
    clientId: authConfig.clientId,
    web3AuthNetwork: authConfig.web3AuthNetwork,
    privateKeyProvider: authConfig.privateKeyProvider,
    uiConfig: authConfig.uiConfig
  })

  const openloginAdapter = new OpenloginAdapter({
    adapterSettings: authConfig.adapterSettings,
    loginSettings: authConfig.loginSettings,
    privateKeyProvider: authConfig.privateKeyProvider
  })

  web3auth.configureAdapter(openloginAdapter)
  await web3auth.init()

  web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
    loginProvider: 'github' as LOGIN_PROVIDER_TYPE
  })
}

export const auth = async () => {
  if (web3auth?.connected) {
    return await web3auth.getUserInfo()
  }
  return null
}
