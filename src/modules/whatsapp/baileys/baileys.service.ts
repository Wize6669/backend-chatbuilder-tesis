import { Injectable, OnModuleInit } from '@nestjs/common';
import * as baileys from 'baileys';
import QRCode from 'qrcode';
import { WhatsappService } from '../whatsapp.service';
import { useDbAuthState } from './db-auth-state';
import { MessageProcessorService } from '../message-processor/message-processor.service';

@Injectable()
export class BaileysService implements OnModuleInit {
  private connections: Map<string, any> = new Map();
  private qrCodes: Map<string, Buffer> = new Map();

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly messageProcessorService: MessageProcessorService,
  ) {}

  async onModuleInit() {
    const accounts = await this.whatsappService.findAll();
    for (const account of accounts) {
      if (account.baileysSession?.creds?.registered) {
        console.log(`🔄 Reconectando cuenta existente: ${account.id}`);
        await this.connectWhatsApp(account.id);
      }
    }
  }

  async connectWhatsApp(accountId: string) {
    if (this.connections.has(accountId)) {
      console.log(`⚠️ Cuenta ${accountId} ya está conectada`);
      return;
    }

    try {
      const { state, saveCreds } = await useDbAuthState(
        this.whatsappService,
        accountId,
      );

      const sock = baileys.makeWASocket({
        auth: state,
        syncFullHistory: false,
        getMessage: async (key) => {
          return {
            conversation: 'Mensaje no disponible',
          };
        },
      });

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log(`📸 QR generado para: ${accountId}`);
          const qrBuffer = await QRCode.toBuffer(qr, {
            type: 'png',
            width: 320,
          });
          this.qrCodes.set(accountId, qrBuffer);
        }

        if (connection === 'open') {
          console.log(`✅ WhatsApp conectado exitosamente: ${accountId}`);
          await this.whatsappService.markConnected(accountId);
          this.qrCodes.delete(accountId);
          this.connections.set(accountId, sock);
        }

        if (connection === 'close') {
          console.log(`❌ Conexión cerrada para: ${accountId}`);
          this.connections.delete(accountId);

          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect =
            statusCode !== baileys.DisconnectReason.loggedOut;

          if (shouldReconnect) {
            console.log(`🔄 Intentando reconectar cuenta: ${accountId}`);
            setTimeout(() => this.connectWhatsApp(accountId), 3000);
          } else {
            console.log(`🚪 Sesión cerrada permanentemente: ${accountId}`);
            await this.whatsappService.markDisconnected(accountId);
            this.qrCodes.delete(accountId);
          }
        }
      });

      sock.ev.on('creds.update', async () => {
        console.log(`💾 Guardando credenciales para: ${accountId}`);
        await saveCreds();
      });

      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const message of messages) {
          if (
            message.key.remoteJid === 'status@broadcast' ||
            type !== 'notify' ||
            message.key.remoteJid?.includes('@g.us') ||
            message.key.fromMe
          ) {
            continue;
          }

          const from = message.key.remoteJid;
          const messageContent = message.message;

          if (!messageContent) continue;

          try {
            const response = await this.messageProcessorService.process(
              accountId,
              message,
              from!,
              sock,
            );

            if (!response) {
              console.log(`⚠️ No se generó respuesta para ${from}`);
              continue;
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));

            if (response.type === 'audio') {
              await sock.sendMessage(from!, {
                audio: response.content as Buffer,
                mimetype: 'audio/mpeg',
                ptt: false,
              });
              console.log(`🔊 Audio enviado a ${from}`);
            } else {
              await sock.sendMessage(from!, {
                text: response.content as string,
              });
              console.log(`💬 Texto enviado a ${from}`);
            }
          } catch (error) {
            console.error(`❌ Error procesando mensaje de ${from}:`, error);

            try {
              await sock.sendMessage(from!, {
                text: 'Lo siento, hubo un error procesando tu mensaje.',
              });
            } catch (sendError) {
              console.error(`❌ Error enviando mensaje de error:`, sendError);
            }
          }
        }
      });
    } catch (error) {
      console.error(`❌ Error conectando cuenta ${accountId}:`, error);
      throw error;
    }
  }

  async sendMessage(accountId: string, to: string, message: string) {
    const sock = this.connections.get(accountId);
    if (!sock) {
      throw new Error(`Cuenta ${accountId} no está conectada`);
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    console.log(`📤 Mensaje enviado desde ${accountId} a ${to}`);
  }

  async disconnectWhatsApp(accountId: string) {
    const sock = this.connections.get(accountId);
    if (sock) {
      try {
        await sock.logout();
        console.log(`🚪 Logout exitoso para: ${accountId}`);
      } catch (error) {
        console.error(`Error en logout para ${accountId}:`, error);
      }
      this.connections.delete(accountId);
      this.qrCodes.delete(accountId);
      await this.whatsappService.markDisconnected(accountId);
    }
  }

  getQr(accountId: string): Buffer | null {
    return this.qrCodes.get(accountId) || null;
  }
}
