import { createElement, Fragment, ReactNode } from 'react';
import { Option, isNone, some, fromNullable, none, fold as optionFold } from 'fp-ts/Option';
import { Either, left, right, isLeft } from 'fp-ts/lib/Either';
import { pipe, Lazy } from 'fp-ts/function';
import { UseQueryResult } from '@tanstack/react-query/src/types';
import { UseMutationResult } from '@tanstack/react-query';

/**
 * Initial = {
 *   status: 'loading';
 *   fetchStatus: 'idle';
 * }
 *
 * Pending = {
 *   fetchStatus: 'fetching';
 * }
 *
 * Success = {
 *   status: 'success';
 *   fetchStatus: 'idle'
 * }
 *
 * Failure = {
 *   status: 'error';
 *   fetchStatus: 'idle'
 * }
 */

type RemoteRQBase = {
  status: string;
  fetchStatus: string;
};

export type RemoteRQInitial = RemoteRQBase & {
  data: undefined;
  error: null;
};

export type RemoteRQPending<A> = RemoteRQBase & {
  data: A | undefined;
  error: null;
};

export type RemoteRQSuccess<A> = RemoteRQBase & {
  data: A;
  error: null;
};

export type RemoteRQFailure<E, A> = RemoteRQBase & {
  data: A | undefined;
  error: E;
};

export type RemoteRQ<E, A> =
  | RemoteRQInitial
  | RemoteRQPending<A>
  | RemoteRQSuccess<A>
  | RemoteRQFailure<E, A>;

/**
 * RemoteRQInitial constant
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * type User = { name: string; age: number };
 * const initialUsers: RemoteRQ<Error, User[]> = remoteRQ.initial;
 */
const initial: RemoteRQ<never, never> = {
  data: undefined,
  status: 'loading',
  fetchStatus: 'idle',
  error: null,
};

/**
 * RemoteRQPending factory. Can be with or without "transitional" data
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * type User = { name: string; age: number };
 * const pendingUsersWithData: RemoteRQ<Error, User[]> = remoteRQ.pending([{name: "John", age: 20}]);
 * const pendingUsers: RemoteRQ<Error, User[]> = remoteRQ.pending();
 */
const pending = <A>(value?: A): RemoteRQ<never, A> => ({
  status: 'loading',
  fetchStatus: 'fetching',
  error: null,
  data: value,
});

/**
 * RemoteRQFailure factory. Takes the "left" part of RemoteRQ
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * type User = { name: string; age: number };
 * const failureUsers: RemoteRQ<Error, User[]> = remoteRQ.failure(new Error('failed to fetch'));
 * // left part can be whatever you need
 * const failureUsersCustomError: RemoteRQ<{reason: string}, User[]> = remoteRQ.failure({reason: 'failed to fetch'});
 */
const failure = <E>(error: E): RemoteRQ<E, never> => ({
  data: undefined,
  status: 'error',
  fetchStatus: 'idle',
  error,
});

/**
 * RemoteRQSuccess factory. Takes the "right" part of RemoteRQ
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * type User = { name: string; age: number };
 * const successUsers: RemoteRQ<Error, User[]> = remoteRQ.success([{name: "John", age: 20}])
 */
const success = <A>(value: A): RemoteRQ<never, A> => ({
  status: 'success',
  fetchStatus: 'idle',
  error: null,
  data: value,
});

/**
 * Checks if RemoteRQ<E, A> is RemoteRQInitial
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * remoteRQ.isInitial(remoteRQ.initial) // true
 * remoteRQ.isInitial(remoteRQ.pending()) // false
 */
const isInitial = <E, A>(data: RemoteRQ<E, A>): data is RemoteRQInitial =>
  data.status === 'loading' && data.fetchStatus === 'idle';

/**
 * Checks if RemoteRQ<E, A> is RemoteRQPending<A>
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * remoteRQ.isPending(remoteRQ.pending()) // true
 * remoteRQ.isPending(remoteRQ.failure(new Error())) // false
 */
const isPending = <E, A>(data: RemoteRQ<E, A>): data is RemoteRQPending<A> =>
  data.fetchStatus === 'fetching';

