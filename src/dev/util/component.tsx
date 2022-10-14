import React, { FC } from 'react';
import { APITodo, UserProps } from './model';

export const TodoComponent: FC<APITodo> = ({ title }) => (
  <div className="remote-todo">TODO: {title}</div>
);

export const UserComponent: FC<UserProps> = ({ fullName, name }) => (
  <div className="remote-user">USER: {fullName ?? name}</div>
);

export const UsersWithTodosComponent: FC<{ users: UserProps[]; todos: APITodo[] }> = ({
  users,
  todos,
}) => (
  <div className="remote">
    <div className="remote">
      {users.map((user) => (
        <UserComponent {...user} key={user.id} />
      ))}
    </div>
    <div className="remote">
      {todos.map((todo) => (
        <TodoComponent {...todo} key={todo.id} />
      ))}
    </div>
  </div>
);
