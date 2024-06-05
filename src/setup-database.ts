import { AppDataSource } from './data-source.js';

export async function setupDatabase() {
  await AppDataSource.setOptions({
    host: process.env.DB_HOST,
    port: Number(`${process.env.DB_PORT}`),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await AppDataSource.initialize();
  console.log(`🚀  Database ready!`);
}
