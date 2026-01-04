import { Injectable } from '@nestjs/common';
import { MessageResponse, MessageStrategy } from './message-strategy.interface';

@Injectable()
export class TextMessageStrategy implements MessageStrategy {
  canHandle(message: any): boolean {
    return !!(message.conversation || message.extendedTextMessage?.text);
  }

  async handle(message: any, waId: string): Promise<MessageResponse> {
    const text =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      '';
    console.log(`Mensaje de texto recibido en ${waId}: ${text}`);

    return {
      type: 'text',
      content: text,
      originalMessage: text,
    };
  }
}
