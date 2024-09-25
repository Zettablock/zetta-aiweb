/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable max-classes-per-file */
import { IsOptional, ValidateNested } from 'class-validator';
import { AxiosRequestConfig } from 'axios';
import { httpClient, IsOptionalString } from '../../../http-client';
import { ClassConstructor, Type } from 'class-transformer';

export namespace chatCompletionDTO {
  export interface Req {
    service_id: string;
    messages: Array<{role: string; content: string}>;
  }

  export class Message {
    @IsOptionalString()
    role: string;

    @IsOptionalString()
    content?: string;
  }

  export class Res {
    @IsOptional()
    @ValidateNested()
    @Type(() => Message)
    data?: Message[];
  }

  export class Response {
    @IsOptional()
    @ValidateNested()
    @Type(() => Res)
    res?: Res;
  }
}

export const chatCompletion = (
  reqData: chatCompletionDTO.Req,
  config = {} as AxiosRequestConfig & {
    dto: ClassConstructor<chatCompletionDTO.Res>;
  }
) => {
  config.dto = chatCompletionDTO.Res;
  return httpClient.post<chatCompletionDTO.Res>('/api/chat/completion', reqData, config);
};
