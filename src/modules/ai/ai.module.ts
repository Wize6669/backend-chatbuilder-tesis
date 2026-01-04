import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { BotConfigModule } from '../bot-config/bot-config.module';
import { RagModule } from './rag/rag.module';
import { LlmModule } from './llm/llm.module';
import { HttpModule } from '@nestjs/axios';
import { MemoryModule } from './memory/memory.module';

@Module({
  imports: [BotConfigModule, RagModule, LlmModule, HttpModule, MemoryModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
