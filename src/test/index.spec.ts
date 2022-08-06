import { remoteRQ, RemoteRQ } from '../core';
import { either, option } from 'fp-ts';

const MOCK = {
  INITIAL_VALUE: 0,
  SUCCESS_VALUE: 1,
  FAILURE_VALUE: 2,
  PENDING_VALUE: 3,
  ELSE_VALUE: 4,
};

const setup = () => {
  const initial: RemoteRQ<number, number> = remoteRQ.initial;
  const pending: RemoteRQ<number, number> = remoteRQ.pending();
  const refetching: RemoteRQ<number, number> = remoteRQ.pending(MOCK.PENDING_VALUE);
  const failure: RemoteRQ<number, number> = remoteRQ.failure(MOCK.FAILURE_VALUE);
  const success: RemoteRQ<number, number> = remoteRQ.success(MOCK.SUCCESS_VALUE);

  return { initial, pending, refetching, failure, success };
};

describe('remote-data-react-query', () => {
  it('should have correct initial object', () => {
    expect(remoteRQ.initial).toStrictEqual({
      data: undefined,
      status: 'loading',
      fetchStatus: 'idle',
      error: null,
    });
  });

  it('should have correct pending factory', () => {
    expect(remoteRQ.pending()).toStrictEqual({
      status: 'loading',
      fetchStatus: 'fetching',
      error: null,
      data: undefined,
    });

    expect(remoteRQ.pending(MOCK.PENDING_VALUE)).toStrictEqual({
      status: 'loading',
      fetchStatus: 'fetching',
      error: null,
      data: MOCK.PENDING_VALUE,
    });
  });

  it('should have correct failure factory', () => {
    expect(remoteRQ.failure(MOCK.FAILURE_VALUE)).toStrictEqual({
      status: 'error',
      fetchStatus: 'idle',
      error: MOCK.FAILURE_VALUE,
      data: undefined,
    });
  });

  it('should have correct success factory', () => {
    expect(remoteRQ.success(MOCK.SUCCESS_VALUE)).toStrictEqual({
      status: 'success',
      fetchStatus: 'idle',
      error: null,
      data: MOCK.SUCCESS_VALUE,
    });
  });

  it('should have correct type guards', () => {
    const { initial, pending, failure, success } = setup();

    expect(remoteRQ.isInitial(initial)).toBe(true);
    expect(remoteRQ.isPending(pending)).toBe(true);
    expect(remoteRQ.isFailure(failure)).toBe(true);
    expect(remoteRQ.isSuccess(success)).toBe(true);

    expect(remoteRQ.isPending(initial)).toBe(false);
    expect(remoteRQ.isFailure(initial)).toBe(false);
    expect(remoteRQ.isSuccess(initial)).toBe(false);

    expect(remoteRQ.isInitial(pending)).toBe(false);
    expect(remoteRQ.isFailure(pending)).toBe(false);
    expect(remoteRQ.isSuccess(pending)).toBe(false);

    expect(remoteRQ.isInitial(failure)).toBe(false);
    expect(remoteRQ.isPending(failure)).toBe(false);
    expect(remoteRQ.isSuccess(failure)).toBe(false);

    expect(remoteRQ.isInitial(success)).toBe(false);
    expect(remoteRQ.isPending(success)).toBe(false);
    expect(remoteRQ.isFailure(success)).toBe(false);
  });

  it('should run map correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();
    const map = remoteRQ.map((a: number) => a * 2);

    expect(map(initial)).toStrictEqual(remoteRQ.initial);
    expect(map(pending)).toStrictEqual(remoteRQ.pending());
    expect(map(failure)).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));
    expect(map(success)).toStrictEqual(remoteRQ.success(MOCK.SUCCESS_VALUE * 2));
    expect(map(refetching)).toStrictEqual(remoteRQ.pending(MOCK.PENDING_VALUE * 2));
  });

  it('should run fold correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();
    const fold = remoteRQ.fold(
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
    const orElse = remoteRQ.getOrElse(() => MOCK.ELSE_VALUE);

    expect(orElse(initial)).toBe(MOCK.ELSE_VALUE);
    expect(orElse(pending)).toBe(MOCK.ELSE_VALUE);
    expect(orElse(refetching)).toBe(MOCK.PENDING_VALUE);
    expect(orElse(failure)).toBe(MOCK.ELSE_VALUE);
    expect(orElse(success)).toBe(MOCK.SUCCESS_VALUE);
  });

  it('should run toNullable correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();
    expect(remoteRQ.toNullable(initial)).toBe(null);
    expect(remoteRQ.toNullable(pending)).toBe(null);
    expect(remoteRQ.toNullable(refetching)).toBe(MOCK.PENDING_VALUE);
    expect(remoteRQ.toNullable(failure)).toBe(null);
    expect(remoteRQ.toNullable(success)).toBe(MOCK.SUCCESS_VALUE);
  });

  it('should run fromOption correctly', () => {
    const onNone = () => MOCK.FAILURE_VALUE;

    expect(remoteRQ.fromOption(option.some(MOCK.SUCCESS_VALUE), onNone)).toStrictEqual(
      remoteRQ.success(MOCK.SUCCESS_VALUE),
    );
    expect(remoteRQ.fromOption(option.none, onNone)).toStrictEqual(
      remoteRQ.failure(MOCK.FAILURE_VALUE),
    );
  });

  it('should run toOption correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();
    expect(remoteRQ.toOption(initial)).toStrictEqual(option.none);
    expect(remoteRQ.toOption(pending)).toStrictEqual(option.none);
    expect(remoteRQ.toOption(refetching)).toStrictEqual(option.some(MOCK.PENDING_VALUE));
    expect(remoteRQ.toOption(failure)).toStrictEqual(option.none);
    expect(remoteRQ.toOption(success)).toStrictEqual(option.some(MOCK.SUCCESS_VALUE));
  });

  it('should run fromEither correctly', () => {
    expect(remoteRQ.fromEither(either.right(MOCK.SUCCESS_VALUE))).toStrictEqual(
      remoteRQ.success(MOCK.SUCCESS_VALUE),
    );
    expect(remoteRQ.fromEither(either.left(MOCK.FAILURE_VALUE))).toStrictEqual(
      remoteRQ.failure(MOCK.FAILURE_VALUE),
    );
  });

  it('should run toEither correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();

    const toEither = remoteRQ.toEither(
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

    const chain = remoteRQ.chain<number, number, number>((a: number) => remoteRQ.success(a * 2));

    expect(chain(initial)).toStrictEqual(remoteRQ.initial);
    expect(chain(pending)).toStrictEqual(remoteRQ.pending());
    expect(chain(refetching)).toStrictEqual(remoteRQ.success(MOCK.PENDING_VALUE * 2));
    expect(chain(failure)).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));
    expect(chain(success)).toStrictEqual(remoteRQ.success(MOCK.SUCCESS_VALUE * 2));
  });

  it('should run sequenceT correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();

    const sequenceSuccess = remoteRQ.sequenceT(success, success);
    expect(sequenceSuccess).toStrictEqual(
      remoteRQ.success([MOCK.SUCCESS_VALUE, MOCK.SUCCESS_VALUE]),
    );

    const sequenceSuccessPendingWithData = remoteRQ.sequenceT(success, refetching);
    expect(sequenceSuccessPendingWithData).toStrictEqual(
      remoteRQ.pending([MOCK.SUCCESS_VALUE, MOCK.PENDING_VALUE]),
    );

    const sequenceSuccessPending = remoteRQ.sequenceT(success, pending);
    expect(sequenceSuccessPending).toStrictEqual(remoteRQ.pending());

    const sequenceSuccessInitial = remoteRQ.sequenceT(success, initial);
    expect(sequenceSuccessInitial).toStrictEqual(remoteRQ.initial);

    const sequenceSuccessFailure = remoteRQ.sequenceT(success, failure);
    expect(sequenceSuccessFailure).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePending = remoteRQ.sequenceT(failure, pending);
    expect(sequenceFailurePending).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePendingWithData = remoteRQ.sequenceT(failure, refetching);
    expect(sequenceFailurePendingWithData).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureInitial = remoteRQ.sequenceT(failure, initial);
    expect(sequenceFailureInitial).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureFailure = remoteRQ.sequenceT(failure, failure);
    expect(sequenceFailureFailure).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));

    const sequencePendingInitial = remoteRQ.sequenceT(pending, initial);
    expect(sequencePendingInitial).toStrictEqual(remoteRQ.pending());

    const sequencePendingWithDataInitial = remoteRQ.sequenceT(refetching, initial);
    expect(sequencePendingWithDataInitial).toStrictEqual(remoteRQ.pending());

    const sequenceInitialInitial = remoteRQ.sequenceT(initial, initial);
    expect(sequenceInitialInitial).toStrictEqual(remoteRQ.initial);
  });

  it('should run sequenceS correctly', () => {
    const { initial, pending, refetching, failure, success } = setup();

    const sequenceSuccess = remoteRQ.sequenceS({ one: success, two: success });
    expect(sequenceSuccess).toStrictEqual(
      remoteRQ.success({ one: MOCK.SUCCESS_VALUE, two: MOCK.SUCCESS_VALUE }),
    );

    const sequenceSuccessPendingWithData = remoteRQ.sequenceS({
      one: success,
      two: refetching,
    });
    expect(sequenceSuccessPendingWithData).toStrictEqual(
      remoteRQ.pending({
        one: MOCK.SUCCESS_VALUE,
        two: MOCK.PENDING_VALUE,
      }),
    );

    const sequenceSuccessPending = remoteRQ.sequenceS({ one: success, two: pending });
    expect(sequenceSuccessPending).toStrictEqual(remoteRQ.pending());

    const sequenceSuccessInitial = remoteRQ.sequenceS({ one: success, two: initial });
    expect(sequenceSuccessInitial).toStrictEqual(remoteRQ.initial);

    const sequenceSuccessFailure = remoteRQ.sequenceS({ one: success, two: failure });
    expect(sequenceSuccessFailure).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePending = remoteRQ.sequenceS({ one: failure, two: pending });
    expect(sequenceFailurePending).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePendingWithData = remoteRQ.sequenceS({
      one: failure,
      two: refetching,
    });
    expect(sequenceFailurePendingWithData).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureInitial = remoteRQ.sequenceS({ one: failure, two: initial });
    expect(sequenceFailureInitial).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureFailure = remoteRQ.sequenceS({ one: failure, two: failure });
    expect(sequenceFailureFailure).toStrictEqual(remoteRQ.failure(MOCK.FAILURE_VALUE));

    const sequencePendingInitial = remoteRQ.sequenceS({ one: pending, two: initial });
    expect(sequencePendingInitial).toStrictEqual(remoteRQ.pending());

    const sequencePendingWithDataInitial = remoteRQ.sequenceS({
      one: refetching,
      two: initial,
    });
    expect(sequencePendingWithDataInitial).toStrictEqual(remoteRQ.pending());

    const sequenceInitialInitial = remoteRQ.sequenceS({ one: initial, two: initial });
    expect(sequenceInitialInitial).toStrictEqual(remoteRQ.initial);
  });
});