/**
 * Checks if RemoteRQ<E, A> is RemoteRQFailure<E, A>
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * remoteRQ.isFailure(remoteRQ.failure(new Error())) // true
 * remoteRQ.isFailure(remoteRQ.success([])) // false
 */
const isFailure = <E, A>(data: RemoteRQ<E, A>): data is RemoteRQFailure<E, A> =>
  data.status === 'error' && data.fetchStatus === 'idle';

/**
 * Checks if RemoteRQ<E, A> is RemoteRQSuccess<A>
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * remoteRQ.isSuccess(remoteRQ.success([])) // true
 * remoteRQ.isSuccess(remoteRQ.pending([])) // false
 */
const isSuccess = <E, A>(data: RemoteRQ<E, A>): data is RemoteRQSuccess<A> =>
  data.status === 'success' && data.fetchStatus === 'idle';

/**
 * Transforms the right part of RemoteRQ<E, A>
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * import { pipe } from 'fp-ts/function';
 * type User = { name: string; age: number };
 * type UserInfo = string; // name + age
 * const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})
 * const remoteUserName: RemoteRQ<Error, UserInfo> = pipe(remoteUser, remoteRQ.map(user => `${user.name} ${user.age}`))
 */
const map =
  <A, E, B>(f: (a: A) => B) =>
  (data: RemoteRQ<E, A>): RemoteRQ<E, B> =>
    ({
      ...data,
      data: data.data != null ? f(data.data) : data.data,
    } as RemoteRQ<E, B>);

/**
 * Unwraps RemoteRQ<E, A>
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * import { pipe, identity } from 'fp-ts/function';
 * import { option } from 'fp-ts';
 * type User = { name: string; age: number };
 * const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})
 *
 * const user: string = pipe(
 *   remoteUser,
 *   remoteRQ.map(user => `${user.name} ${user.age}`),
 *   remoteRQ.fold(
 *     () => 'nothing is fetched',
 *     option.fold(() => 'just pending', (userInfo) => `info: ${userInfo}. pending again for some reason`),
 *     (e) => e.message,
 *     identity,
 *   )
 * )
 */
const fold =
  <A, E, B>(
    onInitial: Lazy<B>,
    onPending: (data: Option<A>) => B,
    onFailure: (e: E) => B,
    onSuccess: (a: A) => B,
  ) =>
  (data: RemoteRQ<E, A>): B => {
    if (isInitial(data)) return onInitial();
    if (isFailure(data)) return onFailure(data.error);
    if (isSuccess(data)) return onSuccess(data.data);
    return onPending(fromNullable(data.data));
  };

/**
 * Transforms RemoteRQ<E, A> to B
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * import { pipe } from 'fp-ts/function';
 * type User = { name: string; age: number };
 * const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})
 *
 * const user: string = pipe(
 *   remoteUser,
 *   remoteRQ.map(user => `${user.name} ${user.age}`),
 *   remoteRQ.getOrElse(() => 'no user was fetched')
 * )
 */
const getOrElse =
  <A, E>(onElse: Lazy<A>) =>
  (data: RemoteRQ<E, A>) => {
    if (isSuccess(data)) return data.data;
    if (isPending(data) && data.data != null) return data.data;
    return onElse();
  };

/**
 * Transforms RemoteRQ<E, A> to A | null
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * type User = { name: string; age: number };
 * const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})
 *
 * const nullableUser: User | null = remoteRQ.toNullable(remoteUser);
 */
const toNullable = <E, A>(data: RemoteRQ<E, A>): A | null => {
  if (isSuccess(data)) return data.data;
  if (isPending(data) && data.data != null) return data.data;
  return null;
};

/**
 * Creates RemoteRQ<E, A> from an Option<A>
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * import { option } from 'fp-ts';
 * import { Option } from 'fp-ts/Option';
 * type User = { name: string; age: number };
 * const optionUser: Option<User> = option.some({name: 'John', age: 20})
 *
 * const remoteFromOptionUser: RemoteRQ<Error, User> = remoteRQ.fromOption(optionUser, () => new Error('option was none'))
 */
const fromOption = <E, A>(option: Option<A>, onNone: Lazy<E>): RemoteRQ<E, A> => {
  if (isNone(option)) return failure(onNone());
  return success(option.value);
};

