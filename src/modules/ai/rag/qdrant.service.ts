import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

@Injectable()
export class QdrantService implements OnModuleInit {
  private client: QdrantClient;

  constructor(private config: ConfigService) {
    this.client = new QdrantClient({
      url: this.config.get<string>('QDRANT_URL', 'http://localhost:6333'),
      apiKey: this.config.get<string>('QDRANT_API_KEY'),
    });
  }

  onModuleInit() {
    console.log('✅ Qdrant service initialized');
  }

  async ensureCollection(collection: string, vectorSize = 1536) {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some((c) => c.name === collection);

      if (!exists) {
        await this.client.createCollection(collection, {
          vectors: {
            size: vectorSize,
            distance: 'Cosine',
          },
        });
        console.log(`✅ Collection created: ${collection}`);
      }
    } catch (error) {
      console.error(`Error ensuring collection ${collection}:`, error);
      throw error;
    }
  }

  async upsert({
    collection,
    vector,
    payload,
    id,
  }: {
    collection: string;
    vector: number[];
    payload: any;
    id?: string;
  }): Promise<void> {
    await this.ensureCollection(collection, vector.length);

    await this.client.upsert(collection, {
      wait: true,
      points: [
        {
          id: id || crypto.randomUUID(),
          vector,
          payload,
        },
      ],
    });
  }

  async search({
    collection,
    vector,
    limit = 5,
    filter,
  }: {
    collection: string;
    vector: number[];
    limit?: number;
    filter?: any;
  }) {
    try {
      const results = await this.client.search(collection, {
        vector,
        limit,
        filter,
        with_payload: true,
        with_vector: false,
      });

      return results.map((r) => ({
        id: r.id,
        score: r.score,
        payload: r.payload,
      }));
    } catch (error) {
      console.error(`Error searching in ${collection}:`, error);
      return [];
    }
  }

  async deleteCollection(collection: string): Promise<void> {
    try {
      await this.client.deleteCollection(collection);
      console.log(`✅ Collection deleted: ${collection}`);
    } catch (error) {
      console.warn(`Collection ${collection} not found or already deleted`);
    }
  }

  async deleteByFilter(collection: string, filter: any): Promise<void> {
    try {
      await this.client.delete(collection, { filter });
      console.log(`✅ Deleted points from ${collection}`);
    } catch (error) {
      console.error(`Error deleting from ${collection}:`, error);
    }
  }

  async countPoints(collection: string): Promise<number> {
    try {
      const info = await this.client.getCollection(collection);
      return info.points_count || 0;
    } catch (error) {
      console.warn(`Collection ${collection} not found`);
      return 0;
    }
  }

  async listSources(botConfigId: string) {
    const collection = `bot_${botConfigId}`;

    const sources = new Map<string, any>();
    let offset: string | number | Record<string, unknown> | null | undefined =
      undefined;

    do {
      const result = await this.client.scroll(collection, {
        limit: 1000,
        offset,
        with_payload: true,
        with_vector: false,
      });

      for (const point of result.points) {
        const p: any = point.payload;
        if (!p?.source) continue;

        if (!sources.has(p.source)) {
          sources.set(p.source, {
            source: p.source,
            fileName: p.fileName ?? p.source,
            fileType: p.fileType ?? 'unknown',
            totalChunks: p.totalChunks ?? 0,
            createdAt: p.createdAt,
          });
        }
      }

      offset = result.next_page_offset;
    } while (offset !== null && offset !== undefined);

    return Array.from(sources.values());
  }
}
