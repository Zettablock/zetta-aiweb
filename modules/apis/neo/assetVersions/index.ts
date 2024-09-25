/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AxiosRequestConfig } from 'axios';
import { IsOptionalString, httpClient } from '../../../http-client';
import { ClassConstructor, Type } from 'class-transformer';

export namespace assetVersionsDTO {
  export interface Req {
    id: string
  }

  export class AssetVersion {
    @IsString()
    id: string;

    @IsOptionalString()
    service_id?: string;

    @IsString()
    name: string;

    @IsString()
    message: string;
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => AssetVersion)
    data?: AssetVersion[];
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res;
  }
}

export const assetVersions = (
  reqData: assetVersionsDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<assetVersionsDTO.Res>;
  }
) => {
  config.dto = assetVersionsDTO.Res;
  config.params = reqData;
  return httpClient.get<assetVersionsDTO.Res>('/api/asset/versions', config);
};
