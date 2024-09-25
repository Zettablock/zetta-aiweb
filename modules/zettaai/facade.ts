import { withoutTrailingSlash } from '@ai-sdk/provider-utils';
import { ChatLanguageModel } from './chat-language-model';
import {
  ChatSettings,
  CompletionSettings,
  EmbeddingSettings,
} from './settings';
import { CompletionLanguageModel } from './completion-language-model';
import { ProviderSettings } from './provider';
import { EmbeddingModel } from './embedding-model';

/**
 * Fetch function type (standardizes the version of fetch used).
 */
type FetchFunction = typeof globalThis.fetch;

export class ZettaAI {
  /**
Use a different URL prefix for API calls, e.g. to use proxy servers.
   */
  readonly baseURL: string;

  /**
 accessToken.
   */
  readonly accessToken?: string;

  /**
API key that is being send using the `Authorization` header.
 */
  readonly apiKey?: string;

  /**
 Organization.
   */
  readonly organization?: string;

  /**
 project.
   */
  readonly project?: string;

  /**
Custom headers to include in the requests.
   */
  readonly headers?: Record<string, string>;

  /**
  Custom fetch implementation. You can use it as a middleware to intercept requests,
  or to provide a custom fetch implementation for e.g. testing.
      */
  readonly fetch?: FetchFunction;

  /**
   * Creates a new  provider instance.
   */
  constructor(options = {} as ProviderSettings) {
    if (!options.baseURL) {
      throw new Error('Zettaai Error: Missing AI Inferrencen API!');
    }

    this.baseURL = withoutTrailingSlash(options.baseURL)!;
    this.apiKey = options.apiKey;
    this.accessToken = options.accessToken;
    this.organization = options.organization;
    this.project = options.project;
    this.headers = options.headers;
    this.fetch = options.fetch;
  }

  private get baseConfig() {
    return {
      organization: this.organization,
      baseURL: this.baseURL,
      headers: () => ({
        Authorization: `Bearer ${this.accessToken}`,
        'X-API-Key': this.apiKey,
        'X--Organization': this.organization,
        'X--Project': this.project,
        ...this.headers,
      }),
      api: `${process.env.REACT_APP_ZETTAAI_BACKEND_API}/v1/inference`,
      fetch: this.fetch,
    };
  }

  embedding = (modelId: string, settings: EmbeddingSettings = {}) => {
    return new EmbeddingModel(modelId, settings, {
      provider: 'zettaai.embedding',
      ...this.baseConfig,
    });
  };

  chat = (modelId: string, settings: ChatSettings = {}) => {
    return new ChatLanguageModel(modelId, settings, {
      provider: 'zettaai.chat',
      ...this.baseConfig,
      compatibility: 'strict',
    });
  };

  completion = (modelId: string, settings: CompletionSettings = {}) => {
    return new CompletionLanguageModel(modelId, settings, {
      provider: 'zettaai.completion',
      ...this.baseConfig,
      compatibility: 'strict',
    });
  };
}
