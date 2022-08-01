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
    onError: (e: E) => B,
    onSuccess: (a: A) => B,
  ) =>
  (data: RemoteRQ<E, A>): B => {
    if (isInitial(data)) return onInitial();
    if (isFailure(data)) return onError(data.error);
    if (isSuccess(data)) return onSuccess(data.data);
    return onPending(fromNullable(data.data));
  };

const getOrElse =
  <A, E>(onElse: Lazy<A>) =>
  (data: RemoteRQ<E, A>) =>
    isSuccess(data) ? data.data : onElse();

const toNullable = <E, A>(ma: RemoteRQ<E, A>): A | null => (isSuccess(ma) ? ma.data : null);

const fromOption = <E, A>(option: Option<A>, error: Lazy<E>): RemoteRQ<E, A> => {
  if (isNone(option)) return failure(error());
  return success(option.value);
};

const toOption = <E, A>(data: RemoteRQ<E, A>): Option<A> =>
  isSuccess(data) ? some(data.data) : none;

const fromEither = <E, A>(ea: Either<E, A>): RemoteRQ<E, A> =>
  isLeft(ea) ? failure(ea.left) : success(ea.right);

const toEither =
  <E, A>(onInitial: Lazy<E>, onPending: Lazy<E>) =>
  (data: RemoteRQ<E, A>) => {
    if (isInitial(data)) return onInitial();
    if (isPending(data) && data.data != null) return right(data.data);
    if (isPending(data)) return onPending();
    if (isSuccess(data)) return right(data.data);
    return left(data.error);
  };

const chain = <E, A, B>(fa: RemoteRQ<E, A>, f: (a: A) => RemoteRQ<E, B>): RemoteRQ<E, B> => {
  if (isSuccess(fa)) return f(fa.data);
  if (isPending(fa) && fa.data != null) return f(fa.data);
  return fa as RemoteRQ<E, B>;
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

  const pendingDataCount = list.filter((el) => isPending(el) && el.data != null).length;
  if (pendingDataCount === list.length) return pending(list.map(({ data }) => data));

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
  const tupleSequenced: RemoteRQ<any, any> = sequenceT(...list);

  if (isSuccess(tupleSequenced))
    return success(entries.reduce((acc, [key, el]) => ({ ...acc, [key]: el.data }), {}));

  if (isPending(tupleSequenced) && tupleSequenced.data != null)
    return pending(
      entries.reduce(
        (acc, [key, el]) => ({
          ...acc,
          [key]: el.data,
        }),
        {},
      ),
    );

  if (isPending(tupleSequenced)) return pending();

  if (isFailure(tupleSequenced)) return tupleSequenced;

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
  error?: ReactNode;
  initial?: ReactNode;
  pending?: ReactNode;
  pendingWithData?: (data: A) => ReactNode;
  success: (data: A) => ReactNode;
};

export const RenderRemoteRQ = <E, A>({
  data,
  pending = null,
  pendingWithData = () => pending,
  error = null,
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
        () => error,
        success,
      ),
    ),
  );
