import { useCallback, useEffect, useRef, useState } from "react";

/** Watches an element; fires `on` once when it enters the viewport. */
export function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, on };
}

/**
 * Scroll-scrub driver for the exploded sequence.
 * Writes a single CSS var (--p, 0..1) onto the stage element every frame —
 * the parts' CSS computes their own transforms from it, so React never
 * re-renders during scrubbing. Phase changes are reported as state.
 */
export function useExplodeScroll<T extends HTMLElement>(phases: number) {
  const trackRef = useRef<T | null>(null); // tall scroll track
  const stageRef = useRef<HTMLDivElement | null>(null); // sticky stage
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [settled, setSettled] = useState(false);
  const raf = useRef(0);

  const update = useCallback(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;
    const rect = track.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
    stage.style.setProperty("--p", p.toFixed(4));
    setPhase(Math.min(phases - 1, Math.floor(p * phases)));
    setSettled(p > 0.965);
    setProgress((prev) => (Math.abs(prev - p) > 0.002 ? p : prev));
  }, [phases]);

  useEffect(() => {
    const loop = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", loop, { passive: true });
    window.addEventListener("resize", loop);
    return () => {
      window.removeEventListener("scroll", loop);
      window.removeEventListener("resize", loop);
      cancelAnimationFrame(raf.current);
    };
  }, [update]);

  return { trackRef, stageRef, phase, progress, settled };
}

/** Live HH:MM:SS clock for the "last synced" readout. */
export function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Count-up that starts when `active` flips true. */
export function useCountUp(target: number, active: boolean, duration = 1400, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const k = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setVal(+(target * eased).toFixed(decimals));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration, decimals]);
  return val;
}

/**
 * Scrollytelling driver.
 * Watches a list of step elements and reports which one owns the
 * reading-line (a band around 45% of the viewport height). Used by the
 * Machine section so the sticky diagram follows the prose.
 */
export function useScrollSteps(count: number) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const setRef = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      refs.current[i] = el;
    },
    []
  );

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const line = window.innerHeight * 0.45;
      let best = 0;
      let bestDist = Infinity;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const centre = r.top + r.height / 2;
        const dist = Math.abs(centre - line);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive((prev) => (prev === best ? prev : best));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [count]);

  return { setRef, active };
}

/** Track which section id is currently in view (for nav highlighting). */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-38% 0px -55% 0px" }
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [ids]);
  return active;
}
