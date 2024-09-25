/* eslint-disable no-nested-ternary */
import {
  LanguageModelV1,
  LanguageModelV1CallWarning,
  LanguageModelV1FinishReason,
  LanguageModelV1LogProbs,
  LanguageModelV1StreamPart,
  UnsupportedFunctionalityError,
} from '@ai-sdk/provider';
import {
  FetchFunction,
  ParseResult,
  combineHeaders,
  createEventSourceResponseHandler,
  createJsonResponseHandler,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod';
import { convertToCompletionPrompt } from './convert-to-completion-prompt';
import { mapCompletionLogProbs } from './map-completion-logprobs';
import { mapFinishReason } from './map-finish-reason';
import { CompletionSettings } from './settings';
import { errorDataSchema, failedResponseHandler } from './error';

// limited version of the schema, focussed on what is needed for the implementation
// this approach limits breakages when the API changes and increases efficiency
const completionResponseSchema = z.object({
  choices: z.array(
    z.object({
      text: z.string(),
      finish_reason: z.string(),
      logprobs: z
        .object({
          tokens: z.array(z.string()),
          token_logprobs: z.array(z.number()),
          top_logprobs: z.array(z.record(z.string(), z.number())).nullable(),
        })
        .nullable()
        .optional(),
    })
  ),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
  }),
});

// limited version of the schema, focussed on what is needed for the implementation
// this approach limits breakages when the API changes and increases efficiency
const completionChunkSchema = z.union([
  z.object({
    choices: z.array(
      z.object({
        text: z.string(),
        finish_reason: z.string().nullish(),
        index: z.number(),
        logprobs: z
          .object({
            tokens: z.array(z.string()),
            token_logprobs: z.array(z.number()),
            top_logprobs: z.array(z.record(z.string(), z.number())).nullable(),
          })
          .nullable()
          .optional(),
      })
    ),
    usage: z
      .object({
        prompt_tokens: z.number(),
        completion_tokens: z.number(),
      })
      .optional()
      .nullable(),
  }),
  errorDataSchema,
]);

type CompletionConfig = {
  provider: string;
  compatibility: 'strict' | 'compatible';
  headers: () => Record<string, string | undefined>;
  api: string;
  fetch?: FetchFunction;
};

