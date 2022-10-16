import { createElement, Fragment, ReactNode } from 'react';
import { Option, isNone, some, fromNullable, none, fold as optionFold } from 'fp-ts/Option';
import { Either, left, right, isLeft } from 'fp-ts/Either';
import { pipe, Lazy } from 'fp-ts/function';

// region Common

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

type RemoteBase = {
  status: string;
  fetchStatus: string;
  remove: () => void;
  refetch: () => void;
};

type RemoteInitial = RemoteBase & {
  data: undefined;
  error: null;
};

type RemotePending<A> = RemoteBase & {
  data: A | undefined;
  error: null;
};

type RemoteSuccess<A> = RemoteBase & {
  data: A;
  error: null;
};

type RemoteFailure<E> = RemoteBase & {
  data: any;
  error: E;
};

type RemoteData<E, A> = RemoteInitial | RemotePending<A> | RemoteSuccess<A> | RemoteFailure<E>;

const noop = () => undefined;

const ignorePromise = (fn: () => Promise<any> | void) => (): void => {
  void fn();
};

const pendingInternal = <A>(
  value?: A,
  remove?: () => void,
  refetch?: () => void,
): RemoteData<never, A> => ({
  status: 'loading',
  fetchStatus: 'fetching',
  error: null,
  data: value,
  remove: remove ?? noop,
  refetch: refetch ?? noop,
});

const failureInternal = <E>(
  error: E,
  remove?: () => void,
  refetch?: () => void,
): RemoteData<E, never> => ({
  data: undefined,
  status: 'error',
  fetchStatus: 'idle',
  error,
  remove: remove ?? noop,
  refetch: refetch ?? noop,
});

const successInternal = <A>(
  value: A,
  remove?: () => void,
  refetch?: () => void,
): RemoteData<never, A> => ({
  status: 'success',
  fetchStatus: 'idle',
  error: null,
  data: value,
  remove: remove ?? noop,
  refetch: refetch ?? noop,
});

const initial: RemoteData<never, never> = {
  data: undefined,
  status: 'loading',
  fetchStatus: 'idle',
  error: null,
  remove: noop,
  refetch: noop,
};

const pending = <A>(value?: A): RemoteData<never, A> => ({
  status: 'loading',
  fetchStatus: 'fetching',
  error: null,
  data: value,
  remove: noop,
  refetch: noop,
});

const failure = <E>(error: E): RemoteData<E, never> => ({
  data: undefined,
  status: 'error',
  fetchStatus: 'idle',
  error,
  remove: noop,
  refetch: noop,
});

const success = <A>(value: A): RemoteData<never, A> => ({
  status: 'success',
  fetchStatus: 'idle',
  error: null,
  data: value,
  remove: noop,
  refetch: noop,
});

const isInitial = (data: RemoteData<unknown, unknown>): data is RemoteInitial =>
  data.status === 'loading' && data.fetchStatus === 'idle';

const isPending = <A>(data: RemoteData<unknown, A>): data is RemotePending<A> =>
  data.fetchStatus === 'fetching';

const isFailure = <E>(data: RemoteData<E, unknown>): data is RemoteFailure<E> =>
  data.status === 'error' && data.fetchStatus === 'idle';

const isSuccess = <A>(data: RemoteData<unknown, A>): data is RemoteSuccess<A> =>
  data.status === 'success' && data.fetchStatus === 'idle';

const map =
  <A, E, B>(f: (a: A) => B) =>
  (data: RemoteData<E, A>): RemoteData<E, B> => {
    if (isSuccess(data))
      return successInternal(f(data.data), data.remove, ignorePromise(data.refetch));
    // TODO think about what if A is actually undefined | null
    if (isPending(data) && data.data != null)
      return pendingInternal(f(data.data), data.remove, ignorePromise(data.refetch));
    return data as RemoteData<E, B>;
  };

const mapLeft =
  <EA, EB, A>(f: (a: EA) => EB) =>
  (data: RemoteData<EA, A>): RemoteData<EB, A> => {
    if (isFailure(data))
      return failureInternal(f(data.error), data.remove, ignorePromise(data.refetch));
    return data as RemoteData<EB, A>;
  };

const getOrElse =
  <A>(onElse: () => A) =>
  (data: RemoteData<unknown, A>) => {
    if (isSuccess(data)) return data.data;
    if (isPending(data) && data.data != null) return data.data;
    return onElse();
  };

