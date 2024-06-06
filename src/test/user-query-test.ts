import { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { expect } from 'chai';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { Repository } from 'typeorm';
import { tokenCreation } from '../schema/resolvers';
import { CreateUserInputData } from './create-user-test';
import { postQuery } from './create-user-test';

async function postUserQuery(id: number, token?: string): Promise<AxiosResponse> {
  const query = `
    query User($data: ID!) {
      user(id: $data) {
        id
        name
        email
        birthDate
      }
    }
    `;

  const variables = {
    data: id,
  };

  return postQuery(query, variables, token);
}

describe('user query', () => {
  let userRepository: Repository<User>;
  let token: string;

  beforeEach(async () => {
    userRepository = AppDataSource.getRepository(User);
    await userRepository.clear();

    token = tokenCreation(1);
  });

  it('should get a user by the id', async () => {
    const setupUser: CreateUserInputData = {
      name: 'Setup User',
      email: 'setup@example.com',
      password: 'password123',
      birthDate: '2000-01-11',
    };

    const user = await userRepository.save({
      ...setupUser,
      password: await bcrypt.hash(setupUser.password, 1),
    });

    const generatedId = user.id;

    const response = await postUserQuery(generatedId, token);

    expect(response.data.data.user).to.deep.equal({
      id: String(generatedId),
      name: setupUser.name,
      email: setupUser.email,
      birthDate: setupUser.birthDate,
    });
  });

  it('should not be able to get a user with the wrong id', async () => {
    const expectedError = {
      code: 404,
      message: 'User not found',
      additionalInfo: 'The user with the provided ID was not found.',
    };

    const response = await postUserQuery(1, token);

    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });

  it('should not be able to get a user with no token given', async () => {
    const expectedError = {
      code: 401,
      message: 'Unauthorized access',
      additionalInfo: 'The token is not valid.',
    };

    const response = await postUserQuery(1);

    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });

  it('should not be able to get a user with expirated token', async () => {
    const expectedError = {
      code: 401,
      message: 'Unauthorized access',
      additionalInfo: 'The token is not valid.',
    };

    token = jwt.sign({ id: 1 }, process.env.TOKEN_SECRET, { expiresIn: `-300s` });

    const response = await postUserQuery(1, token);

    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });
});
