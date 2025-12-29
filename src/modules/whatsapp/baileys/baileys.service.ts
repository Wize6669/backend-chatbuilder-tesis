import { Injectable, OnModuleInit } from '@nestjs/common';
import * as baileys from 'baileys';
import QRCode from 'qrcode';

@Injectable()
export class BaileysService implements OnModuleInit {
  private sock: any;
  private lastQrPng: Buffer | null = null;

  async onModuleInit() {
    await this.connectWhatsApp();
  }

  async connectWhatsApp() {
    const { state, saveCreds } =
      await baileys.useMultiFileAuthState('auth_info_baileys');

    this.sock = baileys.makeWASocket({
      auth: state,
    });

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (connection === 'open') {
        console.log('✅ WhatsApp conectado');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        if (statusCode !== baileys.DisconnectReason.loggedOut) {
          this.connectWhatsApp();
        }
      }

      if (qr) {
        console.log('📸 QR generado');
        this.lastQrPng = await QRCode.toBuffer(qr, {
          type: 'png',
          width: 320,
        });
      }
    });

    this.sock.ev.on('creds.update', saveCreds);
  }

  getQr(): Buffer | null {
    return this.lastQrPng;
  }
}
