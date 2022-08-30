import { remote, RemoteData } from '../core';
import { either, option } from 'fp-ts';

const MOCK = {
  INITIAL_VALUE: 0,
  SUCCESS_VALUE: 1,
  FAILURE_VALUE: 2,
  PENDING_VALUE: 3,
  ELSE_VALUE: 4,
};

const setup = () => {
  const initial: RemoteData<number, number> = remote.initial;
  const pending: RemoteData<number, number> = remote.pending();
  const refetching: RemoteData<number, number> = remote.pending(MOCK.PENDING_VALUE);
  const failure: RemoteData<number, number> = remote.failure(MOCK.FAILURE_VALUE);
  const success: RemoteData<number, number> = remote.success(MOCK.SUCCESS_VALUE);

  return { initial, pending, refetching, failure, success };
};

describe('remote-data-react-query', () => {
  it('should have correct initial object', () => {
    expect(remote.initial).toStrictEqual({
      data: undefined,
      status: 'loading',
      fetchStatus: 'idle',
      error: null,
    });
  });

  it('should have correct pending factory', () => {
    expect(remote.pending()).toStrictEqual({
      status: 'loading',
      fetchStatus: 'fetching',
      error: null,
      data: undefined,
    });

    expect(remote.pending(MOCK.PENDING_VALUE)).toStrictEqual({
      status: 'loading',
      fetchStatus: 'fetching',
      error: null,
      data: MOCK.PENDING_VALUE,
    });
  });

  it('should have correct failure factory', () => {
    expect(remote.failure(MOCK.FAILURE_VALUE)).toStrictEqual({
      status: 'error',
      fetchStatus: 'idle',
      error: MOCK.FAILURE_VALUE,
      data: undefined,
    });
  });

  it('should have correct success factory', () => {
    expect(remote.success(MOCK.SUCCESS_VALUE)).toStrictEqual({
      status: 'success',
      fetchStatus: 'idle',
      error: null,
      data: MOCK.SUCCESS_VALUE,
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

    expect(chain(initial)).toStrictEqual(remote.initial);
    expect(chain(pending)).toStrictEqual(remote.pending());
    expect(chain(refetching)).toStrictEqual(remote.success(MOCK.PENDING_VALUE * 2));
    expect(chain(failure)).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));
    expect(chain(success)).toStrictEqual(remote.success(MOCK.SUCCESS_VALUE * 2));
  });

  it('should run sequenceT correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();

    const sequenceSuccess = remote.sequenceT(success, success);
    expect(sequenceSuccess).toStrictEqual(
      remote.success([MOCK.SUCCESS_VALUE, MOCK.SUCCESS_VALUE]),
    );

    const sequenceSuccessPendingWithData = remote.sequenceT(success, refetching);
    expect(sequenceSuccessPendingWithData).toStrictEqual(
      remote.pending([MOCK.SUCCESS_VALUE, MOCK.PENDING_VALUE]),
    );

    const sequenceSuccessPending = remote.sequenceT(success, pending);
    expect(sequenceSuccessPending).toStrictEqual(remote.pending());

    const sequenceSuccessInitial = remote.sequenceT(success, initial);
    expect(sequenceSuccessInitial).toStrictEqual(remote.initial);

    const sequenceSuccessFailure = remote.sequenceT(success, failure);
    expect(sequenceSuccessFailure).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePending = remote.sequenceT(failure, pending);
    expect(sequenceFailurePending).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePendingWithData = remote.sequenceT(failure, refetching);
    expect(sequenceFailurePendingWithData).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureInitial = remote.sequenceT(failure, initial);
    expect(sequenceFailureInitial).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureFailure = remote.sequenceT(failure, failure);
    expect(sequenceFailureFailure).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));

    const sequencePendingInitial = remote.sequenceT(pending, initial);
    expect(sequencePendingInitial).toStrictEqual(remote.pending());

    const sequencePendingWithDataInitial = remote.sequenceT(refetching, initial);
    expect(sequencePendingWithDataInitial).toStrictEqual(remote.pending());

    const sequenceInitialInitial = remote.sequenceT(initial, initial);
    expect(sequenceInitialInitial).toStrictEqual(remote.initial);
  });

  it('should run sequenceS correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();

    const sequenceSuccess = remote.sequenceS({ one: success, two: success });
    expect(sequenceSuccess).toStrictEqual(
      remote.success({ one: MOCK.SUCCESS_VALUE, two: MOCK.SUCCESS_VALUE }),
    );

    const sequenceSuccessPendingWithData = remote.sequenceS({
      one: success,
      two: refetching,
    });
    expect(sequenceSuccessPendingWithData).toStrictEqual(
      remote.pending({
        one: MOCK.SUCCESS_VALUE,
        two: MOCK.PENDING_VALUE,
      }),
    );

    const sequenceSuccessPending = remote.sequenceS({ one: success, two: pending });
    expect(sequenceSuccessPending).toStrictEqual(remote.pending());

    const sequenceSuccessInitial = remote.sequenceS({ one: success, two: initial });
    expect(sequenceSuccessInitial).toStrictEqual(remote.initial);

    const sequenceSuccessFailure = remote.sequenceS({ one: success, two: failure });
    expect(sequenceSuccessFailure).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePending = remote.sequenceS({ one: failure, two: pending });
    expect(sequenceFailurePending).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePendingWithData = remote.sequenceS({
      one: failure,
      two: refetching,
    });
    expect(sequenceFailurePendingWithData).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureInitial = remote.sequenceS({ one: failure, two: initial });
    expect(sequenceFailureInitial).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureFailure = remote.sequenceS({ one: failure, two: failure });
    expect(sequenceFailureFailure).toStrictEqual(remote.failure(MOCK.FAILURE_VALUE));

    const sequencePendingInitial = remote.sequenceS({ one: pending, two: initial });
    expect(sequencePendingInitial).toStrictEqual(remote.pending());

    const sequencePendingWithDataInitial = remote.sequenceS({
      one: refetching,
      two: initial,
    });
    expect(sequencePendingWithDataInitial).toStrictEqual(remote.pending());

    const sequenceInitialInitial = remote.sequenceS({ one: initial, two: initial });
    expect(sequenceInitialInitial).toStrictEqual(remote.initial);
  });
});
