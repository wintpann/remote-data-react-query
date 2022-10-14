import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNumberControl } from 'storybox-react';
import { remote, RemoteData, RenderRemote } from '../../lib';
import { api, Failure, Initial, Pending, Refetching, Success, User } from './util';

export const Combine = () => {
  const [userId] = useNumberControl({
    name: 'userId',
    min: 1,
    max: 10,
    integerOnly: true,
    defaultValue: 1,
  });

  const [anotherUserId] = useNumberControl({
    name: 'anotherUserId',
    min: 1,
    max: 10,
    integerOnly: true,
    defaultValue: 3,
  });

  const user: RemoteData<Error, User> = useQuery(['user', userId], () => api.getUser(userId));
  const anotherUser: RemoteData<Error, User> = useQuery(['anotherUser', anotherUserId], () =>
    api.getUser(anotherUserId),
  );

  const users = remote.combine({
    user,
    anotherUser,
  });

  return (
    <RenderRemote
      data={users}
      success={(data) => <Success data={data} />}
      refetching={(data) => <Refetching data={data} />}
      failure={Failure}
      pending={Pending}
      initial={Initial}
    />
  );
};
