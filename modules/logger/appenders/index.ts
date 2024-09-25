import createDebug from 'debug'
import path from 'path';
import * as configuration from '../configuration';
import * as clustering from '../clustering';
import {Level} from '../Level';
import * as layouts from '../layouts';
import { modifyConfig} from './adapters';
import * as console from './console';
import * as logLevelFilter from './logLevelFilter';
import * as categoryFilter from './categoryFilter';
import * as noLogFilter from './noLogFilter';

const debug = createDebug('logger:appenders');
// pre-load the core appenders so that webpack can find them
export const coreAppenders = new Map();

coreAppenders.set('console', console);
coreAppenders.set('logLevelFilter', logLevelFilter);
coreAppenders.set('categoryFilter', categoryFilter);
coreAppenders.set('noLogFilter', noLogFilter);


export const appenders = new Map();

const tryLoading = (modulePath: string, config: configuration.Configuration) => {
  let resolvedPath;
  try {
    const modulePathCJS = `${modulePath}.cjs`;
    resolvedPath = require.resolve(modulePathCJS);
    debug('Loading module from ', modulePathCJS);
  } catch (e) {
    resolvedPath = modulePath;
    debug('Loading module from ', modulePath);
  }
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(resolvedPath);
  } catch (e: any) {
    // if the module was found, and we still got an error, then raise it
    configuration.throwExceptionIf(
      config,
      e.code !== 'MODULE_NOT_FOUND',
      `appender "${modulePath}" could not be loaded (error was: ${e})`
    );
    return undefined;
  }
};

const loadAppenderModule = (type: string, config: configuration.Configuration) =>
  coreAppenders.get(type) ||
  tryLoading(`./${type}`, config) ||
  tryLoading(type, config) ||
  (require.main &&
    require.main.filename &&
    tryLoading(path.join(path.dirname(require.main.filename), type), config)) ||
  tryLoading(path.join(process.cwd(), type), config);

const appendersLoading = new Set();

const getAppender = (name: string, config: configuration.Configuration) => {
  if (appenders.has(name)) return appenders.get(name);
  if (!config.appenders?.[name]) return false;
  if (appendersLoading.has(name))
    throw new Error(`Dependency loop detected for appender ${name}.`);
  appendersLoading.add(name);

  debug(`Creating appender ${name}`);
  // eslint-disable-next-line no-use-before-define
  const appender = createAppender(name, config);
  appendersLoading.delete(name);
  appenders.set(name, appender);
  return appender;
};

const createAppender = (name: string, config: configuration.Configuration) => {
  const appenderConfig = config.appenders?.[name];
  const appenderModule = (appenderConfig?.type as any).configure
    ? appenderConfig!.type as configuration.AppenderModule
    : loadAppenderModule(appenderConfig?.type as string, config);
  const type = appenderConfig?.type as string
  configuration.throwExceptionIf(
    config,
    configuration.not(appenderModule),
    `appender "${name}" is not valid (type "${type}" could not be found)`
  );
  if (appenderModule.appender) {
    process.emitWarning(
      `Appender ${type} exports an appender function.`,
      'DeprecationWarning',
      'logger-node-DEP0001'
    );
    debug(
      '[logger-node-DEP0001]',
      `DEPRECATION: Appender ${type} exports an appender function.`
    );
  }
  if (appenderModule.shutdown) {
    process.emitWarning(
      `Appender ${type} exports a shutdown function.`,
      'DeprecationWarning',
      'logger-node-DEP0002'
    );
    debug(
      '[logger-node-DEP0002]',
      `DEPRECATION: Appender ${type} exports a shutdown function.`
    );
  }

  debug(`${name}: clustering.isMaster ? ${clustering.isMaster()}`);
  debug(
    // eslint-disable-next-line global-require
    `${name}: appenderModule is ${require('util').inspect(appenderModule)}`
  );
  return clustering.onlyOnMaster(
    () => {
      debug(
        `calling appenderModule.configure for ${name} / ${type}`
      );
      return appenderModule.configure(
        modifyConfig(appenderConfig as any),
        layouts,
        (appender: string) => getAppender(appender, config),
        Level
      );
    },
    /* istanbul ignore next: fn never gets called by non-master yet needed to pass config validation */ () => {}
  );
};

const setup = (config?: configuration.Configuration) => {
  appenders.clear();
  appendersLoading.clear();
  if (!config) {
    return;
  }

  const usedAppenders = [] as string[];
  Object.values(config.categories).forEach((category) => {
    usedAppenders.push(...category.appenders);
  });
  config.appenders && Object.keys(config.appenders).forEach((name) => {
    // dodgy hard-coding of special case for tcp-server and multiprocess which may not have
    // any categories associated with it, but needs to be started up anyway
    if (
      usedAppenders.includes(name) ||
      config.appenders![name].type === 'tcp-server' ||
      config.appenders![name].type === 'multiprocess'
    ) {
      getAppender(name, config);
    }
  });
};

export const init = () => {
  setup();
};
init();

configuration.addListener((config) => {
  configuration.throwExceptionIf(
    config,
    configuration.not(configuration.anObject(config.appenders)),
    'must have a property "appenders" of type object.'
  );
  if (config.appenders) {
    const appenderNames = Object.keys(config.appenders);
    configuration.throwExceptionIf(
      config,
      configuration.not(appenderNames.length),
      'must define at least one appender.'
    );
  
    appenderNames.forEach((name) => {
      configuration.throwExceptionIf(
        config,
        configuration.not(config.appenders![name].type),
        `appender "${name}" is not valid (must be an object with property "type")`
      );
    });
  }
});

configuration.addListener(setup);

