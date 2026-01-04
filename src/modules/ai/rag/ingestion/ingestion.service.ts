import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../../llm/open-ai.service';
import { QdrantService } from '../qdrant.service';
import { ChunkerService } from './chunker.service';
import pdf from 'pdf-parse-new';

@Injectable()
export class IngestionService {
  constructor(
    private readonly openAi: OpenAiService,
    private readonly qdrant: QdrantService,
    private readonly chunker: ChunkerService,
  ) {}

  async ingestText({
    botConfigId,
    text,
    source,
    metadata = {},
    chunkStrategy = 'smart',
  }: {
    botConfigId: string;
    text: string;
    source: string;
    metadata?: Record<string, any>;
    chunkStrategy?: 'smart' | 'paragraphs' | 'sentences' | 'fixed';
  }): Promise<{ success: true; chunksIngested: number }> {
    const chunks = this.getChunks(text, chunkStrategy);
    console.log(`📦 Created ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await this.openAi.embed(chunks[i]);

      await this.qdrant.upsert({
        collection: `bot_${botConfigId}`,
        vector: embedding,
        payload: {
          text: chunks[i],
          source,
          botConfigId,
          chunkIndex: i,
          totalChunks: chunks.length,
          createdAt: new Date().toISOString(),
          ...metadata,
        },
      });
    }

    return {
      success: true,
      chunksIngested: chunks.length,
    };
  }

  async ingestFile({
    botConfigId,
    buffer,
    mimeType,
    filename,
    metadata = {},
  }: {
    botConfigId: string;
    buffer: Buffer;
    mimeType: string;
    filename: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: true; chunksIngested: number }> {
    console.log(`📁 Processing file: ${filename} (${mimeType})`);

    let text = '';

    if (mimeType === 'application/pdf') {
      try {
        const pdfParse = await pdf(buffer);
        text = pdfParse.text;
      } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error(`Failed to parse PDF file: ${error}`);
      }
    } else if (
      mimeType === 'text/plain' ||
      mimeType === 'text/markdown' ||
      mimeType === 'text/csv'
    ) {
      text = buffer.toString('utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in file');
    }

    return this.ingestText({
      botConfigId,
      text,
      source: filename,
      metadata: {
        fileType: mimeType,
        fileName: filename,
        ...metadata,
      },
    });
  }

  async deleteAllDocuments(botConfigId: string): Promise<void> {
    const collection = `bot_${botConfigId}`;
    await this.qdrant.deleteCollection(collection);
    console.log(`✅ Deleted all documents for bot ${botConfigId}`);
  }

  async deleteBySource(botConfigId: string, source: string): Promise<void> {
    const collection = `bot_${botConfigId}`;
    await this.qdrant.deleteByFilter(collection, {
      must: [{ key: 'source', match: { value: source } }],
    });
    console.log(`✅ Deleted documents from source: ${source}`);
  }

  async getStats(botConfigId: string) {
    const collection = `bot_${botConfigId}`;
    const count = await this.qdrant.countPoints(collection);

    return {
      botConfigId,
      collection,
      totalChunks: count,
    };
  }

  private getChunks(
    text: string,
    strategy: 'smart' | 'paragraphs' | 'sentences' | 'fixed',
  ): string[] {
    switch (strategy) {
      case 'smart':
        return this.chunker.chunkSmart(text);
      case 'paragraphs':
        return this.chunker.chunkByParagraphs(text);
      case 'sentences':
        return this.chunker.chunkBySentences(text);
      case 'fixed':
        return this.chunker.chunk(text);
      default:
        return this.chunker.chunkSmart(text);
    }
  }
}
