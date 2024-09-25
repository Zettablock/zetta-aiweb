/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AxiosRequestConfig } from 'axios';
import { httpClient } from '../../../http-client';
import { ClassConstructor, Type } from 'class-transformer';

export namespace serviceDeployDTO {
  export interface Req {
    model_id: string;
    type: string;
    version_id: string;
    private_key: string;
  }

  export class ModelService {
    @IsString()
    id: string;

    @IsString()
    model_id: string;

    @IsString()
    model_version: string;

    @IsString()
    model_name: string;

    @IsString()
    version_id: string;

    @IsString()
    model_version_id: string
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => ModelService)
    data?: ModelService;
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res;
  }
}

export const serviceDeploy = (
  reqData: serviceDeployDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<serviceDeployDTO.Res>;
  }
) => {
  config.dto = serviceDeployDTO.Res;
  return httpClient.post<serviceDeployDTO.Res>('/api/job', reqData, config);
};
