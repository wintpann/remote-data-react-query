export type APITodo = {
  id: number;
  title: string;
  completed: boolean;
};

export type APIUser = {
  id: number;
  name: string;
  username: string;
  email: string;
};

export type UserProps = APIUser & { fullName?: string };
