import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios, { AxiosResponse } from 'axios';
import { expect } from 'chai';
import { serverUrl } from '../setup-server';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { Repository } from 'typeorm';

interface CreateUserInputData {
  name: string;
  email: string;
  birthDate: string;
  password: string;
}

async function createUser(inputUser: CreateUserInputData, token: string): Promise<AxiosResponse> {
  return axios.post(
    `${serverUrl}graphql`,
    {
      query: `
      mutation CreateUser($data: CreateUserInput!) {
      createUser(data: $data) {
          id
          name
          email
          birthDate
        }
      }
      `,
      variables: {
        data: inputUser,
      },
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}

async function checksInputAndReturnedUser(inputUser: CreateUserInputData, response: AxiosResponse) {
  const { id, ...createUser } = response.data.data.createUser;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...inputUserWithoutPassword } = inputUser;

  expect(createUser).to.deep.equal(inputUserWithoutPassword);
  expect(Number(id)).to.be.above(0);
}

async function checksInputAndStoredUser(inputUser: CreateUserInputData) {
  const userRepository = AppDataSource.getRepository(User);

  const storedUser = await userRepository.findOneBy({
    email: inputUser.email,
  });

  const { id, password, ...userFields } = storedUser;

  const inputUserWithoutPassword = {
    name: inputUser.name,
    email: inputUser.email,
    birthDate: inputUser.birthDate,
  };

  expect(userFields).to.deep.equal(inputUserWithoutPassword);
  expect(Number(id)).to.be.above(0);
  expect(await bcrypt.compare(inputUser.password, password)).to.be.true;

  return id;
}

describe('createUser mutation', () => {
  let userRepository: Repository<User>;
  let token: string;

  beforeEach(async () => {
    userRepository = AppDataSource.getRepository(User);
    await userRepository.clear();

    token = jwt.sign({ id: 1 }, process.env.TOKEN_SECRET, { expiresIn: '300s' });
  });

  it('should create a new user', async () => {
    const inputUser: CreateUserInputData = {
      name: 'John Phill',
      email: 'john@example.com',
      password: 'password123',
      birthDate: '1990-01-01',
    };

    const response = await createUser(inputUser, token);
    await checksInputAndReturnedUser(inputUser, response);
    const storedId = await checksInputAndStoredUser(inputUser);
    expect(response.data.data.createUser.id).to.equal(String(storedId));
  });

  it('should return an error when creating a user with the same email', async () => {
    const inputUser1: CreateUserInputData = {
      name: 'John Phill',
      email: 'john@example.com',
      password: 'password123',
      birthDate: '1990-01-01',
    };

    const inputUser2: CreateUserInputData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password456',
      birthDate: '1985-05-10',
    };

    const expectedError = {
      code: 400,
      message: 'Invalid email',
      additionalInfo: 'There is already another user with this email.',
    };

    await userRepository.save({
      ...inputUser1,
      password: await bcrypt.hash(inputUser1.password, 1),
    });

    const response = await createUser(inputUser2, token);

    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });

  it('should return an error when password is less than 6 characters long', async () => {
    const inputUser = {
      name: 'Matheus Felix',
      email: 'matheus@example.com',
      password: 'p4ss',
      birthDate: '1995-07-11',
    };

    const expectedError = {
      code: 400,
      message: 'Invalid password',
      additionalInfo: 'Password must be at least 6 characters long.',
    };

    const response = await createUser(inputUser, token);

    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });

  it('should return an error when password does not contain at least one letter', async () => {
    const inputUser = {
      name: 'Daniel Ueno',
      email: 'daniel@example.com',
      password: '123456',
      birthDate: '1996-12-20',
    };

    const expectedError = {
      code: 400,
      message: 'Invalid password',
      additionalInfo: 'Password must contain at least one letter.',
    };

    const response = await createUser(inputUser, token);
    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });

  it('should return an error when password does not contain at least one number', async () => {
    const inputUser = {
      name: 'Alan Raso',
      email: 'alan@example.com',
      password: 'password',
      birthDate: '1993-03-25',
    };

    const expectedError = {
      code: 400,
      message: 'Invalid password',
      additionalInfo: 'Password must contain at least one number.',
    };

    const response = await createUser(inputUser, token);

    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });

  it('should return an error when token is invalid', async () => {
    const inputUser: CreateUserInputData = {
      name: 'John Phill',
      email: 'john@example.com',
      password: 'password123',
      birthDate: '1990-01-01',
    };

    const expectedError = {
      code: 401,
      message: 'Unauthorized access',
      additionalInfo: 'The token is not valid.',
    };

    token = '';
    const response = await createUser(inputUser, token);
    expect(response.data).to.deep.equal({ data: null, errors: [expectedError] });
  });
});
