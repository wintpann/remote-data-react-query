import React, { useEffect, useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RemoteRQ, RenderRemoteRQ } from '../core';

type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

const api = {
  getTodos: (id: number) =>
    fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then((res) =>
      res.json(),
    ) as Promise<Todo>,
};

const queryClient = new QueryClient();

const Todo = () => {
  const [todoId, setTodoId] = useState(-1);
  const data: RemoteRQ<Error, Todo> = useQuery(['todos', todoId], () => api.getTodos(todoId), {
    enabled: todoId !== -1,
  });

  useEffect(() => {
    setTimeout(() => setTodoId(1), 3000);
    setTimeout(() => setTodoId(2), 6000);
    setTimeout(() => setTodoId(1), 9000);
  }, []);

  return (
    <RenderRemoteRQ
      data={data}
      success={JSON.stringify}
      failure={<div>error</div>}
      pendingWithData={() => <div>DATA here but its pending</div>}
      pending={<div>just pending</div>}
      initial={<div>initial</div>}
    />
  );
};

export const Default = () => (
  <QueryClientProvider client={queryClient}>
    <Todo />
  </QueryClientProvider>
);
