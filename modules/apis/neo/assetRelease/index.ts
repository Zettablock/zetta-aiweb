/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AxiosRequestConfig } from 'axios';
import { httpClient } from '../../../http-client';
import { ClassConstructor, Type } from 'class-transformer';

export namespace assetReleaseDTO {
  export interface Req {
    asset_id: string;
    name: string;
    message: string;
    private_key: string
  }

  export class AssetVersion {
    @IsString()
    id: string;

    @IsString()
    service_id: string;

    @IsString()
    name: string;

    @IsString()
    message: string;
  }


  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => AssetVersion)
    data?: AssetVersion
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res;
  }
}

export const assetRelease = (
  reqData: assetReleaseDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<assetReleaseDTO.Res>;
  }
) => {
  config.dto = assetReleaseDTO.Res;
  return httpClient.post<assetReleaseDTO.Res>('/api/asset/version', reqData, config);
};
