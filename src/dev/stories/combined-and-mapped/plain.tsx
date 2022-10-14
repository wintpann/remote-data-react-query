import React, { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, UsersWithTodosComponent } from '../../util';

export const PlainCombinedAndMapped: FC = () => {
  const users = useQuery(['users'], () => api.getUsers());
  const todos = useQuery(['todos'], () => api.getTodos());

  const usersLoading = users.isFetching || users.isLoading;
  const usersSuccess = users.isSuccess && users.data;
  const isUsersInitial = users.status === 'loading' && users.fetchStatus === 'idle';

  const todosLoading = todos.isFetching || todos.isLoading;
  const todosSuccess = todos.isSuccess && todos.data;
  const isTodosInitial = todos.status === 'loading' && todos.fetchStatus === 'idle';

  const combinedLoading = (usersLoading || todosLoading) && !(users.isError || todos.isError);
  const combinedError = (users.isError || todos.isError) && !(usersLoading || todosLoading);
  const combinedUninitialized =
    (isTodosInitial || isUsersInitial) && !combinedError && !combinedLoading;
  const combinedSuccess = todosSuccess && usersSuccess && !combinedLoading && !combinedError;

  const combinedAndMapped =
    usersSuccess && todosSuccess
      ? {
          users: users.data.map((user) => ({
            ...user,
            fullName: user.name + user.username,
          })),
          todos: todos.data,
        }
      : { users: [], todos: [] };

  const refetchAll = () => {
    void users.refetch();
    void todos.refetch();
  }

  return (
    <div>
      <button onClick={refetchAll}>refetch</button>
      <div className="remote">
        {combinedSuccess && (
            <UsersWithTodosComponent users={combinedAndMapped.users} todos={combinedAndMapped.todos} />
        )}
        {combinedLoading && <div>SKELETON</div>}
        {combinedError && <div>ERROR</div>}
        {combinedUninitialized && <div>INITIAL</div>}
      </div>
    </div>
  );
};
