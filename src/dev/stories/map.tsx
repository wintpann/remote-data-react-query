import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { pipe } from 'fp-ts/function';
import { useNumberControl } from 'storybox-react';
import { remoteRQ, RemoteRQ, RenderRemoteRQ } from '../../core';
import { api, Failure, Initial, Pending, Refetching, Success, User } from './util';

export const Map = () => {
  const [userId] = useNumberControl({
    name: 'userId',
    min: 1,
    max: 10,
    integerOnly: true,
    defaultValue: 1,
  });

  const user: RemoteRQ<Error, User> = useQuery(['user', userId], () => api.getUser(userId));

  const userAddress = pipe(
    user,
    remoteRQ.map((user) => ({ userAddress: user.address })),
  );

  return (
    <RenderRemoteRQ
      data={userAddress}
      success={(data) => <Success data={data} />}
      refetching={(data) => <Refetching data={data} />}
      failure={Failure}
      pending={Pending}
      initial={Initial}
    />
  );
};
