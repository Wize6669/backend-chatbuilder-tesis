import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageResponse, MessageStrategy } from './message-strategy.interface';
import OpenAI from 'openai';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

@Injectable()
export class AudioMessageStrategy implements MessageStrategy {
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  canHandle(message: any): boolean {
    return !!message.audioMessage;
  }

  async handle(
    message: any,
    waId: string,
    sock?: any,
  ): Promise<MessageResponse> {
    const messageContent = message.message || message;
    const audioMsg = messageContent.audioMessage;

    console.log(`🎤 Audio recibido en ${waId}, duración: ${audioMsg.seconds}s`);

    try {
      const audioBuffer = (await downloadMediaMessage(
        message,
        'buffer',
        {},
      )) as Buffer;

      console.log(`✅ Audio descargado: ${audioBuffer.length} bytes`);

      const transcribedText = await this.convertAudioToText(audioBuffer);

      console.log(`✅ Audio transcrito: "${transcribedText}"`);

      return {
        type: 'text',
        content: transcribedText,
        originalMessage: messageContent,
      };
    } catch (error) {
      console.error('❌ Error procesando audio:', error);
      throw error;
    }
  }

  private async convertAudioToText(audioBuffer: Buffer): Promise<string> {
    let tempFilePath: string | null = null;

    try {
      const tempDir = os.tmpdir();
      const fileName = `audio-${Date.now()}.ogg`;
      tempFilePath = path.join(tempDir, fileName);

      await writeFile(tempFilePath, audioBuffer);

      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'es',
      });

      return transcription.text;
    } catch (error) {
      console.error('❌ Error con Whisper:', error);
      throw new Error('No se pudo transcribir el audio');
    } finally {
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
          console.log(`🗑️ Archivo temporal eliminado`);
        } catch (e) {
          console.error('Error eliminando temp file:', e);
        }
      }
    }
  }
}
