import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { BotConfigService } from '../bot-config/bot-config.service';
import { OpenAiService } from './llm/open-ai.service';
import { RagService } from './rag/rag.service';
import { HttpService } from '@nestjs/axios';
import { DateTime } from 'luxon';
import { MemoryService } from './memory/memory.service';
import { OpenAiMessage } from './types/chat-message.type';

@Injectable()
export class AiService {
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly botConfigService: BotConfigService,
    private readonly ragService: RagService,
    private readonly openAiService: OpenAiService,
    private readonly httpService: HttpService,
    private readonly memoryService: MemoryService,
  ) {}

  onModuleInit() {
    this.cleanupInterval = setInterval(
      () => this.memoryService.cleanExpiredConversations(),
      10 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  async generateResponse({
    accountId,
    waId,
    userText,
  }: {
    accountId: string;
    waId: string;
    userText: string;
  }): Promise<string> {
    const botConfig =
      await this.botConfigService.findByWhatsappAccountId(accountId);

    const now = DateTime.now().setZone('America/Guayaquil');

    const history = this.memoryService.getHistory(accountId, waId);

    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: `${botConfig.systemPrompt}\n\nFecha actual (ISO): ${now.toISO()}`,
      },
      ...history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: userText,
      },
    ];

    let response: string;

    if (botConfig.useMcp && botConfig.mcpServerUrl) {
      response = await this.openAiService.generateWithMcp({
        model: botConfig.model,
        messages,
        mcpServerUrl: botConfig.mcpServerUrl,
      });
    } else {
      response = await this.openAiService.generate({
        model: botConfig.model,
        messages,
      });
    }

    this.memoryService.addMessage(accountId, waId, 'user', userText);
    this.memoryService.addMessage(accountId, waId, 'assistant', response);

    return response;
  }

  clearUserHistory(accountId: string, waId: string): void {
    this.memoryService.clearHistory(accountId, waId);
  }

  getMemoryStats() {
    return this.memoryService.getStats();
  }
}
