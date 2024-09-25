/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AxiosRequestConfig } from 'axios';
import { httpClient, IsOptionalString } from '../../../http-client';
import { ClassConstructor, Type } from 'class-transformer';

export namespace assetCreateDTO {
  export interface Req {
    name: string;
    owner: string;
    type: string;
    cate: string;
    license?: string;
  }

  export class Model {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsString()
    owner: string;

    @IsString()
    type: string;

    @IsString()
    cate: string;

    @IsOptionalString()
    license?: number;

    @IsOptionalString()
    createdAt?: number;
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => Model)
    data?: Model | null;
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    res?: Res;
  }
}

export const assetCreate = (
  reqData: assetCreateDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<assetCreateDTO.Res>;
  }
) => {
  config.dto = assetCreateDTO.Res;
  return httpClient.post<assetCreateDTO.Res>('/api/asset', reqData, config);
};
