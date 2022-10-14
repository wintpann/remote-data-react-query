## API

### remote.initial
```typescript
/** RemoteInitial constant */

import { remote } from 'remote-data-react-query/lite';

type User = { name: string; age: number };

const initialUsers: RemoteData<Error, User[]> = remote.initial;
```

### remote.pending
```typescript
/** RemotePending factory. Can be with or without "transitional" data */

import { remote } from 'remote-data-react-query/lite';

type User = { name: string; age: number };

const pendingUsersWithData: RemoteData<Error, User[]> = remote.pending([{name: "John", age: 20}]);

const pendingUsers: RemoteData<Error, User[]> = remote.pending();
```

### remote.failure
```typescript
/** RemoteFailure factory. Takes the "left" part of RemoteData */

import { remote } from 'remote-data-react-query/lite';

type User = { name: string; age: number };

const failureUsers: RemoteData<Error, User[]> = remote.failure(new Error('failed to fetch'));

// left part can be whatever you need
const failureUsersCustomError: RemoteData<{reason: string}, User[]> = remote.failure({reason: 'failed to fetch'});
```

### remote.success
```typescript
/** RemoteSuccess factory. Takes the "right" part of RemoteData */

import { remote } from 'remote-data-react-query/lite';

type User = { name: string; age: number };

const successUsers: RemoteData<Error, User[]> = remote.success([{name: "John", age: 20}])
```

### remote.isInitial
```typescript
/** Checks if RemoteData<E, A> is RemoteInitial */

import { remote } from 'remote-data-react-query/lite';

remote.isInitial(remote.initial) // true

remote.isInitial(remote.pending()) // false
```

### remote.isPending
```typescript
/** Checks if RemoteData<E, A> is RemotePending<A> */

import { remote } from 'remote-data-react-query/lite';

remote.isPending(remote.pending()) // true

remote.isPending(remote.failure(new Error())) // false
```

### remote.isFailure
```typescript
/** Checks if RemoteData<E, A> is RemoteFailure<E, A> */

import { remote } from 'remote-data-react-query/lite';

remote.isFailure(remote.failure(new Error())) // true

remote.isFailure(remote.success([])) // false
```

### remote.isSuccess
```typescript
/** Checks if RemoteData<E, A> is RemoteSuccess<A> */

import { remote } from 'remote-data-react-query/lite';

remote.isSuccess(remote.success([])) // true

remote.isSuccess(remote.pending([])) // false
```

### remote.map
```typescript
/** Transforms the right part (data) of RemoteData<E, A> */

import { remote } from 'remote-data-react-query/lite';

type User = { name: string; age: number };
type UserInfo = string; // name + age

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const remoteUserName: RemoteData<Error, UserInfo> = remote.pipe(remoteUser, remote.map(user => `${user.name} ${user.age}`))
```

### remote.mapLeft
```typescript
/** Transforms the left part (error) of RemoteData<E, A> */

import { remote } from 'remote-data-react-query/lite';

const remoteUser: RemoteData<Error, string> = remote.failure(new Error('could not fetch'))
const remoteUserLeftMapped: RemoteData<{custom: string}, string> = remote.pipe(remoteUser, remote.mapLeft(error => ({custom: String(error)})))
```

### remote.fold
```typescript
/** Unwraps RemoteData<E, A> */

import { remote } from 'remote-data-react-query/lite';

type User = { name: string; age: number };

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const user: string = remote.pipe(
  remoteUser,
  remote.map(user => `${user.name} ${user.age}`),
  remote.fold(
    () => 'nothing is fetched', 
    (userInfo) => (userInfo ? `info: ${userInfo}. pending again for some reason` : 'just pending'),
    (e) => e.message,
    identity,
  )
)
```

### remote.getOrElse
```typescript
/** Transforms RemoteData<E, A> to B */

import { remote } from 'remote-data-react-query/lite';

type User = { name: string; age: number };

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const user: string = remote.pipe(
  remoteUser,
  remote.map(user => `${user.name} ${user.age}`),
  remote.getOrElse(() => 'no user was fetched')
)
```

### remote.toNullable
```typescript
/** Transforms RemoteData<E, A> to A | null */

import { remote } from 'remote-data-react-query/lite';

type User = { name: string; age: number };

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const nullableUser: User | null = remote.toNullable(remoteUser);
```

### remote.chain
```typescript
/** Chains RemoteData<E, A> to RemoteData<E, B> */

import { remote } from 'remote-data-react-query/lite';

type User = { name: string; age: number };
type UserInfo = string; // name + age

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const chained = remote.pipe(
  remoteUser,
  remote.chain<Error, User, UserInfo>((user) => remote.success(`${user.name} ${user.age}`))
)
```

### remote.sequence
```typescript
/** Transforms multiple remote data (in tuple) into one */

import { remote } from 'remote-data-react-query/lite';

type User = { name: string; age: number };
type City = { title: string };

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20});
const remoteCity: RemoteData<Error, City> = remote.success({title: "New Orleans"});

const remoteCombined: RemoteData<Error, [User, City]> = remote.sequence(remoteUser, remoteCity)
```

### remote.combine
```typescript
/** Transforms multiple remote data (in struct) into one */

import { remote } from 'remote-data-react-query/lite';

type User = { name: string; age: number };
type City = { title: string };

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20});
const remoteCity: RemoteData<Error, City> = remote.success({title: "New Orleans"});

const remoteCombined: RemoteData<Error, {user: User; city: City}> = remote.combine({user: remoteUser, city: remoteCity})
```

### RenderRemote
```typescript
/**  */
export type RenderRemoteProps<E, A> = {
    /** Remote data needs to be rendered */
    data: RemoteData<E, A>;
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