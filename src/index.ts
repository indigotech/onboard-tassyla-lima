import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import typeDefs from './schema/typeDefs.js';
import resolvers from './schema/resolvers.js';
import setupDatabase from './setup-database.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await setupDatabase();

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
