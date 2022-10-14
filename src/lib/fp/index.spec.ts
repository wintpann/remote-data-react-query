import { remote, RemoteData } from './index';
import { either, option } from 'fp-ts';

const MOCK = {
  INITIAL_VALUE: 0,
  SUCCESS_VALUE: 1,
  FAILURE_VALUE: 2,
  PENDING_VALUE: 3,
  ELSE_VALUE: 4,
};

const expectRemoteEqual = <
  A extends RemoteData<unknown, unknown>,
  B extends RemoteData<unknown, unknown>,
>(
  a: A,
  b: B,
) => {
  expect(a.data).toStrictEqual(b.data);
  expect(a.status).toEqual(b.status);
  expect(a.fetchStatus).toEqual(b.fetchStatus);
  expect(a.error).toStrictEqual(b.error);
};

const setup = () => {
  const initial: RemoteData<number, number> = remote.initial;
  const pending: RemoteData<number, number> = remote.pending();
  const refetching: RemoteData<number, number> = remote.pending(MOCK.PENDING_VALUE);
  const failure: RemoteData<number, number> = remote.failure(MOCK.FAILURE_VALUE);
  const success: RemoteData<number, number> = remote.success(MOCK.SUCCESS_VALUE);

  return { initial, pending, refetching, failure, success };
};

const removeFn = remote.initial.remove;
const refetchFn = remote.initial.refetch;

