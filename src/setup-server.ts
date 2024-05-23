import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import typeDefs from './schema/typeDefs.js';
import resolvers from './schema/resolvers.js';
import { errorFormatter } from './schema/customError.js';

export let serverUrl: string;

export async function setupServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: errorFormatter,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀  Server ready at: ${url}`);

  serverUrl = url;
}
