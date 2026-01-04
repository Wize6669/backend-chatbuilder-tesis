// import { Injectable } from '@nestjs/common';
// import { MessageStrategy } from './message-strategy.interface';
//
// @Injectable()
// export class UnsupportedMessageStrategy implements MessageStrategy {
//   canHandle(type: string): boolean {
//     return type === 'text';
//   }
//
//   handle(message: any, waId: string) {
//     console.log(`Mensaje no soportado recibido en ${waId}: ${message}`);
//     return {
//       type: 'text',
//       content: message,
//       originalMessage: message,
//     };
//   }
// }
