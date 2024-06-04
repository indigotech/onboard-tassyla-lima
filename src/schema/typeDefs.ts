const typeDefs = `
  type Query {
    hello: String
  }

  type Mutation {
    createUser(data: CreateUserInput!): User!
    login(data: LoginInput!): LoginResponse!
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    birthDate: String!
  }

  input LoginInput {
    email: String!
    password: String!
    rememberMe: Boolean
  }

  type User {
    id: ID!
    name: String!
    email: String!
    birthDate: String!
  }

  type LoginResponse {
    user: User!
    token: String!
  }
`;

export default typeDefs;
