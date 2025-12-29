import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { User } from '../users/user.entity';
import { WhatsappAccount } from './whatsapp-account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaileysService } from './baileys/baileys.service';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsappAccount, User])],
  providers: [WhatsappService, BaileysService],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}
