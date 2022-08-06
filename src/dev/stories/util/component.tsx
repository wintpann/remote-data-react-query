import React, { FC } from 'react';

export const Success: FC<{ data: any }> = ({ data }) => (
  <div className="rq-success">
    <div className="rq-title">success</div>
    {JSON.stringify(data, null, 2)}
  </div>
);

export const Refetching: FC<{ data: any }> = ({ data }) => (
  <div className="rq-pending">
    <div className="rq-title">refetching...</div>
    {JSON.stringify(data, null, 2)}
  </div>
);

export const Failure = (e: Error) => (
  <div className="rq-failure">
    <div className="rq-title">failure</div>
    {e.message}
  </div>
);

export const Pending = (
  <div className="rq-pending">
    <div className="rq-title">pending...</div>
  </div>
);

export const Initial = (
  <div className="rq-initial">
    <div className="rq-title">initial...</div>
  </div>
);
