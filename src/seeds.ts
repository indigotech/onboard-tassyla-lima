import { config } from 'dotenv';
import { AppDataSource } from './data-source.js';
import { User } from './entity/User.js';
import { setupDatabase } from './setup-database.js';
import bcrypt from 'bcryptjs';
import faker from 'faker';

config({
  path: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',
});

const NUM_USERS = 50;

async function seedDatabase() {
  try {
    await setupDatabase();
    const userRepository = AppDataSource.getRepository(User);
    const usersToSave: User[] = [];

    for (let i = 0; i < NUM_USERS; i++) {
      const user: User = new User();
      user.name = faker.name.findName();
      user.email = faker.internet.email();
      user.password = await bcrypt.hash(faker.internet.password(), 10);
      user.birthDate = faker.date.past().toISOString().slice(0, 10);

      usersToSave.push(user);
    }

    await userRepository.save(usersToSave);

    console.log(`Database seeded successfully with ${NUM_USERS} users.`);
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
