import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';

const resolvers = {
  Query: {
    hello: () => 'Hello, World!',
  },
  Mutation: {
    createUser: async (_, { data }): Promise<OutUser> => {
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

export default resolvers;
