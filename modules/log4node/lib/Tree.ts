import BufferBuilder from 'buffer-builder'
import { nextId, treeConfig } from './util/treeConfig'
import { BufferEncode } from './util/bufferEncode'

import { TransactionEvent } from './message/TransactionEvent'
import { MessageEvent } from './message/MessageEvent'

const VERSION = 'NT4'

type TreeConfig = typeof treeConfig & {
  traceId: string
  spanId?: string
  taishanLabel?: string
  trafficType?: string
  root?: MessageEvent | null
}

export class Tree {
  private config: TreeConfig
  public root?: any
  public spanCount: number
  public isParentSameThread: boolean
  constructor(config: Partial<TreeConfig>) {
    this.config = {
      ...treeConfig,
      ...config,
      hostname:
        config.hostname || treeConfig.hostname || config.ip || treeConfig.ip!,
      messageId: treeConfig.messageId || config.messageId || nextId()
    } as any

    this.spanCount = 0
    this.isParentSameThread = false
    this.root = config.root || undefined
    if (this.root) {
      this.root.tree = this
    }
  }

  public toBuffer() {
    const config = this.config
    const bf = new BufferEncode()
    bf.writeVersion(VERSION)
    bf.writeString(config.domain)
    bf.writeString(config.hostname)
    bf.writeString(config.ip)
    bf.writeString(config.groupName)
    bf.writeString(config.clusterId)
    bf.writeString(config.clusterName)
    bf.writeString(config.messageId)
    bf.writeString(config.parentMessageId)
    bf.writeString(config.rootMessageId)
    bf.writeString(config.sessionToken)
    bf.writeString(config.dataCenter)
    bf.writeString(config.logicSet)
    bf.writeVarint(0)
    bf.writeString(config.traceId || config.messageId)
    bf.writeString(config.spanId || '')
    bf.writeString(config.taishanLabel)
    bf.writeString(config.trafficType)
    bf.writeBoolean(this.isParentSameThread)
    bf.writeString(config.hostGroup)
    bf.append(this.root.toBuffer())

    return bf.get()
  }

  serialize() {
    const treeBuffer = this.toBuffer()
    const bf = new BufferBuilder()
    bf.appendInt32BE(treeBuffer.length)
    bf.appendBuffer(treeBuffer)
    return bf.get()
  }

  toString() {
    return this.toBuffer().toString()
  }
}

const transMergeInfo = new Map<string, MessageEvent[]>()
const eventMergeInfo = new Map<string, MessageEvent[]>()

export function tranverseMessage(messageEvent: MessageEvent) {
  const isMessageTrans = messageEvent instanceof TransactionEvent
  const mergeInfo = isMessageTrans ? transMergeInfo : eventMergeInfo
  if (messageEvent.children && messageEvent.children.length) {
    messageEvent.children.forEach((msg, index) => {
      tranverseMessage(msg)
    })
    enqueneMessage(messageEvent, mergeInfo)
  } else {
    enqueneMessage(messageEvent, mergeInfo)
  }
}

export function enqueneMessage(
  messageEvent: MessageEvent,
  mergeInfo: Map<string, MessageEvent[]>
) {
  if (!mergeInfo.get(`${messageEvent.categoryName}@${messageEvent.name}`)) {
    mergeInfo.set(`${messageEvent.categoryName}@${messageEvent.name}`, [
      messageEvent
    ])
  } else {
    mergeInfo
      .get(`${messageEvent.categoryName}@${messageEvent.name}`)!
      .push(messageEvent)
  }
}

export function tranverseTree(tree: Tree) {
  tree.root && tranverseMessage(tree.root)
}

export { transMergeInfo, eventMergeInfo }
