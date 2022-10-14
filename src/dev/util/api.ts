import { APIUser, APITodo } from './model';

export const api = {
  getUsers: async (): Promise<APIUser[]> => {
    try {
      const data = await fetch(`https://jsonplaceholder.typicode.com/users?_limit=10`);
      if (data.status !== 200) throw new Error();
      return await data.json();
    } catch (e) {
      throw new Error('failed to fetch');
    }
  },
  getTodos: async (): Promise<APITodo[]> => {
    try {
      const data = await fetch(`https://jsonplaceholder.typicode.com/todos?_limit=10`);
      if (data.status !== 200) throw new Error();
      return await data.json();
    } catch (e) {
      throw new Error('failed to fetch');
    }
  },
};
