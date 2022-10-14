import { PlainSimple } from './stories/simple/plain';
import { RemoteSimple } from './stories/simple/remote';
import { PlainMapped } from './stories/mapped/plain';
import { RemoteMapped } from './stories/mapped/remote';
import { RemoteCombinedAndMapped } from './stories/combined-and-mapped/remote';
import { PlainCombinedAndMapped } from './stories/combined-and-mapped/plain';
import './style.scss';

export const stories = {
  PlainSimple,
  RemoteSimple,
  PlainMapped,
  RemoteMapped,
  PlainCombinedAndMapped,
  RemoteCombinedAndMapped,
} as const;
