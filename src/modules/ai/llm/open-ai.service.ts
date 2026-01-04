import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { OpenAiMessage } from '../types/chat-message.type';

@Injectable()
export class OpenAiService {
  private client: OpenAI;

  constructor(config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.get<string>('OPENAI_API_KEY'),
    });
  }

  async generate({
    model,
    messages,
  }: {
    model: string;
    messages: OpenAiMessage[];
  }): Promise<string> {
    const response = await this.client.responses.create({
      model,
      input: messages,
    });

    return response.output_text ?? '';
  }

  async generateWithMcp({
    model,
    messages,
    mcpServerUrl,
  }: {
    model: string;
    messages: OpenAiMessage[];
    mcpServerUrl: string;
  }): Promise<string> {
    const response = await this.client.responses.create({
      model,
      input: messages,
      tools: [
        {
          type: 'mcp',
          server_label: 'calendar-mcp',
          server_description: 'Calendar MCP server',
          server_url: mcpServerUrl,
          require_approval: 'never',
        },
      ],
    });

    return response.output_text ?? '';
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  }
}
