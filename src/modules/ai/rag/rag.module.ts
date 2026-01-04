import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { QdrantService } from './qdrant.service';
import { IngestionService } from './ingestion/ingestion.service';
import { ChunkerService } from './ingestion/chunker.service';
import { LlmModule } from '../llm/llm.module';
import { RagController } from './rag.controller';

@Module({
  imports: [LlmModule],
  providers: [RagService, QdrantService, IngestionService, ChunkerService],
  exports: [RagService],
  controllers: [RagController],
})
export class RagModule {}
