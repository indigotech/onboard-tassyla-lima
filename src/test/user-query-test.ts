import { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { expect } from 'chai';
import { AppDataSource } from '../data-source.js';
import { User } from '../entity/User.js';
import { Repository } from 'typeorm';
import { tokenCreation } from '../schema/resolvers';
import { CreateUserInputData } from './create-user-test';
import { postQuery } from './postQuery.js';
import { Address } from '../entity/Address.js';

async function postUserQuery(id: number, token?: string): Promise<AxiosResponse> {
  const query = `
    query User($data: ID!) {
      user(id: $data) {
        id
        name
        email
        birthDate
        addresses {
          id
          city
          cep
          complement
          neighborhood
          state
          street
          streetNumber
        }
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
  let addressRepository: Repository<Address>;
  let token: string;

  beforeEach(async () => {
    userRepository = AppDataSource.getRepository(User);
    addressRepository = AppDataSource.getRepository(Address);
    await addressRepository.delete({});
    await userRepository.delete({});

    token = tokenCreation(1);
  });

  it('should get a user by the id', async () => {
    const setupUser: CreateUserInputData = {
      name: 'Setup User',
      email: 'setup@example.com',
      password: 'password123',
      birthDate: '2000-01-11',
    };

    const newUser = new User();
    newUser.name = setupUser.name;
    newUser.email = setupUser.email;
    newUser.password = await bcrypt.hash(setupUser.password, 1);
    newUser.birthDate = setupUser.birthDate;

    const address1 = {
      cep: '05541030',
      street: 'Trajano Reis',
      streetNumber: '47',
      complement: 'Apto 01',
      neighborhood: 'Jardim das Vertentes',
      city: 'São Paulo',
      state: 'SP',
    };

    const newAddress1 = new Address();
    newAddress1.cep = address1.cep;
    newAddress1.street = address1.street;
    newAddress1.streetNumber = address1.streetNumber;
    newAddress1.complement = address1.complement;
    newAddress1.neighborhood = address1.neighborhood;
    newAddress1.city = address1.city;
    newAddress1.state = address1.state;

    newUser.addresses = [newAddress1];

    const user = await userRepository.save(newUser);

    const generatedUserId = user.id;
    const generatedAddress1Id = user.addresses[0].id;

    const response = await postUserQuery(generatedUserId, token);

    expect(response.data.data.user).to.deep.equal({
      id: String(generatedUserId),
      name: setupUser.name,
      email: setupUser.email,
      birthDate: setupUser.birthDate,
      addresses: [{ ...address1, id: String(generatedAddress1Id) }],
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
