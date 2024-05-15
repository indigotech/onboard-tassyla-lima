import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';

const resolvers = {
  Query: {
    hello: () => 'Hello, World!',
  },
  Mutation: {
    createUser: async (_, { data }): Promise<OutUser> => {
      await validateEmail(data.email);
      validatePassword(data.password);

      const userRepository = AppDataSource.getRepository(User);
      console.log('Inserting a new user into the database...');
      const user = new User();
      user.name = data.name;
      user.email = data.email;
      user.birthDate = data.birthDate;
      user.password = data.password;

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

export default resolvers;
