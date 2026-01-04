export interface MessageResponse {
  type: 'text' | 'audio';
  content: string | Buffer;
  originalMessage?: any;
}

export interface MessageStrategy {
  canHandle(message: any): boolean;
  handle(message: any, waId: string, sock?: any): Promise<MessageResponse>;
}
