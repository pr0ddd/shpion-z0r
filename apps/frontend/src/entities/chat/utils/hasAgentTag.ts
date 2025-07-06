/**
 * Проверяет, содержит ли текст тег @ai
 * @param text - текст сообщения
 * @returns true, если текст содержит тег @ai, иначе false
 */
export function hasAgentTag(text: string): boolean {
  return text.startsWith('@ai');
}
