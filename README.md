# ADT compatible with useQuery from '@tanstack/react-query'

## Prerequisites:
* basic knowledge of FP approach and [fp-ts](https://github.com/gcanti/fp-ts) package
* useQuery hook from [react-query](https://github.com/tanstack/query)

## Installation
`yarn add remote-data-react-query`

## Prior art:
* [@devexperts/remote-data-ts](https://github.com/devexperts/remote-data-ts)

* [Slaying a UI Antipattern with Flow](https://medium.com/@gcanti/slaying-a-ui-antipattern-with-flow-5eed0cfb627b)

## Usage example
```typescript jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { remoteRQ, RemoteRQ, RenderRemoteRQ } from 'remote-data-react-query';
import { pipe } from 'fp-ts/function';

type User = { name: string; phone: string };

export const UsageExample = () => {
    const user: RemoteRQ<Error, User> = useQuery(['user'], () =>
        fetch(`https://jsonplaceholder.typicode.com/users/1`).then(res => res.json()),
    );

    const userPhone = pipe(
        user,
        remoteRQ.map((user) => user.phone),
    );

    return (
        <RenderRemoteRQ
            data={userPhone}
            success={(phone) => <div>{phone}</div>}
            refetching={(phone) => <div>{phone} refreshing...</div>}
            failure={(e) => <div>failed to fetch {e.message}</div>}
            pending={<div>just pending</div>}
            initial={<div>initial</div>}
        />
    );
};
```

## API

### remoteRQ.initial
```typescript
import { remoteRQ } from 'remote-data-react-query';

type User = { name: string; age: number };

const initialUsers: RemoteRQ<Error, User[]> = remoteRQ.initial;
```

### remoteRQ.pending
```typescript
import { remoteRQ } from 'remote-data-react-query';

type User = { name: string; age: number };

const pendingUsersWithData: RemoteRQ<Error, User[]> = remoteRQ.pending([{name: "John", age: 20}]);

const pendingUsers: RemoteRQ<Error, User[]> = remoteRQ.pending();
```

### remoteRQ.failure
```typescript
import { remoteRQ } from 'remote-data-react-query';

type User = { name: string; age: number };

const failureUsers: RemoteRQ<Error, User[]> = remoteRQ.failure(new Error('failed to fetch'));

// left part can be whatever you need
const failureUsersCustomError: RemoteRQ<{reason: string}, User[]> = remoteRQ.failure({reason: 'failed to fetch'});
```

### remoteRQ.success
```typescript
import { remoteRQ } from 'remote-data-react-query';

type User = { name: string; age: number };

const successUsers: RemoteRQ<Error, User[]> = remoteRQ.success([{name: "John", age: 20}])
```

### remoteRQ.isInitial
```typescript
import { remoteRQ } from 'remote-data-react-query';

remoteRQ.isInitial(remoteRQ.initial) // true

remoteRQ.isInitial(remoteRQ.pending()) // false
```

### remoteRQ.isPending
```typescript

import { remoteRQ } from 'remote-data-react-query';

remoteRQ.isPending(remoteRQ.pending()) // true

remoteRQ.isPending(remoteRQ.failure(new Error())) // false
```

### remoteRQ.isFailure
```typescript
import { remoteRQ } from 'remote-data-react-query';

remoteRQ.isFailure(remoteRQ.failure(new Error())) // true

remoteRQ.isFailure(remoteRQ.success([])) // false
```

### remoteRQ.isSuccess
```typescript
import { remoteRQ } from 'remote-data-react-query';

remoteRQ.isSuccess(remoteRQ.success([])) // true

remoteRQ.isSuccess(remoteRQ.pending([])) // false
```

### remoteRQ.map
```typescript
import { remoteRQ } from 'remote-data-react-query';
import { pipe } from 'fp-ts/function';

type User = { name: string; age: number };
type UserInfo = string; // name + age

const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})

const remoteUserName: RemoteRQ<Error, UserInfo> = pipe(remoteUser, remoteRQ.map(user => `${user.name} ${user.age}`))
```

### remoteRQ.fold
```typescript
import { remoteRQ } from 'remote-data-react-query';
import { pipe, identity } from 'fp-ts/function';
import { option } from 'fp-ts';

type User = { name: string; age: number };

const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})

