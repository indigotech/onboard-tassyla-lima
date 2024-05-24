import axios, { AxiosResponse } from 'axios';
import bcrypt from 'bcrypt';
import { expect } from 'chai';
import { serverUrl } from '../setup-server';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';

interface InputData {
  name: string;
  email: string;
  birthDate: string;
  password: string;
}

async function createUser(inputData: InputData): Promise<AxiosResponse> {
  const response = await axios.post(`${serverUrl}graphql`, {
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
      data: inputData,
    },
  });

  return response;
}

async function checksInputAndReturnedUser(inputData: InputData, response: AxiosResponse) {
  const { id, ...createUser } = response.data.data.createUser;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...inputDataWithoutPassword } = inputData;

  expect(createUser).to.deep.equal(inputDataWithoutPassword);
  expect(Number(id)).to.be.above(0);
}

async function checksInputAndStoredUser(inputData: InputData) {
  const userRepository = AppDataSource.getRepository(User);

  const storedUser = await userRepository.findOneBy({
    email: inputData.email,
  });

  const { id, password, ...userFields } = storedUser;

  const inputDataWithoutPassword = {
    name: inputData.name,
    email: inputData.email,
    birthDate: inputData.birthDate,
  };

  expect(userFields).to.deep.equal(inputDataWithoutPassword);
  expect(Number(id)).to.be.above(0);
  expect(await bcrypt.compare(inputData.password, password)).to.be.true;

  return id;
}

describe('createUser mutation', () => {
  beforeEach(async () => {
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.clear();
  });

  it('should create a new user', async () => {
    const inputData: InputData = {
      name: 'John Phill',
      email: 'john@example.com',
      password: 'password123',
      birthDate: '1990-01-01',
    };

    const response = await createUser(inputData);
    await checksInputAndReturnedUser(inputData, response);
    const storedId = await checksInputAndStoredUser(inputData);
    expect(response.data.data.createUser.id).to.equal(String(storedId));
  });

  it('should return an error when creating a user with the same email', async () => {
    const inputData1: InputData = {
      name: 'John Phill',
      email: 'john@example.com',
      password: 'password123',
      birthDate: '1990-01-01',
    };

    const inputData2: InputData = {
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

    const userRepository = AppDataSource.getRepository(User);

    await userRepository.save({
      ...inputData1,
      password: await bcrypt.hash(inputData1.password, 10),
    });

    const response = await createUser(inputData2);

    expect(response.data).to.deep.equal({ data: { createUser: null }, errors: [expectedError] });
  });

  it('should return an error when password is less than 6 characters long', async () => {
    const inputData = {
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

    const response = await createUser(inputData);

    expect(response.data).to.deep.equal({ data: { createUser: null }, errors: [expectedError] });
  });

  it('should return an error when password does not contain at least one letter', async () => {
    const inputData = {
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

    const response = await createUser(inputData);
    expect(response.data).to.deep.equal({ data: { createUser: null }, errors: [expectedError] });
  });

  it('should return an error when password does not contain at least one number', async () => {
    const inputData = {
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

    const response = await createUser(inputData);

    expect(response.data).to.deep.equal({ data: { createUser: null }, errors: [expectedError] });
  });

  it('should create another new user', async () => {
    const inputData1: InputData = {
      name: 'John Phill',
      email: 'john@example.com',
      password: 'password123',
      birthDate: '1990-01-01',
    };

    const inputData2 = {
      name: 'Tassyla Lima',
      email: 'Tassyla@example.com',
      password: 'password987',
      birthDate: '2003-12-11',
    };

    const userRepository = AppDataSource.getRepository(User);
    await userRepository.save({
      ...inputData1,
      password: await bcrypt.hash(inputData1.password, 10),
    });

    const response = await createUser(inputData2);
    await checksInputAndReturnedUser(inputData2, response);
    await checksInputAndStoredUser(inputData2);
  });
});
