import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { BotConfigService } from './bot-config.service';
import { CreateBotConfigDto } from './dto/create-bot-config.dto';
import { UpdateBotConfigDto } from './dto/update-bot-config.dto';

@Controller('api/v1/bot-config')
export class BotConfigController {
  constructor(private readonly service: BotConfigService) {}

  @Post()
  create(@Body() dto: CreateBotConfigDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBotConfigDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
