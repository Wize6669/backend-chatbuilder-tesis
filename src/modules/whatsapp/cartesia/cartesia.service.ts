import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CartesiaService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async textToAudio(text: string): Promise<Buffer> {
    try {
      const apiKey = this.configService.get<string>('CARTESIA_API_KEY');

      if (!apiKey) {
        throw new Error('CARTESIA_API_KEY no está configurada');
      }

      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.cartesia.ai/tts/bytes',
          {
            model_id: 'sonic-3',
            transcript: text,
            voice: {
              mode: 'id',
              id: '15d0c2e2-8d29-44c3-be23-d585d5f154a1',
            },
            output_format: {
              container: 'mp3',
              encoding: 'pcm_f32le',
              sample_rate: 44100,
            },
            speed: 'normal',
            generation_config: {
              speed: 1,
              volume: 1,
            },
          },
          {
            headers: {
              'X-API-Key': apiKey,
              'Cartesia-Version': '2025-04-16',
              'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer',
          },
        ),
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error(
        'Error en Cartesia:',
        error.response?.data || error.message,
      );
      throw new Error('No se pudo generar el audio');
    }
  }
}
