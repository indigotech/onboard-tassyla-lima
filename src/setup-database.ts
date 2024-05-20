import { AppDataSource } from './data-source.js';

async function setupDatabase() {
  await AppDataSource.initialize();
}

export default setupDatabase;
