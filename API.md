## API

### remote.initial
```typescript
/** RemoteInitial constant */

import { remote } from 'remote-data-react-query';

type User = { name: string; age: number };

const initialUsers: RemoteData<Error, User[]> = remote.initial;
```

### remote.pending
```typescript
/** RemotePending factory. Can be with or without "transitional" data */

import { remote } from 'remote-data-react-query';

type User = { name: string; age: number };

const pendingUsersWithData: RemoteData<Error, User[]> = remote.pending([{name: "John", age: 20}]);

const pendingUsers: RemoteData<Error, User[]> = remote.pending();
```

### remote.failure
```typescript
/** RemoteFailure factory. Takes the "left" part of RemoteData */

import { remote } from 'remote-data-react-query';

type User = { name: string; age: number };

const failureUsers: RemoteData<Error, User[]> = remote.failure(new Error('failed to fetch'));

// left part can be whatever you need
const failureUsersCustomError: RemoteData<{reason: string}, User[]> = remote.failure({reason: 'failed to fetch'});
```

### remote.success
```typescript
/** RemoteSuccess factory. Takes the "right" part of RemoteData */

import { remote } from 'remote-data-react-query';

type User = { name: string; age: number };

const successUsers: RemoteData<Error, User[]> = remote.success([{name: "John", age: 20}])
```

### remote.isInitial
```typescript
/** Checks if RemoteData<E, A> is RemoteInitial */

import { remote } from 'remote-data-react-query';

remote.isInitial(remote.initial) // true

remote.isInitial(remote.pending()) // false
```

### remote.isPending
```typescript
/** Checks if RemoteData<E, A> is RemotePending<A> */

import { remote } from 'remote-data-react-query';

remote.isPending(remote.pending()) // true

remote.isPending(remote.failure(new Error())) // false
```

### remote.isFailure
```typescript
/** Checks if RemoteData<E, A> is RemoteFailure<E, A> */

import { remote } from 'remote-data-react-query';

remote.isFailure(remote.failure(new Error())) // true

remote.isFailure(remote.success([])) // false
```

### remote.isSuccess
```typescript
/** Checks if RemoteData<E, A> is RemoteSuccess<A> */

import { remote } from 'remote-data-react-query';

remote.isSuccess(remote.success([])) // true

remote.isSuccess(remote.pending([])) // false
```

### remote.map
```typescript
/** Transforms the right part (data) of RemoteData<E, A> */

import { remote } from 'remote-data-react-query';
import { pipe } from 'fp-ts/function';

type User = { name: string; age: number };
type UserInfo = string; // name + age

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const remoteUserName: RemoteData<Error, UserInfo> = pipe(remoteUser, remote.map(user => `${user.name} ${user.age}`))
```

### remote.mapLeft
```typescript
/** Transforms the left part (error) of RemoteData<E, A> */

import { remote } from 'remote-data-react-query';
import { pipe } from 'fp-ts/function';

const remoteUser: RemoteData<Error, string> = remote.failure(new Error('could not fetch'))
const remoteUserLeftMapped: RemoteData<{custom: string}, string> = pipe(remoteUser, remote.mapLeft(error => ({custom: String(error)})))
```

### remote.fold
```typescript
/** Unwraps RemoteData<E, A> */

import { remote } from 'remote-data-react-query';
import { pipe, identity } from 'fp-ts/function';
import { option } from 'fp-ts';

type User = { name: string; age: number };

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const user: string = pipe(
  remoteUser,
  remote.map(user => `${user.name} ${user.age}`),
  remote.fold(
    () => 'nothing is fetched',
    option.fold(() => 'just pending', (userInfo) => `info: ${userInfo}. pending again for some reason`),
    (e) => e.message,
    identity,
  )
)
```

### remote.getOrElse
```typescript
/** Transforms RemoteData<E, A> to B */

import { remote } from 'remote-data-react-query';
import { pipe } from 'fp-ts/function';

type User = { name: string; age: number };

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const user: string = pipe(
  remoteUser,
  remote.map(user => `${user.name} ${user.age}`),
  remote.getOrElse(() => 'no user was fetched')
)
```

### remote.toNullable
```typescript
/** Transforms RemoteData<E, A> to A | null */

import { remote } from 'remote-data-react-query';

type User = { name: string; age: number };

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const nullableUser: User | null = remote.toNullable(remoteUser);
```

### remote.fromOption
```typescript
/** Creates RemoteData<E, A> from an Option<A> */

import { remote } from 'remote-data-react-query';
import { option } from 'fp-ts';
import { Option } from 'fp-ts/Option';

type User = { name: string; age: number };

const optionUser: Option<User> = option.some({name: 'John', age: 20})

const remoteFromOptionUser: RemoteData<Error, User> = remote.fromOption(optionUser, () => new Error('option was none'))
```

### remote.toOption
```typescript
/** Transforms RemoteData<E, A> to Option<A> */

import { remote } from 'remote-data-react-query';
import { Option } from 'fp-ts/Option';

type User = { name: string; age: number };

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const optionUser: Option<User> = remote.toOption(remoteUser);
```

### remote.fromEither
```typescript
/** Creates RemoteData<E, A> from an Either<E, A> */

import { remote } from 'remote-data-react-query';
import { Either, right } from 'fp-ts/lib/Either';

type User = { name: string; age: number };

const eitherUser: Either<Error, User> = right({name: 'John', age: 20})

const remoteFromEitherUser: RemoteData<Error, User> = remote.fromEither(eitherUser)
```

### remote.toEither
```typescript
/** Transforms RemoteData<E, A> to Either<E, A> */

import { remote } from 'remote-data-react-query';
import { Either } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/function';

type User = { name: string; age: number };
const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const eitherUser: Either<Error, User> = pipe(
  remoteUser,
  remote.toEither(() => new Error('initial'), () => new Error('pending'))
)
```

### remote.chain
```typescript
/** Chains RemoteData<E, A> to RemoteData<E, B> */

import { remote } from 'remote-data-react-query';
import { pipe } from 'fp-ts/function';

type User = { name: string; age: number };
type UserInfo = string; // name + age

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})

const chained = pipe(
  remoteUser,
  remote.chain<Error, User, UserInfo>((user) => remote.success(`${user.name} ${user.age}`))
)
```

### remote.sequence
```typescript
/** Transforms multiple remote data (in tuple) into one */

import { remote } from 'remote-data-react-query';

type User = { name: string; age: number };
type City = { title: string };

const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20});
const remoteCity: RemoteData<Error, City> = remote.success({title: "New Orleans"});

const remoteCombined: RemoteData<Error, [User, City]> = remote.sequence(remoteUser, remoteCity)
```

### remote.combine
```typescript
/** Transforms multiple remote data (in struct) into one */

import { remote } from 'remote-data-react-query';

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