const toNullable = <A>(data: RemoteData<unknown, A>): A | null => {
  if (isSuccess(data)) return data.data;
  if (isPending(data) && data.data != null) return data.data;
  return null;
};

const chain =
  <E, A, B>(f: (a: A) => RemoteData<E, B>) =>
  (data: RemoteData<E, A>): RemoteData<E, B> => {
    if (isSuccess(data)) return f(data.data);
    if (isPending(data) && data.data != null) return f(data.data);
    return data as RemoteData<E, B>;
  };

interface Sequence {
  <E, A>(a: RemoteData<E, A>): RemoteData<E, [A]>;

  <E, A, B>(a: RemoteData<E, A>, b: RemoteData<E, B>): RemoteData<E, [A, B]>;

  <E, A, B, C>(a: RemoteData<E, A>, b: RemoteData<E, B>, c: RemoteData<E, C>): RemoteData<
    E,
    [A, B, C]
  >;

  <E, A, B, C, D>(
    a: RemoteData<E, A>,
    b: RemoteData<E, B>,
    c: RemoteData<E, C>,
    d: RemoteData<E, D>,
  ): RemoteData<E, [A, B, C, D]>;

  <E, A, B, C, D, F>(
    a: RemoteData<E, A>,
    b: RemoteData<E, B>,
    c: RemoteData<E, C>,
    d: RemoteData<E, D>,
    f: RemoteData<E, F>,
  ): RemoteData<E, [A, B, C, D, F]>;

  <E, A, B, C, D, F, G>(
    a: RemoteData<E, A>,
    b: RemoteData<E, B>,
    c: RemoteData<E, C>,
    d: RemoteData<E, D>,
    f: RemoteData<E, F>,
    g: RemoteData<E, G>,
  ): RemoteData<E, [A, B, C, D, F, G]>;
}

const sequence: Sequence = ((...list: RemoteData<unknown, unknown>[]) => {
  const remove = () => list.forEach((el) => el.remove());
  const refetch = () => list.forEach((el) => el.refetch());

  const successCount = list.filter(isSuccess).length;
  if (successCount === list.length) {
    return successInternal(
      list.map(({ data }) => data),
      remove,
      refetch,
    );
  }

  const failureEntry = list.find(isFailure);
  if (failureEntry) return failureInternal(failureEntry.error, remove, refetch);

  const pendingDataOrSuccessCount = list.filter(
    (el) => (isPending(el) && el.data != null) || isSuccess(el),
  ).length;
  if (pendingDataOrSuccessCount === list.length) {
    return pendingInternal(
      list.map(({ data }) => data),
      remove,
      refetch,
    );
  }

  const pendingCount = list.filter(isPending).length;
  if (pendingCount > 0) return pendingInternal(undefined, remove, refetch);

  return initial;
}) as Sequence;

interface Combine {
  <S extends Record<string, RemoteData<unknown, unknown>>>(struct: S): RemoteData<
    S extends Record<string, RemoteData<infer R, unknown>> ? R : never,
    {
      [K in keyof S]: S[K] extends RemoteData<unknown, infer R> ? R : never;
    }
  >;
}

const combine = ((struct: Record<string, RemoteData<unknown, unknown>>) => {
  const entries = Object.entries(struct);
  const list = entries.map(([, el]) => el);

  // @ts-ignore
  const tupleSequence: RemoteData<unknown, unknown> = sequence(...list);

  if (isSuccess(tupleSequence)) {
    const result: Record<string, unknown> = {};
    entries.forEach(([key, el]) => {
      result[key] = el.data;
    });
    return successInternal(result, tupleSequence.remove, tupleSequence.refetch);
  }

  if (isPending(tupleSequence) && tupleSequence.data != null) {
    const result: Record<string, unknown> = {};
    entries.forEach(([key, el]) => {
      result[key] = el.data;
    });
    return pendingInternal(result, tupleSequence.remove, tupleSequence.refetch);
  }

  if (isPending(tupleSequence) || isFailure(tupleSequence)) return tupleSequence;

  return initial;
}) as Combine;

