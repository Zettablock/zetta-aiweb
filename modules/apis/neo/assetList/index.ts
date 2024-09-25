/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AxiosRequestConfig } from 'axios';
import {
  httpClient,
  IsOptionalNumber,
  IsOptionalString,
} from '../../../http-client';
import { ClassConstructor, Type } from 'class-transformer';

export namespace assetListDTO {
  export interface Req {
    type: string;
    modality?: string;
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

    @IsOptionalString()
    avatar_url?: string;

    @IsOptionalNumber()
    created_at?: number;
  }

  export class Asset {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsOptionalString()
    modality?: string;

    @IsOptionalString()
    link?: string;

    @IsOptionalString()
    license?: string;

    @IsOptionalString()
    description?: string;

    @IsOptionalNumber()
    updated_at?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => User)
    creator: User;
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => Asset)
    data?: Asset[];
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res;
  }
}

export const assetList = (
  reqData: assetListDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<assetListDTO.Res>;
  }
) => {
  config.dto = assetListDTO.Res;
  config.params = reqData;
  return httpClient.get<assetListDTO.Res>('/api/assets', config);
};
