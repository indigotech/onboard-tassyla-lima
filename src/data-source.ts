import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entity/User.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'tassyla',
  password: 'J8iKtymbA6EEIbHok6u5lD3DFPY6pC',
  database: 'local_db',
  synchronize: true,
  logging: false,
  entities: [User],
  migrations: [],
  subscribers: [],
});
