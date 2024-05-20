import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import bcrypt from 'bcrypt';

const resolvers = {
  Query: {
    hello: () => 'Hello, World!',
  },
  Mutation: {
    createUser: async (_, { data }): Promise<OutUser> => {
      await validateEmail(data.email);
      validatePassword(data.password);

      const hashedPassword = await hashPassword(data.password);

      const userRepository = AppDataSource.getRepository(User);

      console.log('Inserting a new user into the database...');
      const user = new User();
      user.name = data.name;
      user.email = data.email;
      user.birthDate = data.birthDate;
      user.password = hashedPassword;
      await AppDataSource.manager.save(user);
      console.log('Saved a new user with id: ' + user.id);

      return await userRepository.save(user);
    },
  },
};

interface OutUser {
  id: number;
  name: string;
  email: string;
  birthDate: string;
}

const validatePassword = (password: string): void => {
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (!password.match(/[a-zA-Z]/)) {
    throw new Error('Password must contain at least one letter.');
  }
  if (!password.match(/[0-9]/)) {
    throw new Error('Password must contain at least one number.');
  }
};

const validateEmail = async (email: string): Promise<void> => {
  if (await AppDataSource.manager.findOneBy(User, { email: email })) {
    throw new Error('There is already another user with this email.');
  }
};

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10; // Number of salt rounds for bcrypt
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

export default resolvers;
