function maxFileSizeUnitTransform(maxLogSize: number | string) {
  if (typeof maxLogSize === 'number' && Number.isInteger(maxLogSize)) {
    return maxLogSize;
  }

  const units = {
    K: 1024,
    M: 1024 * 1024,
    G: 1024 * 1024 * 1024,
  };
  const validUnit = Object.keys(units);
  const unit = (maxLogSize as string).slice(-1).toLocaleUpperCase() as keyof typeof units;
  const value = (maxLogSize as string).slice(0, -1).trim();

  if (validUnit.indexOf(unit) < 0 || !Number.isInteger(Number(value))) {
    throw Error(`maxLogSize: "${maxLogSize}" is invalid`);
  } else if (units[unit]) {
    return Number(value) * units[unit];
  }
}

function adapter(configAdapter: Record<string, (value: any) => any>, config: Record<string, any>) {
  const newConfig = Object.assign({}, config); // eslint-disable-line prefer-object-spread
  Object.keys(configAdapter).forEach((key) => {
    if (newConfig[key]) {
      newConfig[key] = configAdapter[key](config[key]);
    }
  });
  return newConfig;
}

function fileAppenderAdapter(config: Record<string, any>) {
  const configAdapter = {
    maxLogSize: maxFileSizeUnitTransform,
  };
  return adapter(configAdapter, config);
}

const adapters = {
  dateFile: fileAppenderAdapter,
  file: fileAppenderAdapter,
  fileSync: fileAppenderAdapter,
};

export function modifyConfig(config: {type: keyof typeof adapters}) {
  return adapters[config.type] ? adapters[config.type](config) : config;
}
