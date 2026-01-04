import { Injectable } from '@nestjs/common';

@Injectable()
export class ChunkerService {
  chunk(text: string, maxLength = 800, overlap = 100): string[] {
    if (!text || text.trim().length === 0) return [];

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + maxLength, text.length);
      const chunk = text.slice(start, end).trim();

      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      start += maxLength - overlap;
    }

    return chunks;
  }

  chunkByParagraphs(text: string, maxLength = 1000): string[] {
    if (!text || text.trim().length === 0) return [];

    const paragraphs = text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length < maxLength) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = paragraph;
      }
    }

    if (currentChunk) chunks.push(currentChunk);

    return chunks;
  }

  chunkBySentences(text: string, maxLength = 800): string[] {
    if (!text || text.trim().length === 0) return [];

    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length < maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      }
    }

    if (currentChunk) chunks.push(currentChunk);

    return chunks;
  }

  chunkSmart(text: string, maxLength = 800): string[] {
    if (!text || text.trim().length === 0) return [];

    if (text.includes('\n\n')) {
      return this.chunkByParagraphs(text, maxLength);
    }

    const sentenceCount = (text.match(/[.!?]/g) || []).length;
    if (sentenceCount > 3) {
      return this.chunkBySentences(text, maxLength);
    }

    return this.chunk(text, maxLength, 100);
  }
}
