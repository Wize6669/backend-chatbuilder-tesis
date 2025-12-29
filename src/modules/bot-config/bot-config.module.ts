import { Module } from '@nestjs/common';
import { BotConfigService } from './bot-config.service';
import { BotConfigController } from './bot-config.controller';
import { WhatsappAccount } from '../whatsapp/whatsapp-account.entity';
import { BotConfig } from './bot-config.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([BotConfig, WhatsappAccount])],
  providers: [BotConfigService],
  controllers: [BotConfigController],
  exports: [BotConfigService],
})
export class BotConfigModule {}
