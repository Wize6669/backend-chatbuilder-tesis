import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { MaxLength, MinLength } from 'class-validator';
import { BotConfig } from '../bot-config/bot-config.entity';

@Entity()
export class WhatsappAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  @MinLength(5)
  @MaxLength(30)
  name: string;

  @Column({ type: 'varchar', unique: true, length: 18 })
  @MinLength(5)
  @MaxLength(18)
  phoneNumber: string;

  @Column({ type: 'varchar', unique: true })
  jid: string;

  @Column({ default: false })
  isConnected: boolean;

  @Column({ type: 'jsonb', nullable: true })
  baileysSession: any;

  @ManyToOne(() => User, (user) => user.whatsappAccounts, {
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToOne(() => BotConfig, (config) => config.whatsappAccount)
  config: BotConfig;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