type RenderRemoteProps<E, A> = {
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

// endregion

const fold =
  <A, E, B>(
    onInitial: Lazy<B>,
    onPending: (data: Option<A>) => B,
    onFailure: (e: E) => B,
    onSuccess: (a: A) => B,
  ) =>
  (data: RemoteData<E, A>): B => {
    if (isInitial(data)) return onInitial();
    if (isFailure(data)) return onFailure(data.error);
    if (isSuccess(data)) return onSuccess(data.data);
    return onPending(fromNullable(data.data));
  };

const fromOption = <E, A>(option: Option<A>, onNone: Lazy<E>): RemoteData<E, A> => {
  if (isNone(option)) return failure(onNone());
  return success(option.value);
};

const toOption = <E, A>(data: RemoteData<E, A>): Option<A> => {
  if (isSuccess(data)) return some(data.data);
  if (isPending(data) && data.data != null) return some(data.data);
  return none;
};

const fromEither = <E, A>(ea: Either<E, A>): RemoteData<E, A> =>
  isLeft(ea) ? failure(ea.left) : success(ea.right);

const toEither =
  <E, A>(onInitial: Lazy<E>, onPending: Lazy<E>) =>
  (data: RemoteData<E, A>): Either<E, A> => {
    if (isSuccess(data)) return right(data.data);
    if (isInitial(data)) return left(onInitial());
    if (isPending(data) && data.data != null) return right(data.data);
    if (isPending(data)) return left(onPending());
    return left(data.error);
  };

export const remote = {
  /**
   * RemoteInitial constant
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * type User = { name: string; age: number };
   * const initialUsers: RemoteData<Error, User[]> = remote.initial;
   */
  initial,
  /**
   * RemotePending factory. Can be with or without "transitional" data
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * type User = { name: string; age: number };
   * const pendingUsersWithData: RemoteData<Error, User[]> = remote.pending([{name: "John", age: 20}]);
   * const pendingUsers: RemoteData<Error, User[]> = remote.pending();
   */
  pending,
  /**
   * RemoteFailure factory. Takes the "left" part of RemoteData
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * type User = { name: string; age: number };
   * const failureUsers: RemoteData<Error, User[]> = remote.failure(new Error('failed to fetch'));
   * // left part can be whatever you need
   * const failureUsersCustomError: RemoteData<{reason: string}, User[]> = remote.failure({reason: 'failed to fetch'});
   */
  failure,
  /**
   * RemoteSuccess factory. Takes the "right" part of RemoteData
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * type User = { name: string; age: number };
   * const successUsers: RemoteData<Error, User[]> = remote.success([{name: "John", age: 20}])
   */
  success,
  /**
   * Checks if RemoteData<E, A> is RemoteInitial
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * remote.isInitial(remote.initial) // true
   * remote.isInitial(remote.pending()) // false
   */
  isInitial,
  /**
   * Checks if RemoteData<E, A> is RemotePending<A>
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * remote.isPending(remote.pending()) // true
   * remote.isPending(remote.failure(new Error())) // false
   */
  isPending,
  /**
   * Checks if RemoteData<E, A> is RemoteFailure<E, A>
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * remote.isFailure(remote.failure(new Error())) // true
   * remote.isFailure(remote.success([])) // false
   */
  isFailure,
  /**
   * Checks if RemoteData<E, A> is RemoteSuccess<A>
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * remote.isSuccess(remote.success([])) // true
   * remote.isSuccess(remote.pending([])) // false
   */
  isSuccess,
  /**
   * Transforms the right part of RemoteData<E, A>
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * import { pipe } from 'fp-ts/function';
   * type User = { name: string; age: number };
   * type UserInfo = string; // name + age
   * const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})
   * const remoteUserName: RemoteData<Error, UserInfo> = pipe(remoteUser, remote.map(user => `${user.name} ${user.age}`))
   */
  map,
  /**
   * Transforms the left part of RemoteData<E, A>
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * import { pipe } from 'fp-ts/function';
   * const remoteUser: RemoteData<Error, string> = remote.failure(new Error('could not fetch'))
   * const remoteUserLeftMapped: RemoteData<{custom: string}, string> = pipe(remoteUser, remote.mapLeft(error => ({custom: String(error)})))
   */
  mapLeft,
  /**
   * Unwraps RemoteData<E, A>
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * import { pipe, identity } from 'fp-ts/function';
   * import { option } from 'fp-ts';
   * type User = { name: string; age: number };
   * const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})
   *
   * const user: string = pipe(
   *   remoteUser,
   *   remote.map(user => `${user.name} ${user.age}`),
   *   remote.fold(
   *     () => 'nothing is fetched',
   *     option.fold(() => 'just pending', (userInfo) => `info: ${userInfo}. pending again for some reason`),
   *     (e) => e.message,
   *     identity,
   *   )
   * )
   */
  fold,
  /**
   * Transforms RemoteData<E, A> to B
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * import { pipe } from 'fp-ts/function';
   * type User = { name: string; age: number };
   * const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})
   *
   * const user: string = pipe(
   *   remoteUser,
   *   remote.map(user => `${user.name} ${user.age}`),
   *   remote.getOrElse(() => 'no user was fetched')
   * )
   */
  getOrElse,
  /**
   * Transforms RemoteData<E, A> to A | null
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * type User = { name: string; age: number };
   * const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})
   *
   * const nullableUser: User | null = remote.toNullable(remoteUser);
   */
  toNullable,
  /**
   * Creates RemoteData<E, A> from an Option<A>
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * import { option } from 'fp-ts';
   * import { Option } from 'fp-ts/Option';
   * type User = { name: string; age: number };
   * const optionUser: Option<User> = option.some({name: 'John', age: 20})
   *
   * const remoteFromOptionUser: RemoteData<Error, User> = remote.fromOption(optionUser, () => new Error('option was none'))
   */
  fromOption,
  /**
   * Transforms RemoteData<E, A> to Option<A>
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * import { Option } from 'fp-ts/Option';
   * type User = { name: string; age: number };
   * const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})
   *
   * const optionUser: Option<User> = remote.toOption(remoteUser);
   */
  toOption,
  /**
   * Creates RemoteData<E, A> from an Either<E, A>
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * import { Either, right } from 'fp-ts/lib/Either';
   * type User = { name: string; age: number };
   * const eitherUser: Either<Error, User> = right({name: 'John', age: 20})
   *
   * const remoteFromEitherUser: RemoteData<Error, User> = remote.fromEither(eitherUser)
   */
  fromEither,
  /**
   * Transforms RemoteData<E, A> to Either<E, A>
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * import { Either } from 'fp-ts/lib/Either';
   * import { pipe } from 'fp-ts/function';
   * type User = { name: string; age: number };
   * const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})
   *
   * const eitherUser: Either<Error, User> = pipe(
   *   remoteUser,
   *   remote.toEither(() => new Error('initial'), () => new Error('pending'))
   * )
   */
  toEither,
  /**
   * Chains RemoteData<E, A> to RemoteData<E, B>
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * import { pipe } from 'fp-ts/function';
   * type User = { name: string; age: number };
   * type UserInfo = string; // name + age
   *
   * const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20})
   * const chained = pipe(
   *   remoteUser,
   *   remote.chain<Error, User, UserInfo>((user) => remote.success(`${user.name} ${user.age}`))
   * )
   */
  chain,
  /**
   * Transforms multiple remote data (in tuple) into one
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * type User = { name: string; age: number };
   * type City = { title: string };
   * const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20});
   * const remoteCity: RemoteData<Error, City> = remote.success({title: "New Orleans"});
   *
   * const remoteCombined: RemoteData<Error, [User, City]> = remote.sequence(remoteUser, remoteCity)
   */
  sequence,
  /**
   * Transforms multiple remote data (in struct) into one
   *
   * @example
   * import { remote } from 'remote-data-react-query';
   * type User = { name: string; age: number };
   * type City = { title: string };
   * const remoteUser: RemoteData<Error, User> = remote.success({name: "John", age: 20});
   * const remoteCity: RemoteData<Error, City> = remote.success({title: "New Orleans"});
   *
   * const remoteCombined: RemoteData<Error, {user: User; city: City}> = remote.combine({user: remoteUser, city: remoteCity})
   */
  combine,
};

export const RenderRemote = <E, A>({
  data,
  pending = null,
  refetching = () => pending,
  failure = () => null,
  initial = null,
  success,
}: RenderRemoteProps<E, A>): JSX.Element =>
  createElement(
    Fragment,
    null,
    pipe(
      data,
      remote.fold(
        () => initial,
        optionFold(() => pending, refetching),
        failure,
        success,
      ),
    ),
  );

export {
  Combine,
  RemotePending,
  RemoteFailure,
  RemoteSuccess,
  RemoteInitial,
  RemoteData,
  RenderRemoteProps,
};
