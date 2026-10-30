import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { getEntries } from "../api/entry";
import Navbar from "../components/Navbar";
import { MOODS } from "../constants/moods";

gsap.registerPlugin(useGSAP);

const getId = (entry) => entry.id ?? entry._id;

const ROW_H = 150; // distance between rows
const R = ROW_H / 2; // curve radius
const LINE_Y = 8; // y position of the line inside each row

// Dots to be displayed based on the browser width
function useColumns() {
  const get = () =>
    window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 3 : 1;
  const [cols, setCols] = useState(get);
  useEffect(() => {
    const onResize = () => setCols(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return cols;
}

function chunk(arr, size) {
  const rows = [];
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
  return rows;
}

// Generate the SVG path; straight rows joined by semicircles.
function buildPath(rows, cols, W) {
  if (!W || rows.length === 0) return { d: "", height: 0 };

  const slot = W / cols;
  const last = rows.length - 1;

  let d = `M 0 ${LINE_Y}`;
  rows.forEach((row, i) => {
    const y = LINE_Y + i * ROW_H;
    const reversed = i % 2 === 1;
    if (i < last) {
      const endX = reversed ? 0 : W;
      d += ` L ${endX} ${y} A ${R} ${R} 0 0 ${reversed ? 0 : 1} ${endX} ${y + ROW_H}`;
    } else {
      // last row stops at its final dot
      const reach = (row.length - 0.5) * slot;
      d += ` L ${reversed ? W - reach : reach} ${y}`;
    }
  });

  return { d, height: last * ROW_H + LINE_Y + 2 };
}

export default function Timeline() {
  const root = useRef(null);
  const wrapRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let active = true;

    getEntries()
      .then((data) => active && setEntries(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setIsLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const cols = useColumns();
  const rows = chunk(entries, cols);
  const hasEntries = entries.length > 0;

  // measure the timeline width so the path matches the layout
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [isLoading, hasEntries, error]);

  const { d, height } = buildPath(rows, cols, width);
  const ready = width > 0;

  // Hero text
  useGSAP(
    () => {
      if (isLoading) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-line", {
          yPercent: 110,
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.14,
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [isLoading], revertOnUpdate: true },
  );

  // Dots bloom in, text fades in right after
  useGSAP(
    () => {
      if (isLoading || !ready) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ delay: 0.9 }); // let the hero land first

        tl.from(".snake-dot", {
          scale: 0,
          duration: 0.7,
          ease: "back.out(2.4)",
          stagger: 0.18,
        });

        tl.from(
          ".snake-text",
          {
            opacity: 0,
            y: 16,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.18,
          },
          0.15,
        );
      });
      return () => mm.revert();
    },
    {
      scope: root,
      dependencies: [isLoading, ready, cols, entries.length],
      revertOnUpdate: true,
    },
  );

  if (isLoading) {
    return <div ref={root} className="echoes-page" />;
  }

  return (
    <div ref={root} className="echoes-page">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 pt-10 pb-6">
        {/* Hero */}
        <section className="timeline-hero">
          <h1 className="display-serif mt-4 text-5xl leading-[1.08] sm:text-7xl">
            <span className="block overflow-hidden pb-1">
              <span className="hero-line block">Every song</span>
            </span>
            <span className="block overflow-hidden pb-2">
              <span className="hero-line block">leaves an echo.</span>
            </span>
          </h1>
          <div className="overflow-hidden">
            <p className="hero-line hero-subtitle display-serif text-accent mt-6 max-w-lg text-lg leading-relaxed">
              A place for the songs that carried a feeling, marked a season, or
              stayed with you long after they ended.
            </p>
          </div>
        </section>

        {error && (
          <p role="alert" className="mt-10 text-sm text-red-300">
            {error}
          </p>
        )}

        {!error && entries.length === 0 && (
          <div className="surface-card mt-16 p-8">
            <p className="display-serif text-2xl">Your timeline is waiting.</p>
            <p className="text-subtle mt-3 leading-relaxed">
              Return home to save the first song that belongs here.
            </p>
            <a href="/" className="button-outline mt-6 px-5 py-2">
              Add an entry
            </a>
          </div>
        )}

        {/* Timeline */}
        {!error && entries.length > 0 && (
          <section className="mt-16 pb-24" style={{ paddingInline: R }}>
            <div ref={wrapRef} className="relative">
              <svg
                className="pointer-events-none absolute left-0 top-0 overflow-visible"
                width={width}
                height={height}
                aria-hidden="true"
              >
                <path d={d} className="thread" />
              </svg>

              {rows.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className={`relative flex ${rowIdx % 2 ? "flex-row-reverse" : "flex-row"}`}
                  style={
                    rowIdx < rows.length - 1 ? { height: ROW_H } : undefined
                  }
                >
                  {row.map((e) => (
                    <div
                      key={getId(e)}
                      className="relative flex-none px-3 text-center"
                      style={{
                        width: `${100 / cols}%`,
                        paddingTop: LINE_Y + 20,
                      }}
                    >
                      {/* wrapper centers the dot; the inner dot is what GSAP scales */}
                      <span
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ top: LINE_Y }}
                      >
                        <span
                          className="entry-dot snake-dot block"
                          style={{
                            backgroundColor: MOODS[e.mood]?.color || "#3A3358",
                          }}
                        />
                      </span>

                      <div className="snake-text">
                        <p className="text-muted text-sm">{e.date}</p>
                        <p className="display-serif mt-1 text-xl">{e.song}</p>
                        {e.artist && (
                          <p className="text-muted text-sm">by {e.artist}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
