import { LanguageModelV1LogProbs } from '@ai-sdk/provider';

type ChatLogProbs = {
  content:
    | {
        token: string;
        logprob: number;
        top_logprobs:
          | {
              token: string;
              logprob: number;
            }[]
          | null;
      }[]
    | null;
};

export function mapChatLogProbsOutput(
  logprobs: ChatLogProbs | null | undefined
): LanguageModelV1LogProbs | undefined {
  return (
    logprobs?.content?.map(({ token, logprob, top_logprobs }) => ({
      token,
      logprob,
      topLogprobs: top_logprobs
        ? top_logprobs.map((item) => ({
            token: item.token,
            logprob: item.logprob,
          }))
        : [],
    })) ?? undefined
  );
}
