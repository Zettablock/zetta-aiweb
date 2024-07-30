import os from 'os'
import v8 from 'v8'
import util from 'util'
import { exec, execSync } from 'child_process'
import createDebug from 'debug'
import { date2str } from './util/time'
import { diskUsage, memoryUsage } from './util/usage'
import * as time from './util/time'
import { treeConfig } from './util/treeConfig'
import { NodeLogger } from './NodeLogger'
import * as sender from './sender'
import { transMergeInfo, eventMergeInfo } from './Tree'

const debug = createDebug('log4node:init')

const iexec = util.promisify(exec)

const userName = execSync('whoami', {
  encoding: 'utf8',
  timeout: 1000
}).replace('\n', '')

class SystemInfo {
  private name: string
  private attrs: any
  private content?: string
  private children: SystemInfo[]
  constructor(name: string, attrs = {} as any, content?: string) {
    this.name = name
    this.attrs = attrs
    this.content = content

    this.children = []
  }

  toString() {
    // to xml item
    let tag = '<' + this.name
    const attrKeys = Object.keys(this.attrs)
    if (attrKeys.length) {
      tag +=
        ' ' +
        attrKeys.map(key => key + '=' + '"' + this.attrs[key] + '"').join(' ')
    }

    if (this.children.length) {
      tag += '>\n'
      this.children.forEach(child => {
        tag += child.toString()
      })
      tag += '</' + this.name + '>\n'
    } else if (this.content) {
      tag += '>' + this.content + '</' + this.name + '>\n'
    } else {
      tag += '/>\n'
    }
    return tag
  }

  addChild(childInfo: any) {
    // child 必须是SystemInfo的实例
    if (childInfo && childInfo instanceof SystemInfo) {
      this.children.push(childInfo)
    }
  }
}

