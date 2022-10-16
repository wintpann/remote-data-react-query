import { PlainSimple } from './stories/simple/plain';
import { RemoteSimple } from './stories/simple/remote';
import { PlainMapped } from './stories/mapped/plain';
import { RemoteMapped } from './stories/mapped/remote';
import { RemoteCombinedAndMapped } from './stories/combined-and-mapped/remote';
import { PlainCombinedAndMapped } from './stories/combined-and-mapped/plain';
import { V3RemoteMapped } from './v3/mapped';
import { V3RemoteSimple } from './v3/simple';
import { V3RemoteCombinedAndMapped } from './v3/combined-and-mapped';
import './style.scss';

export const stories = {
  PlainSimple,
  RemoteSimple,
  PlainMapped,
  RemoteMapped,
  PlainCombinedAndMapped,
  RemoteCombinedAndMapped,
  V3RemoteMapped,
  V3RemoteSimple,
  V3RemoteCombinedAndMapped,
} as const;
