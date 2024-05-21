import { AppDataSource } from './data-source.js';

export async function setupDatabase() {
  await AppDataSource.initialize();
}