async function collectSysInfo(systemLogger: NodeLogger) {
  const pm2_id = process.env.NODE_APP_INSTANCE

  if (pm2_id) {
    try {
      if (Number(pm2_id) % os.cpus().length !== 0) {
        return
      }
    } catch (e) {}
  }

  async function getCpuUsage() {
    if (process.env.LXCFS_PATH) {
      const result = { user: 0, sys: 0, idle: 0, total: 0 }
      try {
        const { stdout, stderr } = await iexec(
          `cat ${process.env.LXCFS_PATH}/proc/stat |grep -w cpu`,
          {
            timeout: 1000
          }
        )
        const str = (stdout as any).toString('UTF-8')
        let arr = [] as string[]
        if (str) {
          arr = str.split(/\W+/)
        }
        const user = parseInt(arr[1], 10) || 0
        const nice = parseInt(arr[2], 10) || 0
        const system = parseInt(arr[3], 10) || 0
        const idle = parseInt(arr[4], 10) || 0
        const iowait = parseInt(arr[5], 10) || 0
        const irq = parseInt(arr[6], 10) || 0
        const softirq = parseInt(arr[7], 10) || 0
        const total = user + nice + system + idle + iowait + irq + softirq
        result.user = user
        result.sys = system
        result.idle = idle
        result.total = total
        return result
      } catch (e) {
        console.error('getCpuUsage in  /proc/stat error', e)
      }
    }

    const cpuUsage = os.cpus()
    const statics = { user: 0, sys: 0, idle: 0, all: 0 }

    cpuUsage.forEach(c => {
      const times = c.times
      const user = Number(times.user)
      const nice = Number(times.nice)
      const sys = Number(times.sys)
      const idle = Number(times.idle)
      const irq = Number(times.irq)

      statics.user = statics.user + user
      statics.sys = statics.sys + sys
      statics.idle = statics.idle + idle
      statics.all = statics.all + user + nice + sys + idle + irq
    })

    return {
      user: statics.user,
      sys: statics.sys,
      idle: statics.idle,
      total: statics.all
    }
  }

  async function sys() {
    const mem = memoryUsage()
    const totalMemory = mem.totalMem
    const freeMemory = mem.freeMem
    const heap = v8.getHeapStatistics()
    const loadAverage = os.loadavg()[0]
    const rootDisk = diskUsage('/')
    const dataDisk = diskUsage('/data')
    const cpuUsage = await getCpuUsage()

    // build system xml

    // status is root node
    const status = new SystemInfo('status', {
      timestamp: date2str(new Date())
    })

    // runtime
    const runtime = new SystemInfo('runtime', {
      'start-time': +new Date(),
      'up-time': os.uptime(),
      'node-version': process.version,
      'user-name': userName
    })
    runtime.addChild(new SystemInfo('user-dir', {}, '/'))
    status.addChild(runtime)
    const systemCpuLoad =
      (cpuUsage.total - startCpuUsage.total === 0
        ? cpuUsage.sys / cpuUsage.total
        : (cpuUsage.sys - startCpuUsage.sys) /
          (cpuUsage.total - startCpuUsage.total)) * 100
    const processCpuLoad =
      (cpuUsage.total - startCpuUsage.total === 0
        ? cpuUsage.user / cpuUsage.total
        : (cpuUsage.user - startCpuUsage.user) /
          (cpuUsage.total - startCpuUsage.total)) * 100
    // os
    status.addChild(
      new SystemInfo('os', {
        name: os.type(),
        arch: os.arch(),
        'available-processors': os.cpus().length,
        'system-load-average': loadAverage,
        'system-cpu-load': systemCpuLoad,
        'process-cpu-load': processCpuLoad,
        'total-physical-memory': totalMemory,
        'free-physical-memory': freeMemory,
        'total-swap-space': mem.totalSwap,
        'free-swap-space': mem.freeSwap
      })
    )

    // reset startCpuUsage
    startCpuUsage = cpuUsage

    // disk
    const disk = new SystemInfo('disk')
    if (rootDisk) {
      disk.addChild(
        new SystemInfo('disk-volume', {
          id: '/',
          total: rootDisk.total,
          free: rootDisk.free,
          usable: rootDisk.available
        })
      )
    }
    if (dataDisk) {
      disk.addChild(
        new SystemInfo('disk-volume', {
          id: '/data',
          total: dataDisk.total,
          free: dataDisk.free,
          usable: dataDisk.available
        })
      )
    }
    status.addChild(disk)

    // memory
    const memory = new SystemInfo('memory', {
      max: totalMemory,
      total: totalMemory,
      free: freeMemory,
      'heap-usage': heap.total_heap_size,
      'non-heap-usage': heap.total_heap_size - heap.used_heap_size
    })
    status.addChild(memory)
    // TODO gc
    memory.addChild(
      new SystemInfo('gc', {
        name: 'ParNew',
        count: 0,
        time: 0
      })
    )
    memory.addChild(
      new SystemInfo('gc', {
        name: 'ConcurrentMarkSweep',
        count: 0,
        time: 0
      })
    )
    // thread
    const thread = new SystemInfo('thread', {
      count: '235',
      'daemon-count': '232',
      'peek-count': '243',
      'total-started-count': '3156',
      'log-thread-count': '0',
      'pigeon-thread-count': '0',
      'http-thread-count': '0'
    })
    thread.addChild(new SystemInfo('dump'))
    status.addChild(thread)

    // message
    status.addChild(
      new SystemInfo('message', {
        produced: '0',
        overflowed: '0',
        bytes: '0'
      })
    )

    // System Extension
    const systemExtension = new SystemInfo('extension', {
      id: 'System'
    })
    status.addChild(systemExtension)
    systemExtension.addChild(
      new SystemInfo('extensionDetail', {
        id: 'LoadAverage',
        value: loadAverage
      })
    )
    systemExtension.addChild(
      new SystemInfo('extensionDetail', {
        id: 'FreePhysicalMemory',
        value: freeMemory
      })
    )
    systemExtension.addChild(
      new SystemInfo('extensionDetail', {
        id: 'Cache/Buffer',
        value: mem.freeCache / 1024 / 1024
      })
    )
    systemExtension.addChild(
      new SystemInfo('extensionDetail', {
        id: 'FreeSwapSpaceSize',
        value: mem.freeSwap
      })
    )
    systemExtension.addChild(
      new SystemInfo('extensionDetail', {
        id: 'SystemCpuLoad',
        value: systemCpuLoad
      })
    )
    systemExtension.addChild(
      new SystemInfo('extensionDetail', {
        id: 'ProcessCpuLoad',
        value: processCpuLoad
      })
    )

    // Disk Extension
    const diskExtension = new SystemInfo('extension', {
      id: 'Disk'
    })
    status.addChild(diskExtension)
    if (rootDisk) {
      diskExtension.addChild(
        new SystemInfo('extensionDetail', {
          id: '/ Free',
          value: rootDisk.free
        })
      )
    }
    if (dataDisk) {
      diskExtension.addChild(
        new SystemInfo('extensionDetail', {
          id: '/data Free',
          value: dataDisk.free
        })
      )
    }

    systemLogger.trace(
      '<?xml version="1.0" encoding="utf-8"?>\n' + status.toString()
    )
  }
  let startCpuUsage = await getCpuUsage()
  sys()
  setInterval(sys, 60000)
}

