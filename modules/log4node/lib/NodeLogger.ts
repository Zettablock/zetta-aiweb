import { Level, Logger } from '@/modules/logger'
import { MessageEvent } from './message/MessageEvent'
import { HeartbeatEvent } from './message/HeartbeatEvent'
import { MetricEvent } from './message/MetricEvent'
import { TransactionEvent } from './message/TransactionEvent'

const Events = {
  Message: MessageEvent,
  Heartbeat: HeartbeatEvent,
  Metric: MetricEvent,
  Transaction: TransactionEvent
}

export class NodeLogger extends Logger {
  constructor(
    public eventType: keyof typeof Events,
    name?: string
  ) {
    super(name)
  }

  public createEvent(
    level: Level,
    data: any[],
    callStack?: any,
    error?: Error
  ) {
    const Event = Events[this.eventType]
    return new Event(this.category, level, data, this.context, callStack, error)
  }

  public metric(msg: string, transcationStatus: string, ...args: any[]) {
    args.unshift({
      transcationStatus
    })
    this.trace(msg, ...args)
  }
}
