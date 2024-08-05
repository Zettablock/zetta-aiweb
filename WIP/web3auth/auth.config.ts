import type { Web3AuthNoModal } from '@web3auth/no-modal'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'
import { CHAIN_NAMESPACES, UX_MODE, WEB3AUTH_NETWORK } from '@web3auth/base'
import { OpenloginAdapterOptions } from '@web3auth/openlogin-adapter'

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0x1',
  rpcTarget: 'https://rpc.ankr.com/eth',
  displayName: 'Ethereum Testnet',
  blockExplorerUrl: 'https://etherscan.io/',
  ticker: 'ETH',
  tickerName: 'Ethereum',
  logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
}
export const authConfig = {
  clientId:
    'BPL3-0HC7TXvXpEKFA_SZhAG-HFzhDEqwC-2nT2AY6XMxrEaXxqVxDUBOfeKuQIc_mOYwXcj4sqFM_paz5I0nj8',
  web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET,
  privateKeyProvider: new EthereumPrivateKeyProvider({
    config: { chainConfig }
  }),
  uiConfig: {
    appName: 'W3A Heroes',
    appUrl: 'https://web3auth.io',
    logoLight: 'https://web3auth.io/images/web3authlog.png',
    logoDark: 'https://web3auth.io/images/web3authlogodark.png',
    defaultLanguage: 'pt', // en, de, ja, ko, zh, es, fr, pt, nl
    mode: 'dark', // whether to enable dark mode. defaultValue: false
    theme: {
      primary: '#768729'
    },
    useLogoLoader: true
  },
  adapterSettings: {
    uxMode: UX_MODE.REDIRECT,
    mfaSettings: {
      deviceShareFactor: {
        enable: true,
        priority: 1,
        mandatory: true
      },
      backUpShareFactor: {
        enable: true,
        priority: 2,
        mandatory: false
      },
      socialBackupFactor: {
        enable: true,
        priority: 3,
        mandatory: false
      },
      passwordFactor: {
        enable: true,
        priority: 4,
        mandatory: true
      }
    }
  },
  loginSettings: {
    mfaLevel: 'optional'
  }
} as Web3AuthNoModal['coreOptions'] & OpenloginAdapterOptions
