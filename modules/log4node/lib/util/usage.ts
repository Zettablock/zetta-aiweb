import { execSync } from 'child_process'
import os from 'os'

export function diskUsage(drive: string) {
  if (
    process.platform === 'linux' ||
    process.platform === 'freebsd' ||
    process.platform === 'darwin' ||
    process.platform === 'sunos'
  ) {
    try {
      const res = execSync(
        'df -k "' + drive.replace(/'/g, '"\\"') + '"'
      ).toString()
      const lines = res.trim().split('\n')
      const str_disk_info = lines[lines.length - 1].replace(/[\s\n\r]+/g, ' ')
      const disk_info = str_disk_info.split(' ')

      return {
        available: Number(disk_info[3]) * 1024,
        total: Number(disk_info[1]) * 1024,
        free: Number(disk_info[3]) * 1024
      }
    } catch (e) {
      console.error(e) // eslint-disable-line
      return null
    }
  } else {
    return null
  }
}

const DEFAULT_RESULT = {
  totalMem: 0,
  freeMem: 0,
  totalSwap: 0,
  freeSwap: 0,
  totalCache: 0,
  freeCache: 0
}

function split(line: string) {
  return line.split(/[\s\n\r]+/)
}

export function memoryUsage() {
  if (
    process.platform === 'linux' ||
    process.platform === 'freebsd' ||
    process.platform === 'sunos'
  ) {
    try {
      const res = execSync('free -m').toString()
      const lines = res.trim().split('\n')
      const usage = Object.assign({}, DEFAULT_RESULT)

      const mem = split(lines[1])
      usage.totalMem = Number(mem[1]) * 1024 * 1024
      usage.freeMem = Number(mem[3]) * 1024 * 1024
      const swap = split(lines[3])
      usage.totalSwap = Number(swap[1]) * 1024 * 1024
      usage.freeSwap = Number(swap[3]) * 1024 * 1024
      const cache = split(lines[2])
      usage.totalCache = Number(cache[2]) * 2 * 1024 * 1024
      usage.freeCache = Number(cache[3]) * 1024 * 1024
      return usage
    } catch (e) {
      // 不支持free 命令
      return {
        totalMem: os.totalmem(),
        freeMem: os.freemem(),
        totalSwap: 0,
        freeSwap: 0,
        totalCache: 0,
        freeCache: 0
      }
    }
  } else if (process.platform === 'darwin') {
    // mac
    return {
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
      totalSwap: 0,
      freeSwap: 0,
      totalCache: 0,
      freeCache: 0
    }
  } else {
    return {} as any
  }
}
