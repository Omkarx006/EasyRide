import { memo, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TABS, tabIndex } from '../lib/tabs';
import useIsMobile from '../lib/useIsMobile';

// Horizontal screen switching for the four main mobile pages.
//
// It is a *presentation* layer on top of the existing React Router setup — every
// screen change still goes through the router (so the URL, links and the browser
// Back/Forward buttons keep working exactly as before). The only thing this adds
// is that during a change BOTH screens are mounted for one animation, sliding
// past each other, instead of one being swapped out instantly.
//
// How the two screens co-exist: <Routes location={...}> matches (and scopes
// useLocation for) whatever location it is handed, so we can render the outgoing
// location in one pane and the incoming one in another. Panes are keyed by path,
// so React keeps a screen's component instance — and its state — when the pane
// list shrinks back to one at the end of the slide.
//
// Gesture rules (see the axis lock in onTouchMove): a touch only becomes a page
// swipe when it is clearly horizontal, and never when it starts on a form field,
// a button/link, selected text, or inside a modal. Vertical scrolling is left
// entirely to the browser (`touch-action: pan-y pinch-zoom`).

const DURATION = 280; // ms — one slide
const EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
const AXIS_LOCK = 12; // px of travel before we decide the gesture's direction
const AXIS_RATIO = 1.4; // horizontal must beat vertical by this much to navigate
const COMMIT_RATIO = 0.28; // drag this share of the width and the page changes
const FLICK_VELOCITY = 0.45; // px/ms — a quick flick changes page at any distance

// A drag that starts on any of these never turns into navigation.
const NO_SWIPE =
  'input,textarea,select,button,a,label,[role="button"],[contenteditable],[data-no-swipe]';

// Minimal Location object; enough for <Routes location> to match a path.
function locationFor(pathname) {
  return { pathname, search: '', hash: '', state: null, key: 'swipe' };
}

// Freeze the document while two screens are on top of each other. Both elements
// are flagged because <html> owns the scrolling here (index.css sets overflow-x
// on it), so locking <body> alone would not hold the page still.
function setSwiping(on) {
  document.documentElement.classList.toggle('is-swiping', on);
  document.body.classList.toggle('is-swiping', on);
}

// Memoised so that dragging (which re-renders this component on every touchmove)
// never re-renders the page inside a pane.
const Pane = memo(function Pane({ loc, render }) {
  return render(loc);
});

