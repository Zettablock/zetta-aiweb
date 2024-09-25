import {
  EmbeddingModelV1,
  LanguageModelV1,
  ProviderV1,
} from '@ai-sdk/provider';
import { FetchFunction } from '@ai-sdk/provider-utils';
import {
  ModelId,
  ChatSettings,
  CompletionSettings,
  EmbeddingSettings,
  ModelSettings,
} from './settings';
import { ZettaAI } from './facade';

export interface Provider extends ProviderV1 {
  (modelId: string, settings?: ChatSettings): LanguageModelV1;
  (modelId: ModelId, settings?: ModelSettings): LanguageModelV1;

  /**
Creates an  model for text generation.
   */
  languageModel(modelId: string, settings?: ChatSettings): LanguageModelV1;
  languageModel(modelId: ModelId, settings?: ChatSettings): LanguageModelV1;

  /**
Creates an  chat model for text generation.
   */
  chat(modelId: string, settings?: ChatSettings): LanguageModelV1;

  /**
Creates an  completion model for text generation.
   */
  completion(modelId: string, settings?: CompletionSettings): LanguageModelV1;

  /**
Creates a model for text embeddings.
   */
  embedding(
    modelId: string,
    settings?: EmbeddingSettings
  ): EmbeddingModelV1<string>;

  /**
Creates a model for text embeddings.

@deprecated Use `textEmbeddingModel` instead.
   */
  textEmbedding(
    modelId: string,
    settings?: EmbeddingSettings
  ): EmbeddingModelV1<string>;

  /**
Creates a model for text embeddings.
   */
  textEmbeddingModel(
    modelId: string,
    settings?: EmbeddingSettings
  ): EmbeddingModelV1<string>;
}

export interface ProviderSettings {
  /**
  Base URL for the  API calls.
     */
  baseURL: string;

  /**
  accessToken for authenticating requests.
      */
  accessToken?: string;

  /**
  API key for authenticating requests.
     */
  apiKey?: string;

  /**
 Organization.
     */
  organization?: string;

  /**
 project.
     */
  project?: string;

  /**
Custom headers to include in the requests.
     */
  headers?: Record<string, string>;

  /**
 compatibility mode. Should be set to `strict` when using the  API,
and `compatible` when using 3rd party providers. In `compatible` mode, newer
information such as streamOptions are not being sent. Defaults to 'compatible'.
   */
  compatibility?: 'strict' | 'compatible';

  /**
Custom fetch implementation. You can use it as a middleware to intercept requests,
or to provide a custom fetch implementation for e.g. testing.
    */
  fetch?: FetchFunction;
}

/**
Create an  provider instance.
 */
export function create(options = {} as ProviderSettings): Provider {
  const zettaai = new ZettaAI(options);
  const createLanguageModel = (modelId: ModelId, settings?: ModelSettings) => {
    if (new.target) {
      throw new Error(
        'The model function cannot be called with the new keyword.'
      );
    }
    if (typeof modelId === 'object') {
      switch (modelId.type) {
        case 'completion':
          return zettaai.completion(
            modelId.modelId,
            settings as CompletionSettings
          );
        case 'embeding':
          return zettaai.embedding(
            modelId.modelId,
            settings as EmbeddingSettings
          );
        case 'chat':
        default:
          return zettaai.chat(modelId.modelId, settings as ChatSettings);
      }
    }

    return zettaai.chat(modelId, settings as ChatSettings);
  };

  // eslint-disable-next-line func-names
  const provider = function (modelId: ModelId, settings?: ModelSettings) {
    return createLanguageModel(modelId, settings);
  };

  provider.languageModel = createLanguageModel;
  provider.chat = zettaai.chat;
  provider.completion = zettaai.completion;
  provider.embedding = zettaai.embedding;
  provider.textEmbedding = zettaai.embedding;
  provider.textEmbeddingModel = zettaai.embedding;

  return provider as Provider;
}

/**
Default  provider instance. It uses 'strict' compatibility mode.
 */
export const zettaai = create({
  compatibility: 'strict', // strict for  API
  baseURL: process.env.REACT_APP_ZETTAAI_BACKEND_API!,
});
