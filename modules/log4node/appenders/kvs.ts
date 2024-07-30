import { AnalyticsBrowser } from '@segment/analytics-next'
import { Configuration, Level } from '@/modules/logger'
import { TreeManager } from '../lib/TreeManager'
import { MessageEvent } from '../lib/message/MessageEvent'
import { TransactionEvent } from '../lib/message/TransactionEvent'
import * as sender from '../lib/sender'
import { Tree } from '../lib/Tree'

function kvsAppender(
  layout: (messageEvent: MessageEvent) => string,
  config: Configuration & { transtionType: string; treeManager: TreeManager },
  LevelCls: Level
) {
  const transtion = config.transtionType
    ? new TransactionEvent(
        config.transtionType,
        LevelCls,
        [],
        {},
        undefined,
        undefined,
        '0'
      )
    : null
  const tree = new Tree({ root: transtion })
  const treeManager = config.treeManager || new TreeManager()

  return (messageEvent: MessageEvent, context = {} as any) => {
    messageEvent.data = layout(messageEvent) as any

    if (transtion && context.transactionStatus) {
      messageEvent.status = context.transactionStatus
      treeManager.addMessage(messageEvent)
    } else {
      if (transtion) {
        transtion.end()
        treeManager.addMessage(messageEvent)
        sender.send(tree)
      } else {
        treeManager.addMessage(messageEvent)
      }
    }
  }
}

export function configure(
  config: Configuration & { transtionType: string; treeManager: TreeManager },
  layouts: any,
  LevelCls: Level
) {
  let layout = layouts.basic
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout)
  }
  return kvsAppender(layout, config, LevelCls)
}
