# ADT compatible with useQuery from '@tanstack/react-query'

## Prerequisites:
* Basic knowledge of FP approach
* UseQuery hook from [react-query](https://github.com/tanstack/query)

## Prior art:
* [@devexperts/remote-data-ts](https://github.com/devexperts/remote-data-ts)
* [Slaying a UI Antipattern with Flow](https://medium.com/@gcanti/slaying-a-ui-antipattern-with-flow-5eed0cfb627b)

## Installation
`yarn add remote-data-react-query`

## Lite version

There are 3 versions of this package, first one is BASED on [fp-ts](https://github.com/gcanti/fp-ts). Use this version if you already use fp-ts in your project
> import { remote, RemoteData } from 'react-query-remote-data';

More expected, you don't use fp-ts yet, in that case import lite version without fp-ts peer dependency
> import { remote, RemoteData } from 'react-query-remote-data/lite';

And a lite version for `react-query@3`
> import { remote, RemoteData } from 'react-query-remote-data/v3lite';

## Guide
Check out examples in this repo at `src/dev/stories` for comparison with classic approach.


## Usage example
```typescript jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { remote, RemoteData, RenderRemote } from 'remote-data-react-query/lite';

type User = { name: string; phone: string };

export const UsageExample = () => {
    const user: RemoteData<Error, User> = useQuery(['user'], () =>
        fetch(`https://jsonplaceholder.typicode.com/users/1`).then(res => res.json()),
    );

    const userPhone = remote.pipe(
        user,
        remote.map((user) => user.phone),
    );

    return (
        <RenderRemote
            data={userPhone}
            success={(phone) => <div>{phone}</div>}
            refetching={(phone) => <div>{phone} refreshing...</div>}
            failure={(e) => <div>failed to fetch {e.message}</div>}
            pending={<div>just pending</div>}
            initial={<div>initial</div>}
        />
    );
};
```

## [Lite API](https://github.com/wintpann/remote-data-react-query/blob/main/API.lite.md)
## [Lite API for react-query@3](https://github.com/wintpann/remote-data-react-query/blob/main/API.v3lite.md)
## [Normal API](https://github.com/wintpann/remote-data-react-query/blob/main/API.md)

## CHANGELOG

### 0.0.1 `06.08.2022`
* Initial release

### 0.0.2 `07.08.2022`
* Updated readme

### 1.0.0 `30.08.2022`
* Removed RQ suffix
* Removed useless generics (i.e. `getOrElse<E, A> -> getOrElse<A>`)
* Renamed sequenceS -> combine
* Renamed sequenceT -> sequence
* Fixed fp-ts peer import
* Added mapLeft

### 1.1.0 `14.10.2022`
* Added `remove` and `refetch` methods to RemoteData
* Added lite version (if you don't use fp-ts)

### 1.2.0 `16.10.2022`
* Added lite version `react-query@3`