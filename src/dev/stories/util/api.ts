import { User } from './model';

export const api = {
  getUser: async (id: number): Promise<User> => {
    try {
      const data = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
      if (data.status !== 200) throw new Error();
      return await data.json();
    } catch (e) {
      throw new Error('failed to fetch');
    }
  },
};
