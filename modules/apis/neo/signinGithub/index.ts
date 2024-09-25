/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AxiosRequestConfig } from 'axios';
import {
  httpClient,
  IsOptionalBoolean,
  IsOptionalNumber,
  IsOptionalString,
} from '../../../http-client';
import { ClassConstructor, Type } from 'class-transformer';

export namespace signinGithubDTO {
  export interface Req {
    code: string;
    state: string;
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
    res?: Res;
  }
}

export const signinGithub = (
  reqData: signinGithubDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<signinGithubDTO.Res>;
  }
) => {
  config.dto = signinGithubDTO.Res;
  return httpClient.post<signinGithubDTO.Res>(
    `/signin/github/callback?code=${reqData.code}&state=${reqData.state}`,
    {},
    config
  );
};
