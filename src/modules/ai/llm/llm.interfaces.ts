export interface LlmGenerateInput {
  model: string;
  prompt: string;
  mcpServerUrl?: string;
}

export interface LlmService {
  generate(input: LlmGenerateInput): Promise<string>;
}
