import createDebug from 'debug'
import { Web3AuthNoModal } from '@web3auth/no-modal'
import { IProvider, WALLET_ADAPTERS } from '@web3auth/base'
import { authConfig } from './auth.config'
// import { z } from 'zod'
// TODO
// import { getUser } from './app/login/actions'
// import jwt from 'jsonwebtoken'
import {
  LOGIN_PROVIDER_TYPE,
  OpenloginAdapter,
  OpenloginUserInfo
} from '@web3auth/openlogin-adapter'
import { httpClient } from '@/modules/http-client'

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

const exchangeCodeForAccessToken = async (code: string) => {
  try {
    const { data } = await httpClient.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: 'Iv23liy6buSyVzRmgxmZ',
        client_secret: 'ec06305fac9021906cc065cecd7441fbc6bb005b',
        code: code
      },
      {
        headers: { Accept: 'application/json' }
      }
    )
    console.log(data)
    return data.access_token
  } catch (error) {
    console.error('Error exchanging code for access token:', error)
    throw new Error('Error during GitHub authentication')
  }
}

const fetchGitHubUserDetails = async (accessToken: string) => {
  try {
    const { data } = await httpClient.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    return data
  } catch (error) {
    console.error('Error fetching GitHub user details:', error)
    throw new Error('Failed to fetch user details')
  }
}

interface GithubUser {
  id: string
  login: string
  avatar_url: string
  name?: string
  email?: string
}

export const auth = async (
  githubCode: string | null,
  web3authCode?: string | null
): Promise<Partial<OpenloginUserInfo> | null> => {
  try {
    if (!githubCode) return null

    const accessToken = await exchangeCodeForAccessToken(githubCode)
    const userData: GithubUser = await fetchGitHubUserDetails(accessToken)
    if (typeof web3authCode === 'undefined') {
      return {
        idToken: userData.id,
        profileImage: userData.avatar_url,
        name: userData.login || userData.name,
        email: userData.email
      }
    } else if (web3auth?.connected) {
      return await web3auth.getUserInfo()
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}
