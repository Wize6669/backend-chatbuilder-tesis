export type OpenAiRole = 'system' | 'user' | 'assistant';

export interface OpenAiMessage {
  role: OpenAiRole;
  content: string;
}
