import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { User } from '../users/user.entity';
import { WhatsappAccount } from './whatsapp-account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaileysService } from './baileys/baileys.service';
import { TranscriptionService } from './transcription/transcription.service';
import { CartesiaModule } from './cartesia/cartesia.module';
import { MessageProcessorModule } from './message-processor/message-processor.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsappAccount, User]),
    CartesiaModule,
    MessageProcessorModule,
  ],
  providers: [WhatsappService, BaileysService, TranscriptionService],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}
