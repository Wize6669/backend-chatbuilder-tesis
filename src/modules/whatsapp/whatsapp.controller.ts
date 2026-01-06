import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { CreateWhatsappAccountDto } from './dto/create-whatsapp-account.dto';
import { UpdateWhatsappAccountDto } from './dto/update-whatsapp-account.dto';
import { BaileysService } from './baileys/baileys.service';

@Controller('api/v1/whatsapp')
export class WhatsappController {
  constructor(
    private readonly waService: WhatsappService,
    private readonly baileysService: BaileysService,
  ) {}

  @Post()
  async create(@Body() dto: CreateWhatsappAccountDto) {
    const account = await this.waService.create(dto);
    await this.baileysService.connectWhatsApp(account.id);
    return account;
  }

  @Get()
  findAll() {
    return this.waService.findAll();
  }

  @Get(':id/qr')
  getQr(@Param('id') id: string, @Res() res: Response) {
    const qr = this.baileysService.getQr(id);

    if (!qr) {
      return res.status(404).send('QR no disponible o cuenta ya conectada');
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(qr);
  }

  @Post(':id/connect')
  async connect(@Param('id') id: string) {
    await this.baileysService.connectWhatsApp(id);
    return { message: 'Conexión iniciada', accountId: id };
  }

  @Post(':id/disconnect')
  async disconnect(@Param('id') id: string) {
    await this.baileysService.disconnectWhatsApp(id);
    return { message: 'Desconectado correctamente', accountId: id };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.waService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.waService.findByUserId(userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWhatsappAccountDto) {
    return this.waService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.baileysService.disconnectWhatsApp(id);
    return this.waService.remove(id);
  }
}
