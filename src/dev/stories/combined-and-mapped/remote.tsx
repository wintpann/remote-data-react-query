import React, { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, APITodo, APIUser, UsersWithTodosComponent } from '../../util';
import { RemoteData, RenderRemote, remote } from '../../../lib/lite';

export const RemoteCombinedAndMapped: FC = () => {
  const users: RemoteData<Error, APIUser[]> = useQuery(['users'], () => api.getUsers());
  const todos: RemoteData<Error, APITodo[]> = useQuery(['todos'], () => api.getTodos());

  const combinedAndMapped = remote.pipe(
    remote.combine({ users, todos }),
    remote.map(({ users, todos }) => ({
      users: users.map((user) => ({
        ...user,
        fullName: user.name + user.username,
      })),
      todos,
    })),
  );

  return (
    <div>
      <button onClick={combinedAndMapped.refetch}>refetch</button>
      <div className="remote">
        <RenderRemote
          data={combinedAndMapped}
          success={UsersWithTodosComponent}
          initial={<div>INITIAL</div>}
          failure={() => <div>ERROR</div>}
          pending={<div>SKELETON</div>}
        />
      </div>
    </div>
  );
};
