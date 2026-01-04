import { Module } from '@nestjs/common';
import { MessageProcessorService } from './message-processor.service';
import { AiModule } from '../../ai/ai.module';
import { AudioMessageStrategy } from '../strategies/audio-message.strategy';
import { TextMessageStrategy } from '../strategies/text-message.strategy';
import { CartesiaModule } from '../cartesia/cartesia.module';

@Module({
  imports: [AiModule, CartesiaModule],
  providers: [
    MessageProcessorService,
    TextMessageStrategy,
    AudioMessageStrategy,
  ],
  exports: [MessageProcessorService],
})
export class MessageProcessorModule {}
