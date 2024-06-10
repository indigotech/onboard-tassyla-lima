import axios, { AxiosResponse } from 'axios';
import { serverUrl } from '../setup-server';

export async function postQuery(query: string, variables?, token?: string): Promise<AxiosResponse> {
  return axios.post(
    `${serverUrl}graphql`,
    {
      query: query,
      variables: variables,
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}