/**
 * Transforms RemoteRQ<E, A> to Option<A>
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * import { Option } from 'fp-ts/Option';
 * type User = { name: string; age: number };
 * const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})
 *
 * const optionUser: Option<User> = remoteRQ.toOption(remoteUser);
 */
const toOption = <E, A>(data: RemoteRQ<E, A>): Option<A> => {
  if (isSuccess(data)) return some(data.data);
  if (isPending(data) && data.data != null) return some(data.data);
  return none;
};

/**
 * Creates RemoteRQ<E, A> from an Either<E, A>
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * import { Either, right } from 'fp-ts/lib/Either';
 * type User = { name: string; age: number };
 * const eitherUser: Either<Error, User> = right({name: 'John', age: 20})
 *
 * const remoteFromEitherUser: RemoteRQ<Error, User> = remoteRQ.fromEither(eitherUser)
 */
const fromEither = <E, A>(ea: Either<E, A>): RemoteRQ<E, A> =>
  isLeft(ea) ? failure(ea.left) : success(ea.right);

/**
 * Transforms RemoteRQ<E, A> to Either<E, A>
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * import { Either } from 'fp-ts/lib/Either';
 * import { pipe } from 'fp-ts/function';
 * type User = { name: string; age: number };
 * const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})
 *
 * const eitherUser: Either<Error, User> = pipe(
 *   remoteUser,
 *   remoteRQ.toEither(() => new Error('initial'), () => new Error('pending'))
 * )
 */
const toEither =
  <E, A>(onInitial: Lazy<E>, onPending: Lazy<E>) =>
  (data: RemoteRQ<E, A>): Either<E, A> => {
    if (isInitial(data)) return left(onInitial());
    if (isPending(data) && data.data != null) return right(data.data);
    if (isPending(data)) return left(onPending());
    if (isSuccess(data)) return right(data.data);
    return left(data.error);
  };

/**
 * Chains RemoteRQ<E, A> to RemoteRQ<E, B>
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * import { pipe } from 'fp-ts/function';
 * type User = { name: string; age: number };
 * type UserInfo = string; // name + age
 *
 * const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20})
 * const chained = pipe(
 *   remoteUser,
 *   remoteRQ.chain<Error, User, UserInfo>((user) => remoteRQ.success(`${user.name} ${user.age}`))
 * )
 */
const chain =
  <E, A, B>(f: (a: A) => RemoteRQ<E, B>) =>
  (data: RemoteRQ<E, A>): RemoteRQ<E, B> => {
    if (isSuccess(data)) return f(data.data);
    if (isPending(data) && data.data != null) return f(data.data);
    return data as RemoteRQ<E, B>;
  };

/**
 * Returns same object from UseQueryResult<A, E> typed as RemoteRQ<E, A>
 */
const fromQuery = <E, A>(query: UseQueryResult<A, E>): RemoteRQ<E, A> => query;

/**
 * Returns query-like object from UseMutationResult<A, E> typed as RemoteRQ<E, A>
 */
const fromMutation = <E, A>(mutation: UseMutationResult<A, E>): RemoteRQ<E, A> => {
  if (mutation.status === 'idle') return initial;
  if (mutation.status === 'loading') return pending();
  if (mutation.status === 'success') return success(mutation.data);
  return failure(mutation.error);
};

interface SequenceT {
  <E, A>(a: RemoteRQ<E, A>): RemoteRQ<E, [A]>;

  <E, A, B>(a: RemoteRQ<E, A>, b: RemoteRQ<E, B>): RemoteRQ<E, [A, B]>;

  <E, A, B, C>(a: RemoteRQ<E, A>, b: RemoteRQ<E, B>, c: RemoteRQ<E, C>): RemoteRQ<E, [A, B, C]>;

  <E, A, B, C, D>(
    a: RemoteRQ<E, A>,
    b: RemoteRQ<E, B>,
    c: RemoteRQ<E, C>,
    d: RemoteRQ<E, D>,
  ): RemoteRQ<E, [A, B, C, D]>;