export class CompletionLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = 'v1';

  readonly defaultObjectGenerationMode = undefined;

  readonly modelId: string;

  readonly settings: CompletionSettings;

  private readonly config: CompletionConfig;

  constructor(
    modelId: string,
    settings: CompletionSettings,
    config: CompletionConfig
  ) {
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }

  get provider(): string {
    return this.config.provider;
  }

  private getArgs({
    mode,
    inputFormat,
    prompt,
    maxTokens,
    temperature,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    stopSequences: userStopSequences,
    responseFormat,
    seed,
  }: Parameters<LanguageModelV1['doGenerate']>[0]) {
    const { type } = mode;

    const warnings: LanguageModelV1CallWarning[] = [];

    if (topK != null) {
      warnings.push({
        type: 'unsupported-setting',
        setting: 'topK',
      });
    }

    if (responseFormat != null && responseFormat.type !== 'text') {
      warnings.push({
        type: 'unsupported-setting',
        setting: 'responseFormat',
        details: 'JSON response format is not supported.',
      });
    }

    const { prompt: completionPrompt, stopSequences } =
      convertToCompletionPrompt({ prompt, inputFormat });

    const stop = [...(stopSequences ?? []), ...(userStopSequences ?? [])];

    const baseArgs = {
      // model id:
      model: this.modelId,
      service_id: this.modelId,

      // model specific settings:
      echo: this.settings.echo,
      logit_bias: this.settings.logitBias,
      logprobs:
        typeof this.settings.logprobs === 'number'
          ? this.settings.logprobs
          : typeof this.settings.logprobs === 'boolean'
          ? this.settings.logprobs
            ? 0
            : undefined
          : undefined,
      suffix: this.settings.suffix,
      user: this.settings.user,

      // standardized settings:
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      seed,

      // prompt:
      prompt: completionPrompt,

      // stop sequences:
      stop: stop.length > 0 ? stop : undefined,
    };

    switch (type) {
      case 'regular': {
        if (mode.tools?.length) {
          throw new UnsupportedFunctionalityError({
            functionality: 'tools',
          });
        }

        if (mode.toolChoice) {
          throw new UnsupportedFunctionalityError({
            functionality: 'toolChoice',
          });
        }

        return { args: baseArgs, warnings };
      }

      case 'object-json': {
        throw new UnsupportedFunctionalityError({
          functionality: 'object-json mode',
        });
      }

      case 'object-tool': {
        throw new UnsupportedFunctionalityError({
          functionality: 'object-tool mode',
        });
      }

      default: {
        const _exhaustiveCheck: never = type;
        throw new Error(`Unsupported type: ${_exhaustiveCheck}`);
      }
    }
  }

  async doGenerate(
    options: Parameters<LanguageModelV1['doGenerate']>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1['doGenerate']>>> {
    const { args, warnings } = this.getArgs(options);

    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.api,
      headers: combineHeaders(this.config.headers(), options.headers),
      body: args,
      failedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        completionResponseSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const { prompt: rawPrompt, ...rawSettings } = args;
    const choice = response.choices[0];

    return {
      text: choice.text,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
      },
      finishReason: mapFinishReason(choice.finish_reason),
      logprobs: mapCompletionLogProbs(choice.logprobs),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawCall: { rawPrompt, rawSettings } as any,
      rawResponse: { headers: responseHeaders },
      warnings,
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1['doStream']>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1['doStream']>>> {
    const { args, warnings } = this.getArgs(options);

    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.api,
      headers: combineHeaders(this.config.headers(), options.headers),
      body: {
        ...args,
        stream: true,

        // only include stream_options when in strict compatibility mode:
        stream_options:
          this.config.compatibility === 'strict'
            ? { include_usage: true }
            : undefined,
      },
      failedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        completionChunkSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const { prompt: rawPrompt, ...rawSettings } = args;

    let finishReason: LanguageModelV1FinishReason = 'unknown';
    let usage: { promptTokens: number; completionTokens: number } = {
      promptTokens: Number.NaN,
      completionTokens: Number.NaN,
    };
    let logprobs: LanguageModelV1LogProbs;

    return {
      stream: response.pipeThrough(
        new TransformStream<
          ParseResult<z.infer<typeof completionChunkSchema>>,
          LanguageModelV1StreamPart
        >({
          transform(chunk, controller) {
            // handle failed chunk parsing / validation:
            if (!chunk.success) {
              finishReason = 'error';
              controller.enqueue({ type: 'error', error: chunk.error });
              return;
            }

            const { value } = chunk;

            // handle error chunks:
            if ('error' in value) {
              finishReason = 'error';
              controller.enqueue({ type: 'error', error: value.error });
              return;
            }

            if (value.usage != null) {
              usage = {
                promptTokens: value.usage.prompt_tokens,
                completionTokens: value.usage.completion_tokens,
              };
            }

            const choice = value.choices[0];

            if (choice?.finish_reason != null) {
              finishReason = mapFinishReason(choice.finish_reason);
            }

            if (choice?.text != null) {
              controller.enqueue({
                type: 'text-delta',
                textDelta: choice.text,
              });
            }

            const mappedLogprobs = mapCompletionLogProbs(choice?.logprobs);
            if (mappedLogprobs?.length) {
              if (logprobs === undefined) logprobs = [];
              logprobs.push(...mappedLogprobs);
            }
          },

          flush(controller) {
            controller.enqueue({
              type: 'finish',
              finishReason,
              logprobs,
              usage,
            });
          },
        })
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawCall: { rawPrompt, rawSettings } as any,
      rawResponse: { headers: responseHeaders },
      warnings,
    };
  }
}
