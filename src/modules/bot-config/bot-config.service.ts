import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WhatsappAccount } from '../whatsapp/whatsapp-account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BotConfig } from './bot-config.entity';
import { UpdateBotConfigDto } from './dto/update-bot-config.dto';
import { CreateBotConfigDto } from './dto/create-bot-config.dto';

@Injectable()
export class BotConfigService {
  constructor(
    @InjectRepository(BotConfig)
    private readonly configRepo: Repository<BotConfig>,

    @InjectRepository(WhatsappAccount)
    private readonly waRepo: Repository<WhatsappAccount>,
  ) {}

  async create(dto: CreateBotConfigDto) {
    const wa = await this.waRepo.findOne({
      where: { id: dto.whatsappAccountId },
    });

    if (!wa) throw new NotFoundException('WhatsApp account not found');

    const config = this.configRepo.create({
      ...dto,
      whatsappAccount: wa,
    });

    return this.configRepo.save(config);
  }

  findAll() {
    return this.configRepo.find({
      relations: ['whatsappAccount'],
    });
  }

  async findOne(id: string) {
    const config = await this.configRepo.findOne({
      where: { id },
      relations: ['whatsappAccount'],
    });

    if (!config) throw new NotFoundException('BotConfig not found');
    return config;
  }

  async update(id: string, dto: UpdateBotConfigDto) {
    const config = await this.findOne(id);
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }

  async remove(id: string) {
    const config = await this.findOne(id);
    return this.configRepo.remove(config);
  }
}
