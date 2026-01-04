import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../llm/open-ai.service';
import { QdrantService } from './qdrant.service';

@Injectable()
export class RagService {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly qdrantService: QdrantService,
  ) {}

  async getContext({
    botConfigId,
    query,
    limit = 5,
  }: {
    botConfigId: string;
    query: string;
    limit?: number;
  }): Promise<string> {
    const embedding = await this.openAiService.embed(query);

    const results = await this.qdrantService.search({
      collection: `bot_${botConfigId}`,
      vector: embedding,
      limit,
    });

    return results
      .map((r) => r.payload?.text)
      .filter(Boolean)
      .join('\n\n---\n\n');
  }
}
