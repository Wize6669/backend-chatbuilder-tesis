import { Module } from '@nestjs/common';
import { OpenAiService } from './open-ai.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class LlmModule {}
