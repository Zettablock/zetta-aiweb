/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { ClassConstructor, Type } from 'class-transformer';
import {
  httpClient,
  IsOptionalBoolean,
  IsOptionalNumber,
  IsOptionalString,
} from '../../../http-client';
import { AxiosRequestConfig } from 'axios';

export namespace authSigninDTO {
  export interface Req {
    username_or_email: string;
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
    tenant?: string;

    @IsOptionalNumber()
    created_at?: number;
  }

  export class Token {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsOptionalBoolean()
    is_default?: boolean;

    @IsOptionalNumber()
    permission?: number;

    @IsOptionalString()
    created_at?: string;

    @IsOptionalString()
    refreshed_at?: string;
  }

  export class ApiKey {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsOptionalBoolean()
    is_default?: boolean;

    @IsOptionalString()
    created_at?: string;
  }

  export class Profile {
    @IsOptional()
    @ValidateNested()
    @Type(() => Token)
    tokens?: Token[] | null;

    @IsOptional()
    @ValidateNested()
    @Type(() => ApiKey)
    api_keys: ApiKey[] | null;

    @IsOptionalString()
    git_token: string;

    @IsOptionalString()
    wallet_address: string;

    @IsOptionalString()
    avatar_url;
  }

  export class UserRes {
    @IsOptional()
    @ValidateNested()
    @Type(() => User)
    user?: User | null;

    @IsOptional()
    @ValidateNested()
    @Type(() => Profile)
    profile?: Profile | null;

    @IsOptionalString()
    access_token?: string | null;
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => UserRes)
    data?: UserRes | null;
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res | null;
  }
}

export const authSignin = (
  reqData: authSigninDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<authSigninDTO.Res>;
  }
) => {
  config.dto = authSigninDTO.Res;
  return httpClient.post<authSigninDTO.Res>('/signin', reqData, config);
};
