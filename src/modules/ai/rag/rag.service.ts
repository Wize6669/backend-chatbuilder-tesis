import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../llm/open-ai.service';
import { QdrantService } from './qdrant.service';

@Injectable()
export class RagService {
  constructor(
    private readonly openAi: OpenAiService,
    private readonly qdrant: QdrantService,
  ) {}

  async retrieveContext(query: string, botConfigId: string): Promise<string> {
    const queryEmbedding = await this.openAi.embed(query);

    const results = await this.qdrant.search({
      collection: `bot_${botConfigId}`,
      vector: queryEmbedding,
      limit: 5,
    });

    return results
      .map((r) => `Fuente: ${r?.payload?.source}\n${r?.payload?.text}`)
      .join('\n\n');
  }
}
