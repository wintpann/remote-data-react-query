import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { pipe } from 'fp-ts/function';
import { useNumberControl } from 'storybox-react';
import { remote, RemoteData } from '../../core';
import { api, Success, User } from './util';

const elseUser = {
  id: 0,
  name: '--',
  username: '--',
  email: '--',
  address: {
    street: '--',
    suite: '--',
    city: '--',
    zipcode: '--',
    geo: {
      lat: '--',
      lng: '--',
    },
  },
  phone: '--',
  website: '--',
  company: {
    name: '--',
    catchPhrase: '--',
    bs: '--',
  },
};

export const GetOrElse = () => {
  const [userId] = useNumberControl({
    name: 'userId',
    min: 1,
    max: 10,
    integerOnly: true,
    defaultValue: 1,
  });

  const user: RemoteData<Error, User> = useQuery(['user', userId], () => api.getUser(userId));

  const userAddress: User = pipe(
    user,
    remote.getOrElse(() => elseUser),
  );

  return <Success data={userAddress} />;
};
