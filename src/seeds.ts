import { AppDataSource } from './data-source.js';
import { User } from './entity/User.js';
import { setupDatabase } from './setup-database.js';
import bcrypt from 'bcrypt';
import faker from 'faker';

const NUM_USERS = 50;

async function seedDatabase() {
  try {
    await setupDatabase();
    const userRepository = AppDataSource.getRepository(User);

    for (let i = 0; i < NUM_USERS; i++) {
      userRepository.save({
        name: faker.name.findName(),
        email: faker.internet.email(),
        password: await bcrypt.hash(faker.internet.password(), 10),
        birthDate: faker.date.past().toISOString().slice(0, 10),
      });
    }

    console.log(`Database seeded successfully with ${NUM_USERS} users.`);
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
