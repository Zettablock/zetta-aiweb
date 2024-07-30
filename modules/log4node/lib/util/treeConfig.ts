import util from 'util'
import os from 'os'
import path from 'path'
import fs from 'fs'
import createDebug from 'debug'
import xml from 'xml2js'
import cluster from 'cluster'

const debug = createDebug('log4node:treeConfig')

const LOG_DIR = process.env.LOG_DIR || '/data/appdatas/logs/'
const CLIENT_CONFIG_FILE = path.join(LOG_DIR, 'client.xml')
const SERVER_GROUP_FILE =
  process.env.SERVER_GROUP_FILE || '/data/webapps/appenv'

export const treeConfig = {
  servers: [] as string[],
  server: undefined as any,
  maxMessageLength: 2000,
  hostname: os.hostname(),
  domain: 'log-server',
  groupName: 'main',
  clusterId: '1',
  clusterName: 'main',
  messageId: 'null',
  parentMessageId: 'null',
  rootMessageId: 'null',
  sessionToken: 'null',
  noSample: true,
  sample: 0,
  hostGroup: process.env.HOST_GROUP_NAME,
  dataCenter: 'st2',
  logicSet: 'sh2',
  ip: getLocalIP()
}

if (!fs.existsSync(CLIENT_CONFIG_FILE)) {
  debug(util.format('Cannot read log config from ' + CLIENT_CONFIG_FILE + '.'))
} else {
  mergeConfig(CLIENT_CONFIG_FILE)
}

if (!fs.existsSync(SERVER_GROUP_FILE)) {
  debug(
    util.format('Cannot read server config from ' + SERVER_GROUP_FILE + '.')
  )
} else {
  loadServerConfig(SERVER_GROUP_FILE)
}

export function setDomain(domain: string) {
  treeConfig.domain = domain
}

export function setNoSample(noSample: boolean) {
  treeConfig.noSample = noSample
}

export function addServer(server: string) {
  if (!~treeConfig.servers.indexOf(server)) {
    treeConfig.servers.push(server)
  }
}

export function getLocalIP() {
  let ip = process.env.HOST_IP
  if (!ip) {
    const interfaces = os.networkInterfaces()
    const addresses = []
    for (const k in interfaces) {
      for (const k2 in interfaces[k]) {
        const address = (interfaces[k] as any)[k2]
        if (address.family === 'IPv4' && !address.internal) {
          addresses.push(address.address)
        }
      }
    }
    addresses.length && (ip = addresses[0])
  }
  debug('get local ip ' + ip)
  return ip
}

function mergeConfig(file: string) {
  try {
    const content = fs.readFileSync(file)
    xml.parseString(content.toString(), function (err, result) {
      if (result && result.config && result.config.servers) {
        // ip and port
        treeConfig.server = result.config.servers[0].server[0].$
        debug('Set log server ' + JSON.stringify(treeConfig.server))
      } else {
        debug('parse xml error', util.inspect(err))
      }
    })
  } catch (e) {
    debug('Read File ' + file + ' Fail')
  }
}

function loadServerConfig(file: string) {
  try {
    const content = fs.readFileSync(file) || ''
    content
      .toString()
      .split(/[(\r\n)\r\n]+/)
      .map(item => item.split('='))
      .forEach(([key, value]) => {
        if (key === 'dc') {
          treeConfig.dataCenter = value
        }
        if (key === 'set') {
          treeConfig.logicSet = value
        }
      })
  } catch (err) {
    debug('Read File ' + file + ' Fail')
  }
}

const HOUR = 3600 * 1000

let seq = 0
let hourTS: number
const clusterId = cluster.isWorker ? cluster.worker?.id : process.pid

let defaultIpHex = ''
let tmp = ''
if (treeConfig.ip) {
  const ips = treeConfig.ip.split('.')
  for (let i = 0; i < 4; ++i) {
    tmp = parseInt(ips[i]).toString(16)
    tmp.length < 2 && (tmp = '0' + tmp)
    defaultIpHex += tmp
  }
}

export function nextId(domain?: string) {
  const ts = Math.floor(Date.now() / HOUR)

  if (ts !== hourTS) {
    seq = 0
    hourTS = ts
  }

  seq++
  // first character is clusterId, will be different between cluster processes
  return [
    domain || treeConfig.domain,
    defaultIpHex,
    ts,
    clusterId + '' + seq
  ].join('-')
}
