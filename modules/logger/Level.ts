import * as configuration from './configuration';

const validColours = [
  'white',
  'grey',
  'black',
  'blue',
  'cyan',
  'green',
  'magenta',
  'red',
  'yellow',
];

class LevelMixin {
  static ALL: Level
  static TRACE: Level
  static DEBUG: Level
  static INFO: Level
  static WARN: Level
  static ERROR: Level
  static FATAL: Level
  static MARK: Level
  static OFF: Level
}

export class Level extends LevelMixin{
  public static levels = [] as Level[]
  constructor(public level: number, private levelStr: configuration.LevelEnum, public colour: string) {
    super()
  }

  public toString() {
    return this.levelStr;
  }

  /**
   * converts given String to corresponding Level
   * @param {(Level|string)} sArg -- String value of Level OR Logger.Level
   * @param {Level} [defaultLevel] -- default Level, if no String representation
   * @return {Level}
   */
  public static getLevel(sArg?: configuration.LevelEnum | Level | {levelStr: string}, defaultLevel = new Level(Number.MIN_VALUE, configuration.LevelEnum.ALL, 'grey')): Level {
    if (!sArg) {
      return defaultLevel;
    }

    if (sArg instanceof Level) {
      return sArg;
    }

    // a json-serialised level won't be an instance of Level (see issue #768)
    if (sArg instanceof Object && sArg.levelStr) {
      sArg = sArg.levelStr as configuration.LevelEnum;
    }

    return (Level as any)[sArg.toString().toUpperCase()] || defaultLevel;
  }

  public static addLevels(customLevels?: configuration.Configuration['levels']) {
    if (customLevels) {
      const levels = Object.keys(customLevels);
      levels.forEach((l) => {
        const levelStr = l.toUpperCase();
        const NewLevel = (Level as any)[levelStr] = new Level(
          customLevels[l].value,
          levelStr as configuration.LevelEnum,
          customLevels[l].colour
        );
        const existingLevelIndex = Level.levels.findIndex(
          (lvl) => lvl.levelStr === levelStr
        );
        if (existingLevelIndex > -1) {
          Level.levels[existingLevelIndex] = NewLevel;
        } else {
          Level.levels.push(NewLevel);
        }
      });
      Level.levels.sort((a, b) => a.level - b.level);
    }
  }

  public isLessThanOrEqualTo(otherLevel: configuration.LevelEnum | Level) {
    if (typeof otherLevel === 'string') {
      otherLevel = Level.getLevel(otherLevel);
    }
    return this.level <= (otherLevel as Level).level;
  }

  public isGreaterThanOrEqualTo(otherLevel: configuration.LevelEnum | Level) {
    if (typeof otherLevel === 'string') {
      otherLevel = Level.getLevel(otherLevel);
    }
    return this.level >= (otherLevel as Level).level;
  }

  public isEqualTo(otherLevel: configuration.LevelEnum | Level) {
    if (typeof otherLevel === 'string') {
      otherLevel = Level.getLevel(otherLevel);
    }
    return this.level === (otherLevel as Level).level;
  }
}


Level.addLevels({
  ALL: { value: Number.MIN_VALUE, colour: 'grey' },
  TRACE: { value: 5000, colour: 'blue' },
  DEBUG: { value: 10000, colour: 'cyan' },
  INFO: { value: 20000, colour: 'green' },
  WARN: { value: 30000, colour: 'yellow' },
  ERROR: { value: 40000, colour: 'red' },
  FATAL: { value: 50000, colour: 'magenta' },
  MARK: { value: 9007199254740992, colour: 'grey' }, // 2^53
  OFF: { value: Number.MAX_VALUE, colour: 'grey' },
});

configuration.addListener((config) => {
  const levelConfig = config.levels;
  if (levelConfig) {
    configuration.throwExceptionIf(
      config,
      configuration.not(configuration.anObject(levelConfig)),
      'levels must be an object'
    );
    const newLevels = Object.keys(levelConfig);
    newLevels.forEach((l) => {
      configuration.throwExceptionIf(
        config,
        configuration.not(configuration.validIdentifier(l)),
        `level name "${l}" is not a valid identifier (must start with a letter, only contain A-Z,a-z,0-9,_)`
      );
      configuration.throwExceptionIf(
        config,
        configuration.not(configuration.anObject(levelConfig[l])),
        `level "${l}" must be an object`
      );
      configuration.throwExceptionIf(
        config,
        configuration.not(levelConfig[l].value),
        `level "${l}" must have a 'value' property`
      );
      configuration.throwExceptionIf(
        config,
        configuration.not(configuration.anInteger(levelConfig[l].value)),
        `level "${l}".value must have an integer value`
      );
      configuration.throwExceptionIf(
        config,
        configuration.not(levelConfig[l].colour),
        `level "${l}" must have a 'colour' property`
      );
      configuration.throwExceptionIf(
        config,
        configuration.not(validColours.indexOf(levelConfig[l].colour) > -1),
        `level "${l}".colour must be one of ${validColours.join(', ')}`
      );
    });
  }
});

configuration.addListener((config) => {
  Level.addLevels(config.levels);
});

