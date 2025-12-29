import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WhatsappAccount } from './whatsapp-account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateWhatsappAccountDto } from './dto/create-whatsapp-account.dto';
import { UpdateWhatsappAccountDto } from './dto/update-whatsapp-account.dto';

@Injectable()
export class WhatsappService {
  constructor(
    @InjectRepository(WhatsappAccount)
    private readonly waRepo: Repository<WhatsappAccount>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateWhatsappAccountDto) {
    const user = await this.userRepo.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const exists = await this.waRepo.findOne({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (exists) {
      throw new ConflictException('WhatsApp number already registered');
    }

    const wa = this.waRepo.create({
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      user,
    });

    return this.waRepo.save(wa);
  }

  findAll() {
    return this.waRepo.find({
      relations: ['user'],
    });
  }

  async findOne(id: string) {
    const wa = await this.waRepo.findOne({
      where: { id },
      relations: ['user', 'config'],
    });

    if (!wa) {
      throw new NotFoundException('WhatsApp account not found');
    }

    return wa;
  }

  async update(id: string, dto: UpdateWhatsappAccountDto) {
    const wa = await this.findOne(id);

    Object.assign(wa, dto);
    return this.waRepo.save(wa);
  }

  async remove(id: string) {
    const wa = await this.findOne(id);
    return this.waRepo.remove(wa);
  }

  async updateSession(id: string, session: any) {
    const wa = await this.findOne(id);
    wa.baileysSession = session;
    return this.waRepo.save(wa);
  }

  async markConnected(id: string) {
    const wa = await this.findOne(id);
    wa.isConnected = true;
    return this.waRepo.save(wa);
  }

  async markDisconnected(id: string) {
    const wa = await this.findOne(id);
    wa.isConnected = false;
    return this.waRepo.save(wa);
  }
}
