/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AxiosRequestConfig } from 'axios';
import { httpClient, IsOptionalString } from '../../../http-client';
import { ClassConstructor, Type } from 'class-transformer';

export namespace repoDetailDTO {
  export interface Req {
    asset_id: string;
    folder_path?: string;
  }

  export class LatestCommit {
    @IsString()
    id: string;

    @IsNumber()
    created_at: number;

    @IsOptionalString()
    message?: string;
  }

  export class RepoContent {
    @IsString()
    name: string;

    @IsString()
    type: string;

    @IsOptionalString()
    path: string;

    @IsNumber()
    size: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => LatestCommit)
    latest_commit: LatestCommit;
  }

  export class Repo {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsString()
    full_name: string;

    @IsString()
    description: string;

    @IsNumber()
    size: number;

    @IsOptionalString()
    avatar_url;

    @IsOptionalString()
    created_on;
  }

  export class RepoRes {
    @IsOptional()
    @ValidateNested()
    @Type(() => Repo)
    repository?: Repo;

    @IsOptional()
    @ValidateNested()
    @Type(() => RepoContent)
    contents?: RepoContent[];
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => RepoRes)
    data?: RepoRes | null;
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    res?: Res;
  }
}

export const repoDetail = (
  reqData: repoDetailDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<repoDetailDTO.Res>;
  }
) => {
  config.dto = repoDetailDTO.Res;
  config.params = reqData;
  return httpClient.get<repoDetailDTO.Res>('/api/git/repo/detail', config);
};
