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
  create(@Body() dto: CreateWhatsappAccountDto) {
    return this.waService.create(dto);
  }

  @Get()
  findAll() {
    return this.waService.findAll();
  }

  @Get('qr')
  getQr(@Res() res: Response) {
    const qr = this.baileysService.getQr();
    console.log('QR CODE SOLICITADO', qr);

    if (!qr) {
      return res.status(404).send('QR no disponible');
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(qr);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.waService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWhatsappAccountDto) {
    return this.waService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.waService.remove(id);
  }
}
