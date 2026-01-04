import { Injectable } from '@nestjs/common';
import {
  MessageStrategy,
  MessageResponse,
} from '../strategies/message-strategy.interface';
import { TextMessageStrategy } from '../strategies/text-message.strategy';
import { AudioMessageStrategy } from '../strategies/audio-message.strategy';
import { CartesiaService } from '../cartesia/cartesia.service';
import { AiService } from '../../ai/ai.service';

@Injectable()
export class MessageProcessorService {
  private strategies: MessageStrategy[] = [];

  constructor(
    private readonly textStrategy: TextMessageStrategy,
    private readonly audioStrategy: AudioMessageStrategy,
    private readonly cartesiaService: CartesiaService,
    private readonly aiService: AiService,
  ) {
    this.strategies = [this.textStrategy, this.audioStrategy];
  }

  async process(
    accountId: string,
    message: any,
    waId: string,
    sock?: any,
  ): Promise<{ type: 'text' | 'audio'; content: string | Buffer } | null> {
    try {
      const messageContent = message.message || message;
      const strategy = this.strategies.find((s) => s.canHandle(messageContent));

      if (!strategy) {
        return {
          type: 'text',
          content: 'Lo siento, no puedo procesar este tipo de mensaje aún.',
        };
      }

      const messageResponse: MessageResponse = await strategy.handle(
        message,
        waId,
        sock,
      );

      if (!messageResponse.content) {
        console.log(`⚠️ Mensaje vacío de ${waId}`);
        return null;
      }

      const userText = messageResponse.content as string;

      const responseText = await this.aiService.generateResponse({
        accountId,
        waId,
        userText,
      });

      // Si era audio, responder con audio
      if (messageResponse.originalMessage?.audioMessage) {
        console.log(`🔊 Generando respuesta en audio para ${waId}`);
        const audioBuffer =
          await this.cartesiaService.textToAudio(responseText);

        return {
          type: 'audio',
          content: audioBuffer,
        };
      }

      return {
        type: 'text',
        content: responseText,
      };
    } catch (error) {
      console.error(`❌ Error procesando mensaje de ${waId}:`, error);

      return {
        type: 'text',
        content: 'Lo siento, hubo un error procesando tu mensaje.',
      };
    }
  }
}
