import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WhatsappAccount } from '../whatsapp/whatsapp-account.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column()
  phone: string;

  @Column()
  password: string;

  @OneToMany(() => WhatsappAccount, (wa) => wa.user)
  whatsappAccounts: WhatsappAccount[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
