/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  isBoolean,
  isNumber,
  isString,
  ValidateBy,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

interface NumberOptions {
  allowInfinity?: boolean;
  allowNan?: boolean;
  maxDecimalPlaces?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOptional(value: any) {
  return value === undefined || value === null;
}

export function IsOptionalString(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isOptionalString',
      validator: {
        validate: (value: any, args: ValidationArguments) => {
          const { object, property } = args;
          return isOptional((object as any)[property]) || isString(value);
        },
      },
    },
    validationOptions ?? {
      message: (args: ValidationArguments) =>
        `${args.property} should be a string`,
    }
  );
}

export function IsOptionalNumber(
  validationOptions?: ValidationOptions,
  option: NumberOptions = {}
) {
  return ValidateBy(
    {
      name: 'isOptionalNumber',
      validator: {
        validate: (value: any, args: ValidationArguments) => {
          const { object, property } = args;
          return (
            isOptional((object as any)[property]) || isNumber(value, option)
          );
        },
      },
    },
    validationOptions ?? {
      message: (args: ValidationArguments) =>
        `${args.property} should be a number`,
    }
  );
}

export function IsOptionalBoolean(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isOptionalBoolean',
      validator: {
        validate: (value: any, args: ValidationArguments) => {
          const { object, property } = args;
          return isOptional((object as any)[property]) || isBoolean(value);
        },
      },
    },
    validationOptions ?? {
      message: (args: ValidationArguments) =>
        `${args.property} should be a number`,
    }
  );
}
