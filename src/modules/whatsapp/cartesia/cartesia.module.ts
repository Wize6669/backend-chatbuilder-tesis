import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CartesiaService } from './cartesia.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [CartesiaService],
  exports: [CartesiaService],
})
export class CartesiaModule {}
