import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { BotConfigService } from '../bot-config/bot-config.service';
import { OpenAiService } from './llm/open-ai.service';
import { RagService } from './rag/rag.service';
import { DateTime } from 'luxon';
import { MemoryService } from './memory/memory.service';
import { OpenAiMessage } from './types/chat-message.type';

@Injectable()
export class AiService implements OnModuleInit, OnModuleDestroy {
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly botConfigService: BotConfigService,
    private readonly ragService: RagService,
    private readonly openAiService: OpenAiService,
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
    const now = DateTime.now().setZone('America/Guayaquil').setLocale('es');
    const history = this.memoryService.getHistory(accountId, waId);
    const dayName = now.weekdayLong;

    let ragContext = '';

    if (botConfig.useRag && userText.length > 10) {
      const useRag = await this.openAiService.shouldUseRagLLM(userText);
      console.log(useRag);
      if (useRag) {
        ragContext = await this.ragService.getContext({
          botConfigId: botConfig.id,
          query: userText,
          limit: 5,
        });

        console.log(`RAG context retrieved (${ragContext} )`);
      }
    }

    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: `${botConfig.systemPrompt}
Fecha actual (ISO): ${now.toISO()} y el día de la semana es ${dayName}.

Reglas:
- Usa el contexto SOLO si es relevante.
- Si el contexto no contiene la respuesta, dilo explícitamente.
- Solo ejecuta acciones externas si el usuario lo pide claramente.`,
      },
    ];

    if (ragContext) {
      messages.push({
        role: 'system',
        content: `Contexto de la base de conocimiento:
${ragContext}`,
      });
    }

    console.log(`${botConfig.systemPrompt}
Fecha actual (ISO): ${now.toISO()} y el día de la semana es ${dayName}.

Reglas:
- Usa el contexto SOLO si es relevante.
- Si el contexto no contiene la respuesta, dilo explícitamente.
- Solo ejecuta acciones externas si el usuario lo pide claramente.`);

    messages.push(
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userText },
    );

    const response =
      botConfig.useMcp && botConfig.mcpServerUrl
        ? await this.openAiService.generateWithMcp({
            model: botConfig.model,
            messages,
            mcpServerUrl: botConfig.mcpServerUrl,
          })
        : await this.openAiService.generate({
            model: botConfig.model,
            messages,
          });

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
