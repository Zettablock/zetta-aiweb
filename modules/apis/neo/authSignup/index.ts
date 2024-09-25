/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { ClassConstructor, Type } from 'class-transformer';
import { httpClient, IsOptionalString } from '../../../http-client';
import { AxiosRequestConfig } from 'axios';

export namespace authSignupDTO {
  export interface Req {
    email: string;
    user_name: string;
    password: string;
  }

  export class User {
    @IsString()
    id: string;

    @IsString()
    email: string;

    @IsString()
    user_name: string;

    @IsOptionalString()
    profileImage?: string;

    @IsOptionalString()
    tenant?: string;

    @IsOptionalString()
    createdAt?: number;
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => User)
    data?: User | null;
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res | null;
  }
}

export const authSignup = (
  reqData: authSignupDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<authSignupDTO.Res>;
  }
) => {
  config.dto = authSignupDTO.Res;
  return httpClient.post<authSignupDTO.Res>('/register', reqData, config);
};
