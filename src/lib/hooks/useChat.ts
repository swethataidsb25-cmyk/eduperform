'use client';

import { useState, useCallback } from 'react';
import { getChatCompletion, getStreamingChatCompletion } from '@/lib/ai/chatCompletion';

export function useChat(provider: string, model: string, streaming: boolean = true) {
  const [response, setResponse] = useState('');
  const [fullResponse, setFullResponse] = useState<object | object[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (messages: object[], parameters: object = {}) => {
      setResponse('');
      setFullResponse(streaming ? [] : null);
      setIsLoading(true);
      setError(null);

      try {
        if (streaming) {
          await getStreamingChatCompletion(
            provider,
            model,
            messages,
            (chunk: object) => {
              setFullResponse((prev) => [...(Array.isArray(prev) ? prev : []), chunk]);
              const content = (chunk as any)?.choices?.[0]?.delta?.content;
              if (content) setResponse((prev) => prev + content);
            },
            () => setIsLoading(false),
            (err: Error) => {
              setError(err);
              setIsLoading(false);
            },
            parameters
          );
        } else {
          const result = await getChatCompletion(provider, model, messages, parameters);
          setFullResponse(result);
          setResponse(result?.choices?.[0]?.message?.content || '');
          setIsLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    },
    [provider, model, streaming]
  );

  return { response, fullResponse, isLoading, error, sendMessage };
}