  <E, A, B, C, D, F>(
    a: RemoteRQ<E, A>,
    b: RemoteRQ<E, B>,
    c: RemoteRQ<E, C>,
    d: RemoteRQ<E, D>,
    f: RemoteRQ<E, F>,
  ): RemoteRQ<E, [A, B, C, D, F]>;

  <E, A, B, C, D, F, G>(
    a: RemoteRQ<E, A>,
    b: RemoteRQ<E, B>,
    c: RemoteRQ<E, C>,
    d: RemoteRQ<E, D>,
    f: RemoteRQ<E, F>,
    g: RemoteRQ<E, G>,
  ): RemoteRQ<E, [A, B, C, D, F, G]>;
}

/**
 * Transforms multiple remote data (in tuple) into one
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * type User = { name: string; age: number };
 * type City = { title: string };
 * const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20});
 * const remoteCity: RemoteRQ<Error, City> = remoteRQ.success({title: "New Orleans"});
 *
 * const remoteCombined: RemoteRQ<Error, [User, City]> = remoteRQ.sequenceT(remoteUser, remoteCity)
 */
const sequenceT: SequenceT = ((...list: RemoteRQ<any, any>[]) => {
  const successCount = list.filter(isSuccess).length;
  if (successCount === list.length) return success(list.map(({ data }) => data));

  const failureEntry = list.find(isFailure);
  if (failureEntry) return failure(failureEntry.error);

  const pendingDataOrSuccessCount = list.filter(
    (el) => (isPending(el) && el.data != null) || isSuccess(el),
  ).length;
  if (pendingDataOrSuccessCount === list.length) return pending(list.map(({ data }) => data));

  const pendingCount = list.filter(isPending).length;
  if (pendingCount > 0) return pending();

  return initial;
}) as SequenceT;

interface SequenceS {
  <E, S extends Record<string, RemoteRQ<any, any>>>(struct: S): RemoteRQ<
    E,
    {
      [K in keyof S]: S[K] extends RemoteRQ<E, infer R> ? R : never;
    }
  >;
}

/**
 * Transforms multiple remote data (in struct) into one
 *
 * @example
 * import { remoteRQ } from 'remote-data-react-query';
 * type User = { name: string; age: number };
 * type City = { title: string };
 * const remoteUser: RemoteRQ<Error, User> = remoteRQ.success({name: "John", age: 20});
 * const remoteCity: RemoteRQ<Error, City> = remoteRQ.success({title: "New Orleans"});
 *
 * const remoteCombined: RemoteRQ<Error, {user: User; city: City}> = remoteRQ.sequenceS({user: remoteUser, city: remoteCity})
 */
const sequenceS = (<S extends Record<string, RemoteRQ<any, any>>>(struct: S) => {
  const entries = Object.entries(struct);
  const list = entries.map(([, el]) => el);

  // @ts-ignore
  const tupleSequence: RemoteRQ<any, any> = sequenceT(...list);

  if (isSuccess(tupleSequence))
    return success(entries.reduce((acc, [key, el]) => ({ ...acc, [key]: el.data }), {}));

  if (isPending(tupleSequence) && tupleSequence.data != null)
    return pending(
      entries.reduce(
        (acc, [key, el]) => ({
          ...acc,
          [key]: el.data,
        }),
        {},
      ),
    );

  if (isPending(tupleSequence)) return pending();

  if (isFailure(tupleSequence)) return tupleSequence;

  return initial;
}) as SequenceS;

export const remoteRQ = {
  initial,
  pending,
  failure,
  success,
  isInitial,
  isPending,
  isFailure,
  isSuccess,
  map,
  fold,
  getOrElse,
  toNullable,
  fromOption,
  toOption,
  fromEither,
  toEither,
  chain,
  sequenceT,
  sequenceS,
  fromQuery,
  fromMutation,
};

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

export const RenderRemoteRQ = <E, A>({
  data,
  pending = null,
  refetching = () => pending,
  failure = () => null,
  initial = null,
  success,
}: RenderRemoteRQProps<E, A>): JSX.Element =>
  createElement(
    Fragment,
    null,
    pipe(
      data,
      remoteRQ.fold(
        () => initial,
        optionFold(() => pending, refetching),
        failure,
        success,
      ),
    ),
  );
