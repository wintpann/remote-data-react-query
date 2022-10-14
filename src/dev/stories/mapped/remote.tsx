import React, { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, APIUser, UserComponent } from '../../util';
import { RemoteData, RenderRemote, remote } from '../../../lib/lite';

export const RemoteMapped: FC = () => {
  const users: RemoteData<Error, APIUser[]> = useQuery(['users'], () => api.getUsers());

  const usersWithFullName = remote.pipe(
    users,
    remote.map((users) =>
      users.map((user) => ({
        ...user,
        fullName: user.name + user.username,
      })),
    ),
  );

  return (
    <div>
        <button onClick={users.refetch}>refetch</button>
        <div className="remote">
            <RenderRemote
                data={usersWithFullName}
                success={(users) => users.map((user) => <UserComponent {...user} key={user.id} />)}
                initial={<div>INITIAL</div>}
                failure={() => <div>ERROR</div>}
                pending={<div>SKELETON</div>}
            />
        </div>
    </div>
  );
};
