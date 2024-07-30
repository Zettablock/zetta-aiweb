import { MessageEvent } from './MessageEvent'
import { BufferEncode } from '../util/bufferEncode'
import { dataFormat } from '@/modules/logger'
import { treeConfig } from '../util/treeConfig'

export class HeartbeatEvent extends MessageEvent {
  protected init() {
    this.name = 'Heartbeat'
    this.begin()
    this.end()
  }

  toBuffer() {
    const bf = new BufferEncode()
    bf.writeId(this.name)
    bf.writeTimestamp(this.beginTime)
    bf.writeString(this.categoryName)
    bf.writeString(treeConfig.ip)
    bf.writeString(this.status)
    bf.writeString(dataFormat(...this.data))
    return bf.get()
  }
}
