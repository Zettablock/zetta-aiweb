import createDebug from 'debug'

import { LoggingEvent } from './LoggingEvent';
import * as configuration from './configuration';

const debug = createDebug('logger:clustering');
let disabled: boolean | undefined = true;
let cluster: any;
let pid: number

export function setCluster(icluster: any, ipid: number) {
  cluster = icluster
  pid = ipid
  disabled = false
}

interface EventListener {
  (logEvent: LoggingEvent): void
}

const listeners = [] as EventListener[];

let pm2: boolean | undefined = false;
let pm2InstanceVar = 'NODE_APP_INSTANCE';

const isPM2Master = () => pm2 && process.env[pm2InstanceVar] === '0';
export const isMaster = () =>
  disabled || (cluster && cluster.isMaster) || isPM2Master();

const sendToListeners = (logEvent: LoggingEvent) => {
  listeners.forEach((l) => l(logEvent));
};

interface SendMsg {
  topic?: string
  data?: any
}
// in a multi-process node environment, worker loggers will use
// process.send
const receiver = (worker: SendMsg, message?: SendMsg) => {
  // prior to node v6, the worker parameter was not passed (args were message, handle)
  debug('cluster message received from worker ', worker, ': ', message);
  if (worker.topic && worker.data) {
    message = worker;
  }
  if (message && message.topic && message.topic === 'logger:message') {
    debug('received message: ', message.data);
    const logEvent = LoggingEvent.deserialise(message.data);
    sendToListeners(logEvent);
  }
};

if (!disabled) {
  configuration.addListener((config) => {
    // clear out the listeners, because configure has been called.
    listeners.length = 0;

    ({
      pm2,
      disableClustering: disabled,
      pm2InstanceVar = 'NODE_APP_INSTANCE',
    } = config);

    debug(`clustering disabled ? ${disabled}`);
    debug(`cluster.isMaster ? ${cluster && cluster.isMaster}`);
    debug(`pm2 enabled ? ${pm2}`);
    debug(`pm2InstanceVar = ${pm2InstanceVar}`);
    debug(`process.env[${pm2InstanceVar}] = ${process.env[pm2InstanceVar]}`);

    // just in case configure is called after shutdown
    if (pm2) {
      process.removeListener('message', receiver);
    }
    if (cluster && cluster.removeListener) {
      cluster.removeListener('message', receiver);
    }

    if (disabled || config.disableClustering) {
      debug('Not listening for cluster messages, because clustering disabled.');
    } else if (isPM2Master()) {
      // PM2 cluster support
      // PM2 runs everything as workers - install pm2-intercom for this to work.
      // we only want one of the app instances to write logs
      debug('listening for PM2 broadcast messages');
      process.on('message', receiver);
    } else if (cluster && cluster.isMaster) {
      debug('listening for cluster messages');
      cluster.on('message', receiver);
    } else {
      debug('not listening for messages, because we are not a master process');
    }
  });
}


export function onlyOnMaster(fn: () => any, notMaster: () => any) {
  return (isMaster() ? fn() : notMaster())
}

export function send(msg: LoggingEvent, parentSend?: (msg: SendMsg) => void) {
  if (isMaster()) {
    sendToListeners(msg);
  } else if (parentSend) {
    if (!pm2) {
      msg.cluster = {
        workerId: cluster.worker.id,
        pid: pid || msg.pid,
      };
    }
    parentSend({ topic: 'logger:message', data: msg.serialise() });
  }
}

export function onMessage(listener: EventListener) {
  listeners.push(listener);
}