const user: string = pipe(
  remoteUser,
  remoteRQ.map(user => `${user.name} ${user.age}`),
  remoteRQ.fold(
    () => 'nothing is fetched',
    option.fold(() => 'just pending', (userInfo) => `info: ${userInfo}. pending again for some reason`),
    (e) => e.message,
    identity,
  )
)
```

### remoteRQ.getOrElse
```typescript
import { remoteRQ } from 'remote-data-react-query';
import { pipe } from 'fp-ts/function';

type User = { name: string; age: number };

const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})

const user: string = pipe(
  remoteUser,
  remoteRQ.map(user => `${user.name} ${user.age}`),
  remoteRQ.getOrElse(() => 'no user was fetched')
)
```

### remoteRQ.toNullable
```typescript
import { remoteRQ } from 'remote-data-react-query';

type User = { name: string; age: number };

const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})

const nullableUser: User | null = remoteRQ.toNullable(remoteUser);
```

### remoteRQ.fromOption
```typescript
import { remoteRQ } from 'remote-data-react-query';
import { option } from 'fp-ts';
import { Option } from 'fp-ts/Option';

type User = { name: string; age: number };

const optionUser: Option<User> = option.some({name: 'John', age: 20})

const remoteFromOptionUser: RemoteRQ<Error, User> = remoteRQ.fromOption(optionUser, () => new Error('option was none'))
```

### remoteRQ.toOption
```typescript
import { remoteRQ } from 'remote-data-react-query';
import { Option } from 'fp-ts/Option';

type User = { name: string; age: number };

const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})

const optionUser: Option<User> = remoteRQ.toOption(remoteUser);
```

### remoteRQ.fromEither
```typescript
import { remoteRQ } from 'remote-data-react-query';
import { Either, right } from 'fp-ts/lib/Either';

type User = { name: string; age: number };

const eitherUser: Either<Error, User> = right({name: 'John', age: 20})

const remoteFromEitherUser: RemoteRQ<Error, User> = remoteRQ.fromEither(eitherUser)
```

### remoteRQ.toEither
```typescript
import { remoteRQ } from 'remote-data-react-query';
import { Either } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/function';

type User = { name: string; age: number };
const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})

const eitherUser: Either<Error, User> = pipe(
  remoteUser,
  remoteRQ.toEither(() => new Error('initial'), () => new Error('pending'))
)
```

### remoteRQ.chain
```typescript
import { remoteRQ } from 'remote-data-react-query';
import { pipe } from 'fp-ts/function';

type User = { name: string; age: number };
type UserInfo = string; // name + age

const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})

const chained = pipe(
  remoteUser,
  remoteRQ.chain<Error, User, UserInfo>((user) => remoteRQ.success(`${user.name} ${user.age}`))
)
```

### remoteRQ.sequenceT
```typescript
import { remoteRQ } from 'remote-data-react-query';

type User = { name: string; age: number };
type City = { title: string };

const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20});
const remoteCity: RemoteRQ<Error, City> = remoteRQ.success({title: "New Orleans"});

const remoteCombined: RemoteRQ<Error, [User, City]> = remoteRQ.sequenceT(remoteUser, remoteCity)
```

### remoteRQ.sequenceS
```typescript
import { remoteRQ } from 'remote-data-react-query';

type User = { name: string; age: number };
type City = { title: string };

const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20});
const remoteCity: RemoteRQ<Error, City> = remoteRQ.success({title: "New Orleans"});

const remoteCombined: RemoteRQ<Error, {user: User; city: City}> = remoteRQ.sequenceS({user: remoteUser, city: remoteCity})
```

### RenderRemoteRQ
```typescript
export type RenderRemoteRQProps<E, A> = {
    /** Remote data needs to be rendered */
    data: RemoteRQ<E, A>;
    /** Render content function on failure state */
    failure?: (e: E) => ReactNode;
    /** Render content constant on initial state */
    initial?: ReactNode;
    /** Render content constant on pending state */
    pending?: ReactNode;
    /** Render content function on pending with data (refetching) state */
    refetching?: (data: A) => ReactNode;
    /** Render content function on success state */
    success: (data: A) => ReactNode;
};
```

## CHANGELOG

### 0.0.1 `06.08.2022`
* Initial release

### 0.0.2 `07.08.2022`
* Update readme
