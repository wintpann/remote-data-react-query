import { remoteDataRQ, RemoteRQ } from '../core';
import { either, option } from 'fp-ts';

const MOCK = {
  INITIAL_VALUE: 0,
  SUCCESS_VALUE: 1,
  FAILURE_VALUE: 2,
  PENDING_VALUE: 3,
  ELSE_VALUE: 4,
};

const setup = () => {
  const initial: RemoteRQ<number, number> = remoteDataRQ.initial;
  const pending: RemoteRQ<number, number> = remoteDataRQ.pending();
  const pendingWithData: RemoteRQ<number, number> = remoteDataRQ.pending(MOCK.PENDING_VALUE);
  const failure: RemoteRQ<number, number> = remoteDataRQ.failure(MOCK.FAILURE_VALUE);
  const success: RemoteRQ<number, number> = remoteDataRQ.success(MOCK.SUCCESS_VALUE);

  return { initial, pending, pendingWithData, failure, success };
};

describe('remote-data-react-query', () => {
  it('should have correct initial object', () => {
    expect(remoteDataRQ.initial).toStrictEqual({
      data: undefined,
      status: 'loading',
      fetchStatus: 'idle',
      error: null,
    });
  });

  it('should have correct pending factory', () => {
    expect(remoteDataRQ.pending()).toStrictEqual({
      status: 'loading',
      fetchStatus: 'fetching',
      error: null,
      data: undefined,
    });

    expect(remoteDataRQ.pending(MOCK.PENDING_VALUE)).toStrictEqual({
      status: 'loading',
      fetchStatus: 'fetching',
      error: null,
      data: MOCK.PENDING_VALUE,
    });
  });

  it('should have correct failure factory', () => {
    expect(remoteDataRQ.failure(MOCK.FAILURE_VALUE)).toStrictEqual({
      status: 'error',
      fetchStatus: 'idle',
      error: MOCK.FAILURE_VALUE,
      data: undefined,
    });
  });

  it('should have correct success factory', () => {
    expect(remoteDataRQ.success(MOCK.SUCCESS_VALUE)).toStrictEqual({
      status: 'success',
      fetchStatus: 'idle',
      error: null,
      data: MOCK.SUCCESS_VALUE,
    });
  });

  it('should have correct type guards', () => {
    const { initial, pending, failure, success } = setup();

    expect(remoteDataRQ.isInitial(initial)).toBe(true);
    expect(remoteDataRQ.isPending(pending)).toBe(true);
    expect(remoteDataRQ.isFailure(failure)).toBe(true);
    expect(remoteDataRQ.isSuccess(success)).toBe(true);

    expect(remoteDataRQ.isPending(initial)).toBe(false);
    expect(remoteDataRQ.isFailure(initial)).toBe(false);
    expect(remoteDataRQ.isSuccess(initial)).toBe(false);

    expect(remoteDataRQ.isInitial(pending)).toBe(false);
    expect(remoteDataRQ.isFailure(pending)).toBe(false);
    expect(remoteDataRQ.isSuccess(pending)).toBe(false);

    expect(remoteDataRQ.isInitial(failure)).toBe(false);
    expect(remoteDataRQ.isPending(failure)).toBe(false);
    expect(remoteDataRQ.isSuccess(failure)).toBe(false);

    expect(remoteDataRQ.isInitial(success)).toBe(false);
    expect(remoteDataRQ.isPending(success)).toBe(false);
    expect(remoteDataRQ.isFailure(success)).toBe(false);
  });

  it('should run map correctly', () => {
    const { initial, pending, pendingWithData, failure, success } = setup();
    const map = remoteDataRQ.map((a: number) => a * 2);

    expect(map(initial)).toStrictEqual(remoteDataRQ.initial);
    expect(map(pending)).toStrictEqual(remoteDataRQ.pending());
    expect(map(failure)).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));
    expect(map(success)).toStrictEqual(remoteDataRQ.success(MOCK.SUCCESS_VALUE * 2));
    expect(map(pendingWithData)).toStrictEqual(remoteDataRQ.pending(MOCK.PENDING_VALUE * 2));
  });

  it('should run fold correctly', () => {
    const { initial, pending, pendingWithData, failure, success } = setup();
    const fold = remoteDataRQ.fold(
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
    expect(fold(pendingWithData)).toBe('pending_with_data');
    expect(fold(failure)).toBe('failure');
    expect(fold(success)).toBe('success');
  });

  it('should run getOrElse correctly', () => {
    const { initial, pending, pendingWithData, failure, success } = setup();
    const orElse = remoteDataRQ.getOrElse(() => MOCK.ELSE_VALUE);

    expect(orElse(initial)).toBe(MOCK.ELSE_VALUE);
    expect(orElse(pending)).toBe(MOCK.ELSE_VALUE);
    expect(orElse(pendingWithData)).toBe(MOCK.PENDING_VALUE);
    expect(orElse(failure)).toBe(MOCK.ELSE_VALUE);
    expect(orElse(success)).toBe(MOCK.SUCCESS_VALUE);
  });

  it('should run toNullable correctly', () => {
    const { initial, pending, pendingWithData, failure, success } = setup();
    expect(remoteDataRQ.toNullable(initial)).toBe(null);
    expect(remoteDataRQ.toNullable(pending)).toBe(null);
    expect(remoteDataRQ.toNullable(pendingWithData)).toBe(MOCK.PENDING_VALUE);
    expect(remoteDataRQ.toNullable(failure)).toBe(null);
    expect(remoteDataRQ.toNullable(success)).toBe(MOCK.SUCCESS_VALUE);
  });

  it('should run fromOption correctly', () => {
    const onNone = () => MOCK.FAILURE_VALUE;

    expect(remoteDataRQ.fromOption(option.some(MOCK.SUCCESS_VALUE), onNone)).toStrictEqual(
      remoteDataRQ.success(MOCK.SUCCESS_VALUE),
    );
    expect(remoteDataRQ.fromOption(option.none, onNone)).toStrictEqual(
      remoteDataRQ.failure(MOCK.FAILURE_VALUE),
    );
  });

  it('should run toOption correctly', () => {
    const { initial, pending, pendingWithData, failure, success } = setup();
    expect(remoteDataRQ.toOption(initial)).toStrictEqual(option.none);
    expect(remoteDataRQ.toOption(pending)).toStrictEqual(option.none);
    expect(remoteDataRQ.toOption(pendingWithData)).toStrictEqual(option.some(MOCK.PENDING_VALUE));
    expect(remoteDataRQ.toOption(failure)).toStrictEqual(option.none);
    expect(remoteDataRQ.toOption(success)).toStrictEqual(option.some(MOCK.SUCCESS_VALUE));
  });

  it('should run fromEither correctly', () => {
    expect(remoteDataRQ.fromEither(either.right(MOCK.SUCCESS_VALUE))).toStrictEqual(
      remoteDataRQ.success(MOCK.SUCCESS_VALUE),
    );
    expect(remoteDataRQ.fromEither(either.left(MOCK.FAILURE_VALUE))).toStrictEqual(
      remoteDataRQ.failure(MOCK.FAILURE_VALUE),
    );
  });

  it('should run toEither correctly', () => {
    const { initial, pending, pendingWithData, failure, success } = setup();

    const toEither = remoteDataRQ.toEither(
      () => MOCK.INITIAL_VALUE,
      () => MOCK.PENDING_VALUE,
    );

    expect(toEither(initial)).toStrictEqual(either.left(MOCK.INITIAL_VALUE));
    expect(toEither(pending)).toStrictEqual(either.left(MOCK.PENDING_VALUE));
    expect(toEither(pendingWithData)).toStrictEqual(either.right(MOCK.PENDING_VALUE));
    expect(toEither(failure)).toStrictEqual(either.left(MOCK.FAILURE_VALUE));
    expect(toEither(success)).toStrictEqual(either.right(MOCK.SUCCESS_VALUE));
  });

  it('should run chain correctly', () => {
    const { initial, pending, pendingWithData, failure, success } = setup();

    const chain = remoteDataRQ.chain<number, number, number>((a: number) =>
      remoteDataRQ.success(a * 2),
    );

    expect(chain(initial)).toStrictEqual(remoteDataRQ.initial);
    expect(chain(pending)).toStrictEqual(remoteDataRQ.pending());
    expect(chain(pendingWithData)).toStrictEqual(remoteDataRQ.success(MOCK.PENDING_VALUE * 2));
    expect(chain(failure)).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));
    expect(chain(success)).toStrictEqual(remoteDataRQ.success(MOCK.SUCCESS_VALUE * 2));
  });

  it('should run sequenceT correctly', () => {
    const { initial, pending, pendingWithData, failure, success } = setup();

    const sequenceSuccess = remoteDataRQ.sequenceT(success, success);
    expect(sequenceSuccess).toStrictEqual(
      remoteDataRQ.success([MOCK.SUCCESS_VALUE, MOCK.SUCCESS_VALUE]),
    );

    const sequenceSuccessPendingWithData = remoteDataRQ.sequenceT(success, pendingWithData);
    expect(sequenceSuccessPendingWithData).toStrictEqual(
      remoteDataRQ.pending([MOCK.SUCCESS_VALUE, MOCK.PENDING_VALUE]),
    );

    const sequenceSuccessPending = remoteDataRQ.sequenceT(success, pending);
    expect(sequenceSuccessPending).toStrictEqual(remoteDataRQ.pending());

    const sequenceSuccessInitial = remoteDataRQ.sequenceT(success, initial);
    expect(sequenceSuccessInitial).toStrictEqual(remoteDataRQ.initial);

    const sequenceSuccessFailure = remoteDataRQ.sequenceT(success, failure);
    expect(sequenceSuccessFailure).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePending = remoteDataRQ.sequenceT(failure, pending);
    expect(sequenceFailurePending).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePendingWithData = remoteDataRQ.sequenceT(failure, pendingWithData);
    expect(sequenceFailurePendingWithData).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureInitial = remoteDataRQ.sequenceT(failure, initial);
    expect(sequenceFailureInitial).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureFailure = remoteDataRQ.sequenceT(failure, failure);
    expect(sequenceFailureFailure).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));

    const sequencePendingInitial = remoteDataRQ.sequenceT(pending, initial);
    expect(sequencePendingInitial).toStrictEqual(remoteDataRQ.pending());

    const sequencePendingWithDataInitial = remoteDataRQ.sequenceT(pendingWithData, initial);
    expect(sequencePendingWithDataInitial).toStrictEqual(remoteDataRQ.pending());

    const sequenceInitialInitial = remoteDataRQ.sequenceT(initial, initial);
    expect(sequenceInitialInitial).toStrictEqual(remoteDataRQ.initial);
  });

  it('should run sequenceS correctly', () => {
    const { initial, pending, pendingWithData, failure, success } = setup();

    const sequenceSuccess = remoteDataRQ.sequenceS({ one: success, two: success });
    expect(sequenceSuccess).toStrictEqual(
      remoteDataRQ.success({ one: MOCK.SUCCESS_VALUE, two: MOCK.SUCCESS_VALUE }),
    );

    const sequenceSuccessPendingWithData = remoteDataRQ.sequenceS({
      one: success,
      two: pendingWithData,
    });
    expect(sequenceSuccessPendingWithData).toStrictEqual(
      remoteDataRQ.pending({
        one: MOCK.SUCCESS_VALUE,
        two: MOCK.PENDING_VALUE,
      }),
    );

    const sequenceSuccessPending = remoteDataRQ.sequenceS({ one: success, two: pending });
    expect(sequenceSuccessPending).toStrictEqual(remoteDataRQ.pending());

    const sequenceSuccessInitial = remoteDataRQ.sequenceS({ one: success, two: initial });
    expect(sequenceSuccessInitial).toStrictEqual(remoteDataRQ.initial);

    const sequenceSuccessFailure = remoteDataRQ.sequenceS({ one: success, two: failure });
    expect(sequenceSuccessFailure).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePending = remoteDataRQ.sequenceS({ one: failure, two: pending });
    expect(sequenceFailurePending).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailurePendingWithData = remoteDataRQ.sequenceS({
      one: failure,
      two: pendingWithData,
    });
    expect(sequenceFailurePendingWithData).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureInitial = remoteDataRQ.sequenceS({ one: failure, two: initial });
    expect(sequenceFailureInitial).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));

    const sequenceFailureFailure = remoteDataRQ.sequenceS({ one: failure, two: failure });
    expect(sequenceFailureFailure).toStrictEqual(remoteDataRQ.failure(MOCK.FAILURE_VALUE));

    const sequencePendingInitial = remoteDataRQ.sequenceS({ one: pending, two: initial });
    expect(sequencePendingInitial).toStrictEqual(remoteDataRQ.pending());

    const sequencePendingWithDataInitial = remoteDataRQ.sequenceS({
      one: pendingWithData,
      two: initial,
    });
    expect(sequencePendingWithDataInitial).toStrictEqual(remoteDataRQ.pending());

    const sequenceInitialInitial = remoteDataRQ.sequenceS({ one: initial, two: initial });
    expect(sequenceInitialInitial).toStrictEqual(remoteDataRQ.initial);
  });
});