describe('remote-data-react-query', () => {
  it('should have correct initial object', () => {
    expect(remote.initial).toStrictEqual({
      data: undefined,
      status: 'loading',
      fetchStatus: 'idle',
      error: null,
      remove: removeFn,
      refetch: refetchFn,
    });
  });

  it('should have correct pending factory', () => {
    expect(remote.pending()).toStrictEqual({
      status: 'loading',
      fetchStatus: 'fetching',
      error: null,
      data: undefined,
      remove: removeFn,
      refetch: refetchFn,
    });

    expect(remote.pending(MOCK.PENDING_VALUE)).toStrictEqual({
      status: 'loading',
      fetchStatus: 'fetching',
      error: null,
      data: MOCK.PENDING_VALUE,
      remove: removeFn,
      refetch: refetchFn,
    });
  });

  it('should have correct failure factory', () => {
    expect(remote.failure(MOCK.FAILURE_VALUE)).toStrictEqual({
      status: 'error',
      fetchStatus: 'idle',
      error: MOCK.FAILURE_VALUE,
      data: undefined,
      remove: removeFn,
      refetch: refetchFn,
    });
  });

  it('should have correct success factory', () => {
    expect(remote.success(MOCK.SUCCESS_VALUE)).toStrictEqual({
      status: 'success',
      fetchStatus: 'idle',
      error: null,
      data: MOCK.SUCCESS_VALUE,
      remove: removeFn,
      refetch: refetchFn,
    });
  });

  it('should have correct type guards', () => {
    const { initial, pending, failure, success } = setup();

    expect(remote.isInitial(initial)).toBe(true);
    expect(remote.isPending(pending)).toBe(true);
    expect(remote.isFailure(failure)).toBe(true);
    expect(remote.isSuccess(success)).toBe(true);

    expect(remote.isPending(initial)).toBe(false);
    expect(remote.isFailure(initial)).toBe(false);
    expect(remote.isSuccess(initial)).toBe(false);

    expect(remote.isInitial(pending)).toBe(false);
    expect(remote.isFailure(pending)).toBe(false);
    expect(remote.isSuccess(pending)).toBe(false);

    expect(remote.isInitial(failure)).toBe(false);
    expect(remote.isPending(failure)).toBe(false);
    expect(remote.isSuccess(failure)).toBe(false);

    expect(remote.isInitial(success)).toBe(false);
    expect(remote.isPending(success)).toBe(false);
    expect(remote.isFailure(success)).toBe(false);
  });

  it('should run map correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();
    const map = remote.map((a: number) => a * 2);

    expect(map(initial)).toStrictEqual(remote.initial);
    expect(map(pending)).toStrictEqual(remote.pending());
    expect(map(failure)).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));
    expect(map(success)).toStrictEqual(remote.success(MOCK.SUCCESS_VALUE * 2));
    expect(map(refetching)).toStrictEqual(remote.pending(MOCK.PENDING_VALUE * 2));
  });

  it('should run fold correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();
    const fold = remote.fold(
      () => 'initial',
      option.fold(
        () => 'pending_with_no_data',
        () => 'pending_with_data',
      ),
      () => 'failure',
      () => 'success',
    );

    expect(fold(initial)).toBe('initial');
    expect(fold(pending)).toBe('pending_with_no_data');
    expect(fold(refetching)).toBe('pending_with_data');
    expect(fold(failure)).toBe('failure');
    expect(fold(success)).toBe('success');
  });

  it('should run getOrElse correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();
    const orElse = remote.getOrElse(() => MOCK.ELSE_VALUE);

    expect(orElse(initial)).toBe(MOCK.ELSE_VALUE);
    expect(orElse(pending)).toBe(MOCK.ELSE_VALUE);
    expect(orElse(refetching)).toBe(MOCK.PENDING_VALUE);
    expect(orElse(failure)).toBe(MOCK.ELSE_VALUE);
    expect(orElse(success)).toBe(MOCK.SUCCESS_VALUE);
  });

  it('should run toNullable correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();
    expect(remote.toNullable(initial)).toBe(null);
    expect(remote.toNullable(pending)).toBe(null);
    expect(remote.toNullable(refetching)).toBe(MOCK.PENDING_VALUE);
    expect(remote.toNullable(failure)).toBe(null);
    expect(remote.toNullable(success)).toBe(MOCK.SUCCESS_VALUE);
  });

  it('should run fromOption correctly', () => {
    const onNone = () => MOCK.FAILURE_VALUE;

    expect(remote.fromOption(option.some(MOCK.SUCCESS_VALUE), onNone)).toStrictEqual(
      remote.success(MOCK.SUCCESS_VALUE),
    );
    expect(remote.fromOption(option.none, onNone)).toStrictEqual(
      remote.failure(MOCK.FAILURE_VALUE),
    );
  });

  it('should run toOption correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();
    expect(remote.toOption(initial)).toStrictEqual(option.none);
    expect(remote.toOption(pending)).toStrictEqual(option.none);
    expect(remote.toOption(refetching)).toStrictEqual(option.some(MOCK.PENDING_VALUE));
    expect(remote.toOption(failure)).toStrictEqual(option.none);
    expect(remote.toOption(success)).toStrictEqual(option.some(MOCK.SUCCESS_VALUE));
  });

  it('should run fromEither correctly', () => {
    expect(remote.fromEither(either.right(MOCK.SUCCESS_VALUE))).toStrictEqual(
      remote.success(MOCK.SUCCESS_VALUE),
    );
    expect(remote.fromEither(either.left(MOCK.FAILURE_VALUE))).toStrictEqual(
      remote.failure(MOCK.FAILURE_VALUE),
    );
  });

  it('should run toEither correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();

    const toEither = remote.toEither(
      () => MOCK.INITIAL_VALUE,
      () => MOCK.PENDING_VALUE,
    );

    expect(toEither(initial)).toStrictEqual(either.left(MOCK.INITIAL_VALUE));
    expect(toEither(pending)).toStrictEqual(either.left(MOCK.PENDING_VALUE));
    expect(toEither(refetching)).toStrictEqual(either.right(MOCK.PENDING_VALUE));
    expect(toEither(failure)).toStrictEqual(either.left(MOCK.FAILURE_VALUE));
    expect(toEither(success)).toStrictEqual(either.right(MOCK.SUCCESS_VALUE));
  });

  it('should run chain correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();

    const chain = remote.chain<number, number, number>((a: number) => remote.success(a * 2));

    expectRemoteEqual(chain(initial), remote.initial);
    expectRemoteEqual(chain(pending), remote.pending());
    expectRemoteEqual(chain(refetching), remote.success(MOCK.PENDING_VALUE * 2));
    expectRemoteEqual(chain(failure), remote.failure(MOCK.FAILURE_VALUE));
    expectRemoteEqual(chain(success), remote.success(MOCK.SUCCESS_VALUE * 2));
  });

  it('should run sequence correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();

    const sequenceSuccess = remote.sequence(success, success);
    expectRemoteEqual(sequenceSuccess, remote.success([MOCK.SUCCESS_VALUE, MOCK.SUCCESS_VALUE]));

    const sequenceSuccessPendingWithData = remote.sequence(success, refetching);
    expectRemoteEqual(
      sequenceSuccessPendingWithData,
      remote.pending([MOCK.SUCCESS_VALUE, MOCK.PENDING_VALUE]),
    );

    const sequenceSuccessPending = remote.sequence(success, pending);
    expectRemoteEqual(sequenceSuccessPending, remote.pending());

    const sequenceSuccessInitial = remote.sequence(success, initial);
    expectRemoteEqual(sequenceSuccessInitial, remote.initial);

    const sequenceSuccessFailure = remote.sequence(success, failure);
    expectRemoteEqual(sequenceSuccessFailure, remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePending = remote.sequence(failure, pending);
    expectRemoteEqual(sequenceFailurePending, remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePendingWithData = remote.sequence(failure, refetching);
    expectRemoteEqual(sequenceFailurePendingWithData, remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureInitial = remote.sequence(failure, initial);
    expectRemoteEqual(sequenceFailureInitial, remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureFailure = remote.sequence(failure, failure);
    expectRemoteEqual(sequenceFailureFailure, remote.failure(MOCK.FAILURE_VALUE));

    const sequencePendingInitial = remote.sequence(pending, initial);
    expectRemoteEqual(sequencePendingInitial, remote.pending());

    const sequencePendingWithDataInitial = remote.sequence(refetching, initial);
    expectRemoteEqual(sequencePendingWithDataInitial, remote.pending());

    const sequenceInitialInitial = remote.sequence(initial, initial);
    expectRemoteEqual(sequenceInitialInitial, remote.initial);
  });

  it('should run combine correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();

    const sequenceSuccess = remote.combine({ one: success, two: success });
    expectRemoteEqual(
      sequenceSuccess,
      remote.success({ one: MOCK.SUCCESS_VALUE, two: MOCK.SUCCESS_VALUE }),
    );

    const sequenceSuccessPendingWithData = remote.combine({
      one: success,
      two: refetching,
    });
    expectRemoteEqual(
      sequenceSuccessPendingWithData,
      remote.pending({
        one: MOCK.SUCCESS_VALUE,
        two: MOCK.PENDING_VALUE,
      }),
    );

    const sequenceSuccessPending = remote.combine({ one: success, two: pending });
    expectRemoteEqual(sequenceSuccessPending, remote.pending());

    const sequenceSuccessInitial = remote.combine({ one: success, two: initial });
    expectRemoteEqual(sequenceSuccessInitial, remote.initial);

    const sequenceSuccessFailure = remote.combine({ one: success, two: failure });
    expectRemoteEqual(sequenceSuccessFailure, remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePending = remote.combine({ one: failure, two: pending });
    expectRemoteEqual(sequenceFailurePending, remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePendingWithData = remote.combine({
      one: failure,
      two: refetching,
    });
    expectRemoteEqual(sequenceFailurePendingWithData, remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureInitial = remote.combine({ one: failure, two: initial });
    expectRemoteEqual(sequenceFailureInitial, remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureFailure = remote.combine({ one: failure, two: failure });
    expectRemoteEqual(sequenceFailureFailure, remote.failure(MOCK.FAILURE_VALUE));

    const sequencePendingInitial = remote.combine({ one: pending, two: initial });
    expectRemoteEqual(sequencePendingInitial, remote.pending());

    const sequencePendingWithDataInitial = remote.combine({
      one: refetching,
      two: initial,
    });
    expectRemoteEqual(sequencePendingWithDataInitial, remote.pending());

    const sequenceInitialInitial = remote.combine({ one: initial, two: initial });
    expectRemoteEqual(sequenceInitialInitial, remote.initial);
  });
});