export default function SwipePages({ render }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const deckRef = useRef(null);
  const gestureRef = useRef(null);
  const timerRef = useRef(0);
  const rafRef = useRef(0);
  const restoreScrollRef = useRef(null);
  // The location React Router had on the previous render (the outgoing screen).
  const lastLocationRef = useRef(location);

  // mode: 'idle' | 'enter' (two panes parked, no transition) | 'drag' | 'run'
  const [state, setState] = useState(() => ({ mode: 'idle', syncPath: location.pathname }));

  // --- React to a location change that did NOT come from a finger -----------
  // Done during render (not in an effect) so the outgoing screen is never
  // unmounted for a frame before the slide starts.
  if (location.pathname !== state.syncPath) {
    const from = tabIndex(state.syncPath);
    const to = tabIndex(location.pathname);
    const animate = isMobile && state.mode === 'idle' && from >= 0 && to >= 0;

    if (animate) {
      setState({
        mode: 'enter',
        syncPath: location.pathname,
        fromPath: state.syncPath,
        fromLoc: lastLocationRef.current,
        toPath: location.pathname,
        toLoc: location,
        dir: to > from ? 1 : -1,
        dx: 0,
        scrollY: window.scrollY,
        commit: true,
      });
    } else {
      setState({ mode: 'idle', syncPath: location.pathname });
    }
  }

  useLayoutEffect(() => {
    lastLocationRef.current = location;
  });

  // --- Drive each phase of the slide ---------------------------------------
  // Depends on the mode only: `state` here is the render in which the mode
  // changed, which already carries the final direction / commit decision.
  const mode = state.mode;
  useLayoutEffect(() => {
    if (mode === 'idle') {
      // Restore before unflagging: `is-swiping` also turns off the smooth
      // scrolling from index.css, so this jump is instant.
      if (restoreScrollRef.current !== null) {
        window.scrollTo(0, restoreScrollRef.current);
        restoreScrollRef.current = null;
      }
      setSwiping(false);
      return undefined;
    }

    setSwiping(true);

    if (mode === 'enter') {
      // Park both panes, then flip to their final positions on the next frame so
      // the browser has something to animate from.
      window.scrollTo(0, 0);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() =>
          setState((s) => (s.mode === 'enter' ? { ...s, mode: 'run' } : s)),
        );
      });
      return () => cancelAnimationFrame(rafRef.current);
    }

    if (mode === 'run') {
      timerRef.current = window.setTimeout(() => {
        if (state.commit && state.toPath) {
          // The router is already on the new screen — just drop the old pane.
          setState({ mode: 'idle', syncPath: state.toPath });
        } else {
          // Cancelled swipe — put the screen back exactly where it was.
          restoreScrollRef.current = state.scrollY;
          setState({ mode: 'idle', syncPath: state.fromPath });
        }
      }, DURATION);
      return () => clearTimeout(timerRef.current);
    }

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Leave the document in a sane state if we unmount mid-slide.
  useLayoutEffect(
    () => () => {
      setSwiping(false);
      clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  // --- Touch handling -------------------------------------------------------
  const canSwipe = isMobile && tabIndex(location.pathname) >= 0;

  function beginDrag(dir, startX) {
    const g = gestureRef.current;
    const target = tabIndex(location.pathname) + dir;
    const edge = target < 0 || target >= TABS.length;

    g.dir = dir;
    g.edge = edge;
    g.xLock = startX;
    g.width = deckRef.current?.offsetWidth || window.innerWidth;

    const scrollY = window.scrollY;
    setSwiping(true); // freezes the document (and its smooth scrolling) first
    window.scrollTo(0, 0);
    setState({
      mode: 'drag',
      syncPath: location.pathname,
      fromPath: location.pathname,
      fromLoc: location,
      toPath: edge ? null : TABS[target].path,
      toLoc: edge ? null : locationFor(TABS[target].path),
      dir,
      dx: 0,
      scrollY,
      commit: false,
    });
  }

  function onTouchStart(e) {
    // Another finger arriving mid-slide must not disturb the one in progress.
    if (state.mode !== 'idle') return;
    gestureRef.current = null;
    if (!canSwipe) return;
    if (e.touches.length !== 1) return;
    // A modal is open (they lock the page) — never navigate underneath it.
    if (document.body.style.overflow === 'hidden') return;
    if (e.target instanceof Element && e.target.closest(NO_SWIPE)) return;
    const selection = window.getSelection?.();
    if (selection && !selection.isCollapsed) return;

    const touch = e.touches[0];
    gestureRef.current = {
      x0: touch.clientX,
      y0: touch.clientY,
      axis: null,
      dx: 0,
      prevX: touch.clientX,
      prevT: performance.now(),
      vel: 0,
    };
  }

  function onTouchMove(e) {
    const g = gestureRef.current;
    if (!g || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - g.x0;
    const dy = touch.clientY - g.y0;

    if (!g.axis) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
      // Not clearly horizontal? Hand the gesture back to the browser for good —
      // this is what keeps vertical scrolling of ride cards untouched.
      if (Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) {
        gestureRef.current = null;
        return;
      }
      g.axis = 'x';
      beginDrag(dx < 0 ? 1 : -1, touch.clientX);
      return;
    }

    let offset = touch.clientX - g.xLock;
    // Only ever move towards the screen we committed to at axis-lock time.
    offset = g.dir === 1 ? Math.min(0, offset) : Math.max(0, offset);
    if (g.edge) offset /= 4; // nothing beyond the first/last screen — rubber band
    else offset = Math.max(-g.width, Math.min(g.width, offset));

    const now = performance.now();
    if (now > g.prevT) g.vel = (touch.clientX - g.prevX) / (now - g.prevT);
    g.prevX = touch.clientX;
    g.prevT = now;
    g.dx = offset;
    setState((s) => (s.mode === 'drag' ? { ...s, dx: offset } : s));
  }

  function onTouchEnd() {
    const g = gestureRef.current;
    gestureRef.current = null;
    if (!g || g.axis !== 'x') return;
    const distance = Math.abs(g.dx);
    const flick = Math.abs(g.vel) > FLICK_VELOCITY && Math.sign(g.vel) === -g.dir && distance > 24;
    const commit = !g.edge && (distance > g.width * COMMIT_RATIO || flick);
    setState((s) =>
      s.mode === 'drag'
        ? { ...s, mode: 'run', commit, syncPath: commit ? s.toPath : s.fromPath }
        : s,
    );
    // Hand the URL over now, while the screens are still sliding: the router (and
    // with it the highlighted bottom-bar icon) updates the moment you let go.
    if (commit && state.toPath) navigate(state.toPath);
  }

  // --- Render ---------------------------------------------------------------
  const sliding = state.mode !== 'idle';
  let panes;

  if (sliding) {
    const running = state.mode === 'run';
    const transition = running ? `transform ${DURATION}ms ${EASING}` : 'none';
    const fromX = running
      ? `${state.commit ? -state.dir * 100 : 0}%`
      : `${state.dx}px`;
    const toX = running
      ? `${state.commit ? 0 : state.dir * 100}%`
      : `calc(${state.dx}px + ${state.dir * 100}%)`;

    panes = [
      {
        key: state.fromPath,
        loc: state.fromLoc,
        offset: state.scrollY,
        style: { transform: `translate3d(${fromX}, 0, 0)`, transition },
      },
    ];
    if (state.toPath) {
      panes.push({
        key: state.toPath,
        loc: state.toLoc,
        offset: 0,
        style: { transform: `translate3d(${toX}, 0, 0)`, transition },
      });
    }
  } else {
    panes = [{ key: location.pathname, loc: location, offset: 0, style: undefined }];
  }

  return (
    <div
      ref={deckRef}
      className={`relative w-full ${sliding ? 'h-[100dvh] overflow-hidden' : ''}`}
      style={canSwipe ? { touchAction: 'pan-y pinch-zoom' } : undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {panes.map((pane) => (
        <div
          key={pane.key}
          className={sliding ? 'absolute inset-0 overflow-hidden will-change-transform' : ''}
          style={pane.style}
        >
          {/* Keeps the outgoing screen showing the slice the user was actually
              looking at, even though the document itself is back at the top. */}
          <div style={pane.offset ? { marginTop: -pane.offset } : undefined}>
            <Pane loc={pane.loc} render={render} />
          </div>
        </div>
      ))}
    </div>
  );
}
