import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { WhatsappAccount } from '../whatsapp/whatsapp-account.entity';

@Entity()
export class BotConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'gpt-4o-mini' })
  model: string;

  @Column({ type: 'text', nullable: false })
  systemPrompt: string;

  @Column({ default: false })
  useRag: boolean;

  @Column({ default: false })
  useMcp: boolean;

  @Column({ nullable: true })
  mcpServerUrl: string;

  @OneToOne(() => WhatsappAccount, (wa) => wa.config, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  whatsappAccount: WhatsappAccount;
}
