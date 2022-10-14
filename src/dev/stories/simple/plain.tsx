import React, { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, UserComponent } from '../../util';

export const PlainSimple: FC = () => {
  const users = useQuery(['users'], () => api.getUsers());

  const usersLoading = users.isFetching || users.isLoading;
  const usersSuccess = users.isSuccess && users.data && !usersLoading;
  const isInitial = users.status === 'loading' && users.fetchStatus === 'idle';

  const refetch = () => {
    void users.refetch();
  };

  return (
    <div>
      <button onClick={refetch}>refetch</button>
      <div className="remote">
        {usersSuccess && users.data.map((user) => <UserComponent {...user} key={user.id} />)}
        {usersLoading && <div>SKELETON</div>}
        {users.isError && <div>ERROR</div>}
        {isInitial && <div>INITIAL</div>}
      </div>
    </div>
  );
};
