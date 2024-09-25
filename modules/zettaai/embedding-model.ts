import {
  EmbeddingModelV1,
  TooManyEmbeddingValuesForCallError,
} from '@ai-sdk/provider';
import {
  combineHeaders,
  createJsonResponseHandler,
  FetchFunction,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod';
import { EmbeddingSettings } from './settings';
import { failedResponseHandler } from './error';

// minimal version of the schema, focussed on what is needed for the implementation
// this approach limits breakages when the API changes and increases efficiency
const textEmbeddingResponseSchema = z.object({
  data: z.array(z.object({ embedding: z.array(z.number()) })),
  usage: z.object({ prompt_tokens: z.number() }).nullish(),
});

type EmbeddingConfig = {
  provider: string;
  api: string;
  headers: () => Record<string, string | undefined>;
  fetch?: FetchFunction;
};

export class EmbeddingModel implements EmbeddingModelV1<string> {
  readonly specificationVersion = 'v1';

  readonly modelId: string;

  private readonly config: EmbeddingConfig;

  private readonly settings: EmbeddingSettings;

  get provider(): string {
    return this.config.provider;
  }

  get maxEmbeddingsPerCall(): number {
    return this.settings.maxEmbeddingsPerCall ?? 2048;
  }

  get supportsParallelCalls(): boolean {
    return this.settings.supportsParallelCalls ?? true;
  }

  constructor(
    modelId: string,
    settings: EmbeddingSettings,
    config: EmbeddingConfig
  ) {
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }

  async doEmbed({
    values,
    headers,
    abortSignal,
  }: Parameters<EmbeddingModelV1<string>['doEmbed']>[0]): Promise<
    Awaited<ReturnType<EmbeddingModelV1<string>['doEmbed']>>
  > {
    if (values.length > this.maxEmbeddingsPerCall) {
      throw new TooManyEmbeddingValuesForCallError({
        provider: this.provider,
        modelId: this.modelId,
        maxEmbeddingsPerCall: this.maxEmbeddingsPerCall,
        values,
      });
    }

    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.api,
      headers: combineHeaders(this.config.headers(), headers),
      body: {
        model: this.modelId,
        service_id: this.modelId,
        input: values,
        encoding_format: 'float',
        dimensions: this.settings.dimensions,
        user: this.settings.user,
      },
      failedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        textEmbeddingResponseSchema
      ),
      abortSignal,
      fetch: this.config.fetch,
    });

    return {
      embeddings: response.data.map((item) => item.embedding),
      usage: response.usage
        ? { tokens: response.usage.prompt_tokens }
        : undefined,
      rawResponse: { headers: responseHeaders },
    };
  }
}
