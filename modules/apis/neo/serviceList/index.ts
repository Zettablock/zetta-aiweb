/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AxiosRequestConfig } from 'axios';
import { IsOptionalString, httpClient } from '../../../http-client';
import { ClassConstructor, Type } from 'class-transformer';

export namespace serviceListDTO {
  export interface Req {
    type: string;
  }

  export class ModelService {
    @IsString()
    id: string;

    @IsString()
    domain: string;

    @IsString()
    model_id: string;

    @IsString()
    model_version: string;

    @IsString()
    model_name: string;

    @IsOptionalString()
    version_id?: string;

    @IsOptionalString()
    model_version_id?: string;
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => ModelService)
    data?: ModelService[];
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res;
  }
}

export const serviceList = (
  reqData: serviceListDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<serviceListDTO.Res>;
  }
) => {
  config.dto = serviceListDTO.Res;
  config.params = reqData;
  return httpClient.get<serviceListDTO.Res>('/api/asset/services', config);
};
