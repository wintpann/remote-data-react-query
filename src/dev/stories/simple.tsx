import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNumberControl } from 'storybox-react';
import { RemoteRQ, RenderRemoteRQ } from '../../core';
import { api, Failure, Initial, Pending, Refetching, Success, User } from './util';

export const Simple = () => {
  const [userId] = useNumberControl({
    name: 'userId',
    min: 1,
    max: 10,
    integerOnly: true,
    defaultValue: 1,
  });

  const user: RemoteRQ<Error, User> = useQuery(['user', userId], () => api.getUser(userId));

  return (
    <RenderRemoteRQ
      data={user}
      success={(data) => <Success data={data} />}
      refetching={(data) => <Refetching data={data} />}
      failure={Failure}
      pending={Pending}
      initial={Initial}
    />
  );
};
