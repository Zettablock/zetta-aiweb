import 'reflect-metadata'
import { AxiosError, AxiosResponse } from 'axios'
import { validateSync, ValidationError } from 'class-validator'
import { plainToInstance, ClassConstructor } from 'class-transformer'
import { ResponsePlugin } from './BasePlugin'

const logAllError = (url = '', errorList: ValidationError[]) => {
  function getErrorList(list: ValidationError[], result: string[] = []) {
    list.forEach((item: ValidationError) => {
      if (item.children && item.children.length)
        return result.concat(...getErrorList(item.children, result))
      const messageList = Object.values(item.constraints || {})
      return result.push(...messageList)
    })
    return result
  }

  const result = [url, ...getErrorList(errorList)]
  console.error(errorList)
  console.error(result.join('\n\n'))
  return result
}

export class ValidateResponsePlugin extends ResponsePlugin {
  public handle = <V extends AxiosResponse = AxiosResponse>(response: V) => {
    const { data, config, request } = response
    const { dto, skipCheck } = config as any
    if (dto && skipCheck !== true) {
      const resDto = plainToInstance(dto as ClassConstructor<any>, {
        res: data
      })
      const errors = validateSync(resDto, {
        forbidUnknownValues: true,
        validationError: { target: false }
      })
      if (errors.length !== 0) {
        const errorResult = logAllError(config.url, errors)
        const error = new AxiosError(
          errorResult.join('\n'),
          data.error_code || 'response_validate_error',
          config,
          request,
          response
        )
        throw error
      }
    }
    return response
  }
}
