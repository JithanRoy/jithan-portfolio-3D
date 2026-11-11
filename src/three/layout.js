/**
 * Where each landmark sits relative to its stop.
 * `side` > 0 = left of the road (the rider's side), < 0 = right, 0 = spanning the road.
 * The bike pauses at stop.t; landmarks sit a few meters ahead so they're in view.
 */
import { stops } from '../route.js';
import { ahead, pointBeside, ROAD_WIDTH } from './roadPath.js';

const H = ROAD_WIDTH / 2;

export const landmarks = stops.flatMap((s) => {
  switch (s.section) {
    case 'start':
      return [{ type: 'gate', stop: s, t: ahead(s.t, 24), side: 0 }];
    case 'about':
      return [{ type: 'garage', stop: s, t: ahead(s.t, 24), side: H + 9 }];
    case 'skills':
      return [{ type: 'skills', stop: s, t: ahead(s.t, 14), side: H + 2.6 }];
    case 'projects':
      return [{ type: 'billboard', stop: s, t: ahead(s.t, 24), side: s.index % 2 ? -(H + 6.5) : H + 6.5 }];
    case 'experience':
      return [{ type: 'milestone', stop: s, t: ahead(s.t, 18), side: H + 3 }];
    case 'contact':
      return [
        { type: 'finish', stop: s, t: ahead(s.t, 26), side: 0 },
        { type: 'restStop', stop: s, t: ahead(s.t, 40), side: H + 11 },
      ];
    default:
      return [];
  }
});

/** World-space keep-out circles so trees don't grow through landmarks. */
export const keepOut = landmarks.map((l) => {
  const p = pointBeside(l.t, l.side);
  return { x: p.x, z: p.z, r: l.type === 'skills' ? 40 : 16 };
});
