import { Injectable } from '@nestjs/common';

export type MemoryRole = 'user' | 'assistant';

export interface MemoryMessage {
  role: MemoryRole;
  content: string;
  timestamp: number;
}

@Injectable()
export class MemoryService {
  private conversations: Map<string, MemoryMessage[]> = new Map();

  private readonly MAX_MESSAGES = 20;
  private readonly TTL = 30 * 60 * 1000; // 30 min

  private getKey(accountId: string, waId: string): string {
    return `${accountId}:${waId}`;
  }

  addMessage(
    accountId: string,
    waId: string,
    role: 'user' | 'assistant',
    content: string,
  ): void {
    const key = this.getKey(accountId, waId);
    const messages = this.conversations.get(key) ?? [];

    messages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    if (messages.length > this.MAX_MESSAGES) {
      messages.shift();
    }

    this.conversations.set(key, messages);
  }

  getHistory(accountId: string, waId: string): MemoryMessage[] {
    const key = this.getKey(accountId, waId);
    const messages = this.conversations.get(key) ?? [];

    const now = Date.now();
    const validMessages = messages.filter(
      (msg) => now - msg.timestamp < this.TTL,
    );

    if (validMessages.length !== messages.length) {
      validMessages.length === 0
        ? this.conversations.delete(key)
        : this.conversations.set(key, validMessages);
    }

    return validMessages;
  }

  clearHistory(accountId: string, waId: string): void {
    this.conversations.delete(this.getKey(accountId, waId));
  }

  cleanExpiredConversations(): void {
    const now = Date.now();

    for (const [key, messages] of this.conversations.entries()) {
      const valid = messages.filter((msg) => now - msg.timestamp < this.TTL);

      if (valid.length === 0) {
        this.conversations.delete(key);
      } else if (valid.length !== messages.length) {
        this.conversations.set(key, valid);
      }
    }
  }

  getStats() {
    let totalMessages = 0;

    for (const messages of this.conversations.values()) {
      totalMessages += messages.length;
    }

    return {
      totalConversations: this.conversations.size,
      totalMessages,
    };
  }
}
