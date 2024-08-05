import { IsOptional, ValidateNested } from 'class-validator'
import { httpClient } from '@/modules/http-client'
import { AxiosRequestConfig } from 'axios'

export namespace signinGithubDTO {
  export interface Req {
    redirect_uri?: string
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    res?: null
  }
}

export const signinGithub = (
  reqData: signinGithubDTO.Req,
  config = {} as AxiosRequestConfig
) => {
  console.log(httpClient.defaults)
  debugger

  return httpClient.post(
    `/qugate/v2/auth/signin/github?redirect_uri=${reqData.redirect_uri}`,
    {},
    config
  )
}
