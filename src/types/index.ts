export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  saveDirectory?: string;
  saveFormat?: 'json' | 'markdown';
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
