import React, { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, APIUser, UserComponent } from '../../util';
import { RemoteData, RenderRemote } from '../../../lib/lite';

export const RemoteSimple: FC = () => {
  const users: RemoteData<Error, APIUser[]> = useQuery(['users'], () => api.getUsers());

  return (
    <div>
      <button onClick={users.refetch}>refetch</button>
      <div className="remote">
        <RenderRemote
          data={users}
          success={(users) => users.map((user) => <UserComponent {...user} key={user.id} />)}
          initial={<div>INITIAL</div>}
          failure={() => <div>ERROR</div>}
          pending={<div>SKELETON</div>}
        />
      </div>
    </div>
  );
};
