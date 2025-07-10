import { Message, User } from '@shared/types';
import { createOptimisticMessage } from '../utils/createOptimisticMessage';
import { updateMessagesCache } from './updateMessagesCache';
import { useQueryClient } from '@tanstack/react-query';
import { messageAPI } from '@shared/data';

const AGENT_URL = (import.meta as any).env.VITE_OLLAMA_URL as string;
const AGENT_MODEL =
  (import.meta as any).env.VITE_OLLAMA_DEFAULT_MODEL || 'llama3';

const getAgentUser = (): Pick<User, 'id' | 'username' | 'avatar'> => {
  return {
    id: ((import.meta as any).env.VITE_BOT_USER_ID as string) || 'bot',
    username: ((import.meta as any).env.VITE_BOT_USERNAME as string) || 'Garry',
    avatar: ((import.meta as any).env.VITE_BOT_AVATAR_URL as string) || '',
  };
};

// --- Ollama Streaming helper (browser fetch + ReadableStream) ---
interface StreamCallbacks {
  onThinking: (chunk: string, finished: boolean) => void;
  onAnswer: (chunk: string, finished: boolean) => void;
}

const agentAnswerStream = async (
  { model, prompt }: { model: string; prompt: string },
  cb: StreamCallbacks
) => {
  const res = await fetch(`${AGENT_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      think: true,
    }),
  });

  if (!res.ok || !res.body) throw new Error('Stream request failed');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let answer = '';
  // streaming states
  let inThinking = true; // overall phase until first answer chunk
  let collectingThink = false; // inside <think>…</think> tag parsing

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const str = decoder.decode(value, { stream: true });
    const lines = str.split('\n').filter(Boolean);
    for (const line of lines) {
      const json = JSON.parse(line);
      const tokenThinking = json.message?.thinking as string | undefined;
      let tokenContent = json.message?.content as string | undefined;

      // Case 1: native thinking field present
      if (tokenThinking !== undefined) {
        if (inThinking) {
          cb.onThinking(tokenThinking, false);
        }
      }

      // Case 2: thinking may be embedded in <think> tags
      if (tokenContent !== undefined) {
        // If the stream is still in explicit thinking phase but we just received content,
        // close the thinking phase before emitting answer.
        if (inThinking && tokenThinking === undefined && !collectingThink) {
          // No explicit thinking tokens but content arrived – switch phases
          inThinking = false;
          cb.onThinking('', true);
        }

        // Process potential <think> blocks inside the content.
        while (tokenContent) {
          if (collectingThink) {
            const endIdx = tokenContent.indexOf('</think>');
            if (endIdx !== -1) {
              // Close thinking block
              const thinkPart = tokenContent.slice(0, endIdx);
              cb.onThinking(thinkPart, false);
              cb.onThinking('', true); // signal finished
              tokenContent = tokenContent.slice(endIdx + 8); // skip '</think>'
              collectingThink = false;
              inThinking = false;
              // After closing, everything else goes to answer
              if (!tokenContent) break;
            } else {
              // Whole chunk still inside thinking
              cb.onThinking(tokenContent, false);
              tokenContent = '';
              break;
            }
          }

          // Not collecting thinking currently
          const startIdx = tokenContent.indexOf('<think');
          if (startIdx !== -1) {
            // Emit part before <think> as answer (if any)
            const answerPart = tokenContent.slice(0, startIdx);
            if (answerPart) {
              answer += answerPart;
              cb.onAnswer(answerPart, false);
            }

            // Move after '<think' tag end '>'
            const tagEnd = tokenContent.indexOf('>', startIdx);
            if (tagEnd !== -1) {
              collectingThink = true;
              inThinking = true;
              tokenContent = tokenContent.slice(tagEnd + 1);
              continue; // handle inside collectingThink in next loop iteration
            } else {
              // Incomplete tag, unlikely – treat rest as answer
              const leftover = tokenContent.slice(startIdx);
              answer += leftover;
              cb.onAnswer(leftover, false);
              tokenContent = '';
              break;
            }
          } else {
            // Regular answer part
            answer += tokenContent;
            cb.onAnswer(tokenContent, false);
            tokenContent = '';
          }
        }
      }
    }
  }

  cb.onAnswer('', true);
};

export const useSendMessageToAgent = (serverId: string) => {
  const qc = useQueryClient();

  const send = (text: string) => {
    setTimeout(() => {
      _send(text);
    }, 300);
  };

  const _send = async (text: string) => {
    const user = getAgentUser();
    const agentAnswer = createOptimisticMessage(
      '...',
      user,
      serverId,
      'thinking'
    );
    const placeholderId = agentAnswer.id;
    updateMessagesCache(qc, serverId, (msgs) => [...msgs, agentAnswer]);

    try {
      let thinkingAccum = '';
      let answerText = '';
      let inThinkingPhase = true;
      let lastThinkingRender = 0;

      await agentAnswerStream(
        { model: AGENT_MODEL, prompt: text },
        {
          onThinking(chunk: string, _finished: boolean) {
            if (!inThinkingPhase) return;
            thinkingAccum += chunk;
            const now = Date.now();
            if (now - lastThinkingRender > 150) {
              lastThinkingRender = now;
              const styled = `<div style="font-size:0.8rem;color:#BEBEBE;border-left:4px solid #5865F2;padding:4px 8px;margin:4px 0;border-radius:2px 0 0 2px;white-space:pre-wrap;">${thinkingAccum}</div>`;

              updateMessagesCache(qc, serverId, (msgs) =>
                msgs.map(
                  (m): Message =>
                    m.id === placeholderId
                      ? { ...m, content: styled, status: 'thinking' }
                      : m
                )
              );
            }
          },
          async onAnswer(chunk: string, finished: boolean) {
            if (inThinkingPhase) {
              inThinkingPhase = false;
              thinkingAccum = '';
            }

            answerText += chunk;
            updateMessagesCache(qc, serverId, (msgs) =>
              msgs.map(
                (m): Message =>
                  m.id === placeholderId
                    ? { ...m, content: answerText, status: 'sending' }
                    : m
              )
            );

            if (finished && answerText.trim().length) {
              try {
                const saved = await messageAPI.sendBotMessage(
                  serverId,
                  answerText.trim()
                );

                updateMessagesCache(qc, serverId, (msgs) =>
                  msgs.map(
                    (m): Message => (m.id === placeholderId ? saved.data! : m)
                  )
                );
              } catch {
                // fallback leave combined text

                updateMessagesCache(qc, serverId, (msgs) =>
                  msgs.map(
                    (m): Message =>
                      m.id === placeholderId ? { ...m, status: 'failed' } : m
                  )
                );
              }
            }
          },
        }
      );
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Unknown error';
      if (
        typeof msg === 'string' &&
        msg.toLowerCase().includes('failed to fetch')
      ) {
        msg = 'Помощник недоступен';
      }
      updateMessagesCache(qc, serverId, (msgs) =>
        msgs.map(
          (m): Message =>
            m.id === placeholderId ? { ...m, status: 'failed' } : m
        )
      );
      // notify?.(msg, 'error');
    }
  };

  return { send };
};
