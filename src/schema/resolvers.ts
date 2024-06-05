import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { CustomError } from './customError.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const resolvers = {
  Query: {
    hello: () => 'Hello, World!',
    user: async (_, { id }, context) => {
      authorizeAccess(context);
      return getUserById(id);
    },
  },
  Mutation: {
    createUser: async (_, { data }, context): Promise<OutUser> => {
      authorizeAccess(context);

      await validateEmail(data.email);
      validatePassword(data.password);

      const hashedPassword = await hashPassword(data.password);

      const userRepository = AppDataSource.getRepository(User);

      const user = new User();
      user.name = data.name;
      user.email = data.email;
      user.birthDate = data.birthDate;
      user.password = hashedPassword;

      return await userRepository.save(user);
    },
    login: async (_, { data }): Promise<LoginResponse> => {
      const user = await validateLogin(data.email, data.password);
      const token = tokenCreation(user.id, data.rememberMe);

      return {
        user: user,
        token: token,
      };
    },
  },
};

interface OutUser {
  id: number;
  name: string;
  email: string;
  birthDate: string;
}

interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    birthDate: string;
  };
  token: string;
}

const validatePassword = (password: string): void => {
  if (password.length < 6) {
    throw new CustomError(400, 'Invalid password', 'Password must be at least 6 characters long.');
  }
  if (!password.match(/[a-zA-ZS]/)) {
    throw new CustomError(400, 'Invalid password', 'Password must contain at least one letter.');
  }
  if (!password.match(/[0-9]/)) {
    throw new CustomError(400, 'Invalid password', 'Password must contain at least one number.');
  }
};

const validateEmail = async (email: string): Promise<void> => {
  if (await AppDataSource.manager.findOneBy(User, { email: email })) {
    throw new CustomError(400, 'Invalid email', 'There is already another user with this email.');
  }
};

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

const validateLogin = async (email: string, password: string): Promise<OutUser> => {
  const user = await AppDataSource.manager.findOneBy(User, { email: email });
  if (!user) {
    throw new CustomError(400, 'Invalid email', 'There is not an user with this email.');
  }

  const passwordIsCorrect = await bcrypt.compare(password, user.password);
  if (!passwordIsCorrect) {
    throw new CustomError(400, 'Invalid password', 'The password is incorrect.');
  }
  return user;
};

const authorizeAccess = (context) => {
  if (!context.userId) {
    throw new CustomError(401, 'Unauthorized access', 'The token is not valid.');
  }
};

const getUserById = async (id: number) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOneBy({
    id: id,
  });
  if (!user) {
    throw new CustomError(404, 'User not found', 'The user with the provided ID was not found.');
  }
  return user;
};

export const tokenCreation = (id: number, rememberMe?: boolean): string => {
  return jwt.sign({ id: id }, process.env.TOKEN_SECRET, { expiresIn: rememberMe ? '7d' : '8h' });
};

export default resolvers;
