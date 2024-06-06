import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Address } from './Address.js';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  birthDate: string;

  @Column()
  password: string;

  @OneToMany(() => Address, (address) => address.user, { cascade: true, eager: true })
  addresses: Address[];
}
