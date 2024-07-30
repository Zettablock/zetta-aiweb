import { IsOptional, ValidateNested } from 'class-validator'
import { ClassConstructor, Type } from 'class-transformer'
import { IsOptionalString, httpClient } from '@/modules/http-client'
import { AxiosRequestConfig } from 'axios'

export namespace authUserDTO {
  export interface Req {}

  export class User {
    @IsOptionalString()
    id: string
    @IsOptionalString()
    displayName?: string
    @IsOptionalString()
    email?: string
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
    User?: User | null
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res | null
  }
}

export const authUser = (
  reqData: authUserDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<authUserDTO.User>
  }
) => {
  config.dto = authUserDTO.User
  return httpClient.post('/qugate/v2/auth/me', reqData, config)
}
