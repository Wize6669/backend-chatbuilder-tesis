import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { BotConfigModule } from './modules/bot-config/bot-config.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    UsersModule,
    WhatsappModule,
    BotConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
