import { patchFirstMessagesPage } from './queryUtils';
import { Message } from '@shared/types';
import { QueryClient } from '@tanstack/react-query';
import { Severity } from '@features/notifications/notification.types';
import { messageAPI } from '@shared/data';

// Base URL for Ollama taken from env – no hard-coded IPs
const OLLAMA_URL = (import.meta as any).env.VITE_OLLAMA_URL as string;

export interface CommandHandlerOptions {
  text: string;
  serverId: string | null;
  qc: QueryClient;
  currentUserId: string | undefined;
  notify?: (msg: string, severity?: Severity) => void;
}

/**
 * Пытается обработать slash-команду. Возвращает `true`, если команда распознана
 * и обработана (в этом случае дальнейшая отправка сообщения не требуется).
 */
export async function handleSlashCommand({
  text,
  serverId,
  qc,
  currentUserId,
  notify,
}: CommandHandlerOptions): Promise<boolean> {
  if (!text.startsWith('/')) return false;

  const [rawCommand, ...args] = text.slice(1).trim().split(/\s+/);
  const command = rawCommand.toLowerCase();

  switch (command) {
    case 'ollama': {
      if (!serverId) {
        notify?.('Выберите сервер перед использованием /ollama', 'warning');
        return true;
      }

      if (args.length === 0) {
        notify?.('Нужно указать запрос после /ollama', 'warning');
        return true;
      }

      const modelArg = args.length > 1 ? args[0] : undefined;
      const prompt = args.length > 1 ? args.slice(1).join(' ') : args.join(' ');

      await sendOllamaPrompt({
        serverId,
        prompt,
        model: modelArg,
        qc,
        notify,
      });
      return true;
    }

    default:
      return false;
  }
}

export interface SendOllamaOptions {
  serverId: string;
  prompt: string;
  model?: string;
  qc: QueryClient;
  notify?: (msg: string, severity?: Severity) => void;
}

// --- Ollama Streaming helper (browser fetch + ReadableStream) ---
interface StreamCallbacks {
  onThinking: (chunk: string, finished: boolean) => void;
  onAnswer: (chunk: string, finished: boolean) => void;
}

async function ollamaStream(
  { model, prompt }: { model: string; prompt: string },
  cb: StreamCallbacks,
) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
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
}

/**
 * Отправляет запрос к локальной Ollama и публикует ответ в чате.
 * Возвращает Promise, который завершается когда ответ получен/ошибка обработана.
 */
export async function sendOllamaPrompt({
  serverId,
  prompt,
  model,
  qc,
  notify,
}: SendOllamaOptions): Promise<void> {
  if (!serverId) {
    notify?.('Нужно выбрать сервер', 'warning');
    return;
  }

  if (!prompt.trim()) {
    notify?.('Нужно ввести запрос', 'warning');
    return;
  }

  const effectiveModel =
    model || (import.meta as any).env.VITE_OLLAMA_DEFAULT_MODEL || 'llama3';

  const clientNonce = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const placeholderId = `ollama_${clientNonce}`;

  const BOT_USER_ID = (import.meta as any).env.VITE_BOT_USER_ID as string;
  const BOT_USERNAME = (import.meta as any).env.VITE_BOT_USERNAME as string;
  const BOT_AVATAR = (import.meta as any).env.VITE_BOT_AVATAR_URL as string;

  if (!BOT_USER_ID || !BOT_USERNAME || !BOT_AVATAR) {
    throw new Error('Bot env variables are not set (VITE_BOT_USER_ID, VITE_BOT_USERNAME, VITE_BOT_AVATAR_URL)');
  }

  const placeholder: Message = {
    id: placeholderId,
    content: '',
    authorId: BOT_USER_ID,
    serverId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      id: BOT_USER_ID,
      username: BOT_USERNAME,
      avatar: BOT_AVATAR,
    },
    // кастомный статус для UI
    status: 'thinking' as any,
  } as Message;

  patchFirstMessagesPage(qc, serverId, (msgs) => [...msgs, placeholder]);

  try {
    let thinkingAccum = '';
    let answerText = '';
    let inThinkingPhase = true;
    let lastThinkingRender = 0;

    await ollamaStream(
      { model: effectiveModel, prompt },
      {
        onThinking(chunk: string, _finished: boolean) {
          if (!inThinkingPhase) return;
          thinkingAccum += chunk;
          const now = Date.now();
          if (now - lastThinkingRender > 150) {
            lastThinkingRender = now;
            const styled = `<div style="font-size:0.8rem;color:#BEBEBE;border-left:4px solid #5865F2;padding:4px 8px;margin:4px 0;border-radius:2px 0 0 2px;white-space:pre-wrap;">${thinkingAccum}</div>`;
            patchFirstMessagesPage(qc, serverId, (msgs) =>
              msgs.map((m): Message =>
                m.id === placeholderId ? { ...m, content: styled, status: 'thinking' } : m,
              ),
            );
          }
        },
        async onAnswer(chunk: string, finished: boolean) {
          if (inThinkingPhase) {
            inThinkingPhase = false;
            thinkingAccum = '';
          }

          answerText += chunk;
          patchFirstMessagesPage(qc, serverId, (msgs) =>
            msgs.map((m): Message =>
              m.id === placeholderId ? { ...m, content: answerText, status: 'sending' } : m,
            ),
          );

          if (finished && answerText.trim().length) {
            try {
              const saved = await messageAPI.sendBotMessage(serverId, answerText.trim());
              patchFirstMessagesPage(qc, serverId, (msgs) =>
                msgs.map((m): Message =>
                  m.id === placeholderId ? saved.data! : m,
                ),
              );
            } catch {
              // fallback leave combined text
              patchFirstMessagesPage(qc, serverId, (msgs) =>
                msgs.map((m): Message =>
                  m.id === placeholderId ? { ...m, status: undefined } : m,
                ),
              );
            }
          }
        },
      },
    );
  } catch (err) {
    let msg = err instanceof Error ? err.message : 'Unknown error';
    if (typeof msg === 'string' && msg.toLowerCase().includes('failed to fetch')) {
      msg = 'Помощник недоступен';
    }
    patchFirstMessagesPage(qc, serverId, (msgs) =>
      msgs.map((m): Message =>
        m.id === placeholderId ? { ...m, content: msg, status: 'failed' } : m,
      ),
    );
    notify?.(msg, 'error');
  }
} 