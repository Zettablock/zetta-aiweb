import net, { Socket } from 'net'
import util from 'util'
import axios from 'axios'
import createDebug from 'debug'
import { treeConfig } from './util/treeConfig'
import { tranverseTree, Tree } from './Tree'

const connectRetryTime = 3000

const debug = createDebug('log4node:sender')

let currentClient: Socket | null = null
let clientPool = [] as Socket[]
let messageQueue = [] as Tree[]
const interval = 3 * 60 * 1000
let savedRouters = [] as string[]
let immediate: NodeJS.Immediate | null = null
const HALF = 32
const MAX = 10000
const SINGLE = 100

export function init() {
  treeConfig.sample = 1
  if (!treeConfig.server) {
    debug('No log server address configed for client.')
  } else {
    const nextClient = function () {
      return clientPool[0]
    }
    const removeClient = function (client: Socket) {
      const index = clientPool.indexOf(client)
      if (index > -1) {
        clientPool.splice(index, 1)
      }
      if (currentClient === client) {
        currentClient = nextClient()
      }
    }

    const createConnection = function (port: string, ip: string) {
      debug('log create connection')
      const client = net.connect(Number(port), ip)
      client.setKeepAlive(true)
      client.setTimeout(interval, function () {
        client.removeAllListeners()
        client.destroy()
        removeClient(client)
      })

      const reconnect = function () {
        debug('log reconnect ', ip, port)
        client.removeAllListeners()
        client.destroy()
        removeClient(client)
        createConnection(port, ip)
      }

      client.on('error', function (e) {
        client.removeAllListeners()
        client.destroy()
        removeClient(client)
        debug('socket error: ' + e.message)
      })

      client.on('close', function () {
        setTimeout(reconnect, connectRetryTime)
      })

      client.once('connect', () => {
        debug('log connect to log server ', ip)
        if (!currentClient) {
          currentClient = client
        }
        clientPool.push(client)
      })
    }

    const url = `http://${treeConfig.server.ip}:${process.env.HOST_PORT || '8080'}/${process.env.HOST_LOG_ROUTER || 'log/s/router'}`

    const requestOptions = {
      url,
      method: 'get',
      params: {
        domain: treeConfig.domain,
        op: 'json',
        ip: treeConfig.ip,
        dc: treeConfig.dataCenter,
        set: treeConfig.logicSet
      }
    }

    const getServerRounters = function () {
      axios
        .request(requestOptions)
        .then(function (res) {
          // block为true 返回不做任何操作
          // clientPool=[];
          try {
            const { data } = res
            if (data.kvs.block === 'true') {
              return false
            }
            // 设置取样
            // todo
            // data.kvs.sample = '0.1';
            if (data.kvs.sample) {
              treeConfig.sample = parseFloat(data.kvs.sample) || 1
            }
            const routers = data.kvs.routers
            if (!routers) {
              return
            }
            const routersArr = routers.split(';')
            if (
              JSON.stringify(savedRouters) !== JSON.stringify(routersArr) ||
              !clientPool.length
            ) {
              clientPool = []
              // 重置currentClient
              if (currentClient && !currentClient.destroyed) {
                currentClient.removeAllListeners()
                currentClient.destroy()
              }
              currentClient = null
              savedRouters = routersArr.slice(0)
              routersArr.forEach((ipStr: string, i: number) => {
                const arr = ipStr.split(':')
                if (arr[0] && arr[1]) {
                  createConnection(arr[1], arr[0])
                }
              })
            }
          } catch (e) {
            debug('getServerRounters error:', util.inspect(e))
          }
        })
        .catch(function (err) {
          debug('getServerRounters request error:', util.inspect(err))
        })
    }

    getServerRounters()
    setInterval(getServerRounters, interval)

    execute()
  }
}

const execute = function () {
  if (currentClient) {
    let length = messageQueue.length
    if (length > MAX) {
      length = Math.floor(length / HALF)
    } else {
      if (length > SINGLE) {
        length = SINGLE
      }
    }
    for (let i = 0; i < length; i++) {
      debug('log send data')
      if (!currentClient.destroyed) {
        currentClient.write(messageQueue.shift()!.serialize())
      }
    }
    if (messageQueue.length) {
      immediate = setImmediate(execute)
    } else {
      immediate = null
    }
  } else {
    immediate = null
    messageQueue = []
  }
}

const isSample = function (tree: Tree) {
  if (treeConfig.noSample) {
    return true
  }
  if (
    (tree.root &&
      tree.root.children &&
      tree.root.children[0] &&
      tree.root.children[0].type === 'HeartBeat') ||
    tree.root.isMerge
  ) {
    return true
  }
  if (Math.random() < treeConfig.sample) {
    return true
  }
  return false
}

export function send(tree: Tree) {
  if (!treeConfig.server || !treeConfig.sample) return

  debug('log push tree')
  if (!isSample(tree)) {
    tranverseTree(tree)
    return false
  }
  messageQueue.push(tree)
  if (immediate == null) {
    immediate = setImmediate(execute)
  }
}
