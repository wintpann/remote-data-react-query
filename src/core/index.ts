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

const initial: RemoteRQ<never, never> = {
  data: undefined,
  status: 'loading',
  fetchStatus: 'idle',
  error: null,
};

const pending = <A>(value?: A): RemoteRQ<never, A> => ({
  status: 'loading',
  fetchStatus: 'fetching',
  error: null,
  data: value,
});

const failure = <E>(error: E): RemoteRQ<E, never> => ({
  data: undefined,
  status: 'error',
  fetchStatus: 'idle',
  error,
});

const success = <A>(value: A): RemoteRQ<never, A> => ({
  status: 'success',
  fetchStatus: 'idle',
  error: null,
  data: value,
});

const isInitial = <E, A>(data: RemoteRQ<E, A>): data is RemoteRQInitial =>
  data.status === 'loading' && data.fetchStatus === 'idle';

const isPending = <E, A>(data: RemoteRQ<E, A>): data is RemoteRQPending<A> =>
  data.fetchStatus === 'fetching';

const isFailure = <E, A>(data: RemoteRQ<E, A>): data is RemoteRQFailure<E, A> =>
  data.status === 'error' && data.fetchStatus === 'idle';

const isSuccess = <E, A>(data: RemoteRQ<E, A>): data is RemoteRQSuccess<A> =>
  data.status === 'success' && data.fetchStatus === 'idle';

const map =
  <A, E, B>(f: (a: A) => B) =>
  (data: RemoteRQ<E, A>): RemoteRQ<E, B> =>
    ({
      ...data,
      data: data.data != null ? f(data.data) : data.data,
    } as RemoteRQ<E, B>);

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

const getOrElse =
  <A, E>(onElse: Lazy<A>) =>
  (data: RemoteRQ<E, A>) => {
    if (isSuccess(data)) return data.data;
    if (isPending(data) && data.data != null) return data.data;
    return onElse();
  };

const toNullable = <E, A>(data: RemoteRQ<E, A>): A | null => {
  if (isSuccess(data)) return data.data;
  if (isPending(data) && data.data != null) return data.data;
  return null;
};

const fromOption = <E, A>(option: Option<A>, onNone: Lazy<E>): RemoteRQ<E, A> => {
  if (isNone(option)) return failure(onNone());
  return success(option.value);
};

const toOption = <E, A>(data: RemoteRQ<E, A>): Option<A> => {
  if (isSuccess(data)) return some(data.data);
  if (isPending(data) && data.data != null) return some(data.data);
  return none;
};

const fromEither = <E, A>(ea: Either<E, A>): RemoteRQ<E, A> =>
  isLeft(ea) ? failure(ea.left) : success(ea.right);

const toEither =
  <E, A>(onInitial: Lazy<E>, onPending: Lazy<E>) =>
  (data: RemoteRQ<E, A>): Either<E, A> => {
    if (isInitial(data)) return left(onInitial());
    if (isPending(data) && data.data != null) return right(data.data);
    if (isPending(data)) return left(onPending());
    if (isSuccess(data)) return right(data.data);
    return left(data.error);
  };

const chain =
  <E, A, B>(f: (a: A) => RemoteRQ<E, B>) =>
  (data: RemoteRQ<E, A>): RemoteRQ<E, B> => {
    if (isSuccess(data)) return f(data.data);
    if (isPending(data) && data.data != null) return f(data.data);
    return data as RemoteRQ<E, B>;
  };

const fromQuery = <E, A>(query: UseQueryResult<A, E>): RemoteRQ<E, A> => query;

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

export const remoteDataRQ = {
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
  data: RemoteRQ<E, A>;
  failure?: ReactNode;
  initial?: ReactNode;
  pending?: ReactNode;
  pendingWithData?: (data: A) => ReactNode;
  success: (data: A) => ReactNode;
};

export const RenderRemoteRQ = <E, A>({
  data,
  pending = null,
  pendingWithData = () => pending,
  failure = null,
  initial = null,
  success,
}: RenderRemoteRQProps<E, A>): JSX.Element =>
  createElement(
    Fragment,
    null,
    pipe(
      data,
      remoteDataRQ.fold(
        () => initial,
        optionFold(() => pending, pendingWithData),
        () => failure,
        success,
      ),
    ),
  );
