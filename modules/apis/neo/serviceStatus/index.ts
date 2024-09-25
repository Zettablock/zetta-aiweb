/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AxiosRequestConfig } from 'axios';
import { IsOptionalString, httpClient } from '../../../http-client';
import { ClassConstructor, Type } from 'class-transformer';

export namespace serviceStatusDTO {
  export interface Req {
    id: string;
  }

  export class ServiceStatus {
    @IsString()
    id: string;

    @IsOptionalString()
    status: string;
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => ServiceStatus)
    data?: ServiceStatus;
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res;
  }
}

export const serviceStatus = (
  reqData: serviceStatusDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<serviceStatusDTO.Res>;
  }
) => {
  config.dto = serviceStatusDTO.Res;
  config.params = reqData
  return httpClient.get<serviceStatusDTO.Res>('/api/asset/service/status', config);
};
