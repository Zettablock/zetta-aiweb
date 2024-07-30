import * as sender from './sender'
import { Tree } from './Tree'
import { MessageEvent } from './message/MessageEvent'
import { TransactionEvent } from './message/TransactionEvent'
import { HeartbeatEvent } from './message/HeartbeatEvent'

export class TreeManager {
  private trees: Tree[]
  private rootNode: MessageEvent | null
  private lastNode: MessageEvent | null
  constructor() {
    this.trees = []
    this.lastNode = null
    this.rootNode = null
  }

  addMessage(messageEvt: MessageEvent) {
    const lastNode = this._findLastNode()

    if (messageEvt instanceof TransactionEvent) {
      if (!lastNode) {
        this.createTree(messageEvt)
        this.lastNode = messageEvt
        this.rootNode = messageEvt
      } else {
        if (messageEvt.categoryName === 'API') {
          this.rootNode!.addChild(messageEvt)
        } else {
          lastNode.addChild(messageEvt)
          this.lastNode = messageEvt
        }
      }
      messageEvt.begin()
    } else if (
      (messageEvt as any).constructor === MessageEvent ||
      messageEvt instanceof HeartbeatEvent
    ) {
      if (!lastNode) {
        this.sendTree(
          new Tree({
            root: messageEvt
          })
        )
      } else {
        lastNode.addChild(messageEvt)
      }
    }
  }

  endMessage(messageEvt: MessageEvent) {
    messageEvt.end()

    if (!(messageEvt instanceof TransactionEvent)) {
      return
    }

    if (messageEvt.isAllEnd()) {
      this.notifyParentEnd(messageEvt)
    } else {
      const unEndChildren = messageEvt.children.filter(
        child => !child.isAllEnd()
      )
      messageEvt.removeChild.apply(messageEvt, unEndChildren)
      if (messageEvt.parent) {
        messageEvt.parent.addChild.apply(messageEvt.parent, unEndChildren)
      } else {
        this.sendTree(messageEvt.tree)
        unEndChildren.forEach(msg => {
          this.createTree(msg)
        })
      }
    }
  }

  notifyParentEnd(messageEvt: MessageEvent) {
    if (messageEvt.parent) {
      if (messageEvt.parent.isEnd) {
        this.endMessage(messageEvt.parent)
      }
    } else {
      this.sendTree(messageEvt.tree)
    }
  }

  sendTree(tree: Tree) {
    if (!tree) {
      return
    }

    const index = this.trees.indexOf(tree)
    if (index > -1) {
      this.trees.splice(index, 1)
    }

    sender.send(tree)
  }

  _findLastNode() {
    if (!this.lastNode) {
      return null
    }

    let last = this.lastNode
    while (last && last.isEnd) {
      last = last.parent!
    }
    return last
  }

  createTree(rootMessage: MessageEvent) {
    const tree = new Tree({
      root: rootMessage
    })
    this.trees.push(tree)
    return tree
  }
}

export const treeManager = new TreeManager()
