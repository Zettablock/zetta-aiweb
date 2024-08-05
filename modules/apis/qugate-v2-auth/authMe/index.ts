import { IsOptional, ValidateNested } from 'class-validator'
import { ClassConstructor, Type } from 'class-transformer'
import { IsOptionalString, httpClient } from '@/modules/http-client'
import { AxiosRequestConfig } from 'axios'

export namespace authMeDTO {
  export interface Req {}

  export class User {
    @IsOptionalString()
    id: string
    @IsOptionalString()
    email: string
    @IsOptionalString()
    displayName?: string
    @IsOptionalString()
    name?: string
    @IsOptionalString()
    profileImage?: string
    @IsOptionalString()
    tenant?: string
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => User)
    data?: User | null
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res | null
  }
}

export const authMe = (
  reqData: authMeDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<authMeDTO.User>
  }
) => {
  config.dto = authMeDTO.User
  console.log(httpClient.defaults.baseURL)
  return httpClient.post<authMeDTO.User>('/qugate/v2/auth/me', reqData, config)
}
