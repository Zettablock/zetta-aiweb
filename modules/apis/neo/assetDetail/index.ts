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

export namespace assetDetailDTO {
  export interface Req {
    id: string;
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
    lineage?: string;

    @IsOptionalString()
    license?: string;

    @IsOptionalString()
    description?: string;

    @IsOptionalNumber()
    updated_at?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => User)
    creator?: User;
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => Asset)
    data?: Asset;
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res;
  }
}

export const assetDetail = (
  reqData: assetDetailDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<assetDetailDTO.Res>;
  }
) => {
  config.dto = assetDetailDTO.Res;
  config.params = reqData;
  return httpClient.get<assetDetailDTO.Res>('/api/asset', config);
};
