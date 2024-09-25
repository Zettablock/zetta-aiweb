import * as time from '../util/time'
import { MessageEvent } from './MessageEvent'
import BufferBuilder from 'buffer-builder'
import { BufferEncode } from '../util/bufferEncode'
import { dataFormat } from '@/modules/logger'
import { treeConfig } from '../util/treeConfig'

function removePrivateInfo(str: string) {
  const replacer = (_: any, p1: string, p2: string) => {
    return `${p1}${p2.length}`
  }
  return str
    .replace(
      /(AccessToken=|\\?"AccessToken\\?":)\s*\\?"?([^;,"\\]+)\\?"?([;,]?\s*)/gi,
      replacer
    )
    .replace(
      /(PASS_ID=|PASSID=|\\?"PASSID\\?":)\s*\\?"?([^;,"\\]+)\\?"?([;,]?\s*)/gi,
      replacer
    )
    .replace(
      /(^|[^\w])(_order_token|_order_ticket|user_token|mail_token|oauth_code|oauth_token|token)=([^;,\s&]*)/gi,
      (match, p1, p2, p3) => `${p1}${p2}=${p3?.length}`
    )
}

export class TransactionEvent extends MessageEvent {
  protected init() {
    this.name = 'Transaction'
  }

  public toBuffer() {
    const bf = new BufferBuilder()
    const dur = time.durationInMicros(this.beginTime!, this.endTime!)
    if (this.data) {
      this.data = this.data.map(str => removePrivateInfo(str))
    }

    const startBf = new BufferEncode()
    startBf.writeId(this.name)
    startBf.writeTimestamp(this.beginTime!)
    startBf.writeString(this.categoryName)
    startBf.writeString(treeConfig.ip)
    bf.appendBuffer(startBf.get())
    this.children!.forEach(child => {
      bf.appendBuffer(child.toBuffer())
    })
    const endBf = new BufferEncode()
    endBf.writeId(this.name)
    endBf.writeString(this.status)
    endBf.writeString(dataFormat(...this.data))
    endBf.writeDuration(dur)
    endBf.writeString(this.spanId || '')
    endBf.writeString('')
    bf.appendBuffer(endBf.get())
    return bf.get()
  }
}