function compute(duration: number) {
  if (duration < 1) {
    return 1
  } else if (duration < 20) {
    return duration
  } else if (duration < 200) {
    return duration - (duration % 5)
  } else if (duration < 500) {
    return duration - (duration % 20)
  } else if (duration < 2000) {
    return duration - (duration % 50)
  } else {
    return duration - (duration % 200)
  }
}

function clearMergeRecord(mergeInfo: Map<string, any>) {
  mergeInfo.clear()
}

function reportSampleInfo(systemLogger: NodeLogger) {
  const transKeys = Array.from(transMergeInfo.keys())
  const eventKeys = Array.from(eventMergeInfo.keys())
  for (const transKey of transKeys) {
    let totalCount = 0
    let failCount = 0
    let avgTimeCost = 0
    const buketInfo = {} as any
    let avgTotal = 0
    // 针对每个transMergeInfo生成一个Transaction做上报即可
    const transInfoArr = transKey.split('@')
    const transType = transInfoArr[0]
    const transName = transInfoArr[1]
    // 计算data
    transMergeInfo.get(transKey)!.forEach((tran, index) => {
      if (tran.status && tran.status !== '1') {
        failCount++
      }
      totalCount++
      const dur = time.durationInMillis(tran.beginTime, tran.endTime)
      avgTotal += dur
      if (!buketInfo[compute(dur)]) {
        buketInfo[compute(dur)] = { count: 1 }
      } else {
        buketInfo[compute(dur)].count++
      }
    })
    avgTimeCost = parseInt(
      (avgTotal / transMergeInfo.get(transKey)!.length) as any,
      10
    )
    const baseStr = `@${totalCount};${failCount};${avgTimeCost};`
    let buketStr = Object.keys(buketInfo).reduce((accu, curr) => {
      return accu + `${curr},${buketInfo[curr].count}|`
    }, '')
    buketStr = buketStr.substr(0, buketStr.length - 1)

    systemLogger.trace(`${baseStr}${buketStr}`)
  }
  // 清空信息
  if (transMergeInfo.size) {
    clearMergeRecord(transMergeInfo)
  }
  // 处理Event信息
  for (const eventKey of eventKeys) {
    let totalCount = 0
    let failCount = 0
    const eventInfoArr = eventKey.split('@')
    const eventType = eventInfoArr[0]
    const eventName = eventInfoArr[1]
    // 计算data
    eventMergeInfo.get(eventKey)!.forEach((event, index) => {
      if (event.status && event.status !== '1') {
        failCount++
      }
      totalCount++
    })
    systemLogger.trace(`@${totalCount};${failCount}`, {
      transactionStatus: '1'
    })
  }
  // 清空信息
  if (eventMergeInfo.size) {
    clearMergeRecord(eventMergeInfo)
  }
  setTimeout(reportSampleInfo, 1000)
}

export function init(systemLogger: NodeLogger) {
  sender.init()
  if (treeConfig.server) {
    collectSysInfo(systemLogger)
    if (treeConfig.noSample) {
      setTimeout(() => reportSampleInfo(systemLogger), 1000)
    }
  }
}
