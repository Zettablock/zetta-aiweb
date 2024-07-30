import { dataFormat, Level, LoggingEvent } from '@/modules/logger'
import { BufferEncode } from '../util/bufferEncode'
import { treeConfig } from '../util/treeConfig'

export class MessageEvent extends LoggingEvent {
  public name: string
  public spanId: string
  public isBegin: boolean
  public isEnd: boolean
  public beginTime: number
  public endTime: number
  public children: MessageEvent[]
  public allEnd: boolean
  public parent: MessageEvent | null
  public tree: any

  constructor(
    public categoryName: string,
    public level: Level,
    public data: any[],
    public context = {} as any,
    public location?: any,
    public error?: Error,
    public status = '0'
  ) {
    super(categoryName, level, data, context, location, error, process.pid)

    const now = Date.now()

    this.name = 'Message'
    this.spanId = ''
    this.isBegin = false
    this.isEnd = false
    this.beginTime = now
    this.endTime = now
    this.children = []

    this.allEnd = false
    this.parent = null
    this.tree = null

    this.init()
  }

  protected init() {}

  public begin() {
    if (this.isBegin) {
      return
    }

    this.isBegin = true
    this.beginTime = Date.now()
  }

  public end() {
    if (this.isEnd) {
      return
    }

    this.isEnd = true
    this.endTime = Date.now()
  }

  public addChild(...messageEvts: MessageEvent[]) {
    const self = this
    messageEvts.forEach(messageEvt => {
      self.children.push(messageEvt)
      messageEvt.parent = self
      if (self.allEnd && !messageEvt.isAllEnd()) {
        self.allEnd = false
      }
    })
  }

  public removeChild(...messageEvts: MessageEvent[]) {
    const children = this.children
    messageEvts.forEach(messageEvt => {
      const index = children.indexOf(messageEvt)
      if (index > -1) {
        children.splice(index, 1)
        messageEvt.parent = null
      }
    })
    this.isAllEnd()
  }

  public isAllEnd(): boolean {
    if (this.allEnd) {
      return true
    }
    const children = this.children
    const isEnd = this.isEnd ?? false
    if (!children.length) {
      this.allEnd = isEnd
      return this.allEnd
    }
    this.allEnd = isEnd && children.every(child => child.isAllEnd())
    return this.allEnd
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
