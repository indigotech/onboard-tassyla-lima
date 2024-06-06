import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Address } from './entity/Address.js';
import { User } from './entity/User.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  synchronize: true,
  logging: false,
  entities: [Address, User],
  migrations: [],
  subscribers: [],
});
