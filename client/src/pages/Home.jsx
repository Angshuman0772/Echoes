import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { createEntry, getEntries } from "../api/entry";
import Navbar from "../components/Navbar";
import { MOODS } from "../constants/moods";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Where database entries sit along the hero thread (0 to 1).
const HERO_POSITIONS = [0.12, 0.38, 0.62, 0.86];

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// MongoDB documents come back with `_id`; support both shapes.
const getId = (entry) => entry.id ?? entry._id;

// Place each hero stop on the thread path. Single source of truth for positioning.
function positionStops(container, positions) {
  if (!container) return;
  const path = container.querySelector("#thread-path");
  if (!path) return;

  const length = path.getTotalLength();
  const stops = container.querySelectorAll(".hero-stop");

  stops.forEach((stop, index) => {
    if (positions[index] === undefined) return;
    const point = path.getPointAtLength(length * positions[index]);
    gsap.set(stop, { x: point.x, y: point.y });
  });
}

export default function HomePage() {
  const root = useRef(null);
  const extraRef = useRef(null);
  const capsuleCover = useRef(null);

  const [entries, setEntries] = useState([]);
  const [capsuleEntry, setCapsuleEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    song: "",
    artist: "",
    note: "",
    mood: "joyful",
  });
  const [opened, setOpened] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const heroStops = entries
    .slice(0, HERO_POSITIONS.length)
    .map((entry, index) => ({
      ...entry,
      at: HERO_POSITIONS[index],
    }));

  // --------- Load entries from the database ----------
  useEffect(() => {
    let active = true;

    getEntries()
      .then((data) => {
        if (active) {
          setEntries(data);
          setCapsuleEntry(
            data[Math.floor(Math.random() * data.length)] || null,
          );
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // ---------- Page-load sequence (plays once, after loading finishes) ----------
  useGSAP(
    () => {
      if (isLoading) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const path = root.current.querySelector("#thread-path");
        if (!path) return;
        const len = path.getTotalLength();

        positionStops(root.current, HERO_POSITIONS);

        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

        // The one big moment: headline rises, the thread draws, dots bloom along it.
        const draw = 2.8;
        const tl = gsap.timeline();
        tl.from(".hero-line", {
          yPercent: 110,
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.14,
        }).to(
          path,
          { strokeDashoffset: 0, duration: draw, ease: "sine.inOut" },
          0.3,
        );

        // Each dot blooms as the thread passes its position.
        const dots = gsap.utils.toArray(".hero-dot");
        dots.forEach((dot, i) => {
          const at = HERO_POSITIONS[i];
          if (at === undefined) return;
          tl.from(
            dot,
            {
              scale: 0,
              transformOrigin: "50% 50%",
              duration: 0.8,
              ease: "back.out(2.4)",
            },
            0.3 + draw * at,
          );
        });

        if (root.current.querySelector(".hero-label")) {
          tl.from(
            ".hero-label",
            {
              opacity: 0,
              y: 8,
              duration: 0.8,
              ease: "power2.out",
              stagger: 0.25,
            },
            1.2,
          );
        }

        tl.from(
          ".composer",
          { opacity: 0, y: 24, duration: 1, ease: "power3.out" },
          1.4,
        );

        // Slow idle drift so the thread feels alive, not static.
        if (dots.length) {
          gsap.to(dots, {
            y: "+=7",
            duration: 3.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            stagger: { each: 0.5, from: "random" },
            delay: 4,
          });
        }
      });

      return () => mm.revert();
    },
    {
      scope: root,
      // Only the loading flag: saving an entry must not replay the intro.
      dependencies: [isLoading],
      revertOnUpdate: true,
    },
  );

  // ---------- Entry-dependent scroll animations ----------
  useGSAP(
    () => {
      if (!entries.length) return;

      gsap.fromTo(
        ".thread-fill",
        { scaleY: 0, transformOrigin: "top center" },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".entries",
            start: "top 60%",
            end: "bottom 60%",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );

      gsap.utils.toArray(".entry").forEach((el) => {
        const dot = el.querySelector(".entry-dot");
        gsap.fromTo(
          dot,
          { scale: 0.6, backgroundColor: "#456155" },
          {
            scale: 1,
            backgroundColor: dot.dataset.color,
            duration: 0.6,
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: el,
              start: "top 65%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    },
    { scope: root, dependencies: [entries.length], revertOnUpdate: true },
  );

  // Recalculate scroll positions when entries are added.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [entries.length]);

  // --------- Keep hero stops on the thread (runs for reduced-motion users too) ----------
  useEffect(() => {
    if (isLoading || !entries.length) return;
    positionStops(root.current, HERO_POSITIONS);
  }, [entries, isLoading]);

  // --------- Hide collapsed composer fields from keyboard and screen readers ----------
  useEffect(() => {
    if (extraRef.current) extraRef.current.inert = !expanded;
  }, [expanded, isLoading]);

  // ---------- Interactions (respond to the user's actions) ----------
  const expandComposer = () => {
    if (expanded) return;
    setExpanded(true);
    gsap.to(extraRef.current, {
      height: "auto",
      opacity: 1,
      duration: reduceMotion() ? 0 : 0.7,
      ease: "power3.out",
    });
  };

  const pickMood = (e, key) => {
    setForm((f) => ({ ...f, mood: key }));
    if (!reduceMotion())
      gsap.fromTo(
        e.currentTarget,
        { scale: 0.88 },
        { scale: 1, duration: 0.5, ease: "back.out(3)" },
      );
  };

  const openCapsule = () => {
    if (opened) return;
    setOpened(true);
    gsap.to(capsuleCover.current, {
      yPercent: -101,
      duration: reduceMotion() ? 0 : 1.1,
      ease: "power3.inOut",
    });
  };

  // --------- Save a new entry to the database ----------
  const save = async (e) => {
    e.preventDefault();
    if (!form.song.trim()) return;
    setIsSaving(true);
    setError("");

    try {
      const savedEntry = await createEntry({
        song: form.song.trim(),
        artist: form.artist.trim(),
        mood: form.mood,
        note: form.note.trim(),
      });
      setEntries((list) => [savedEntry, ...list]);
      setForm({ song: "", artist: "", note: "", mood: form.mood });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div ref={root} className="echoes-page" />;
  }

  return (
    <div ref={root} className="echoes-page">
      {/* Navigation */}
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-10 pb-6">
        <h1 className="display-serif text-5xl leading-[1.08] sm:text-7xl">
          <span className="block overflow-hidden pb-1">
            <span className="hero-line block">Keep the song.</span>
          </span>
          <span className="block overflow-hidden pb-2">
            <span className="hero-line block">Keep the moment.</span>
          </span>
        </h1>

        {/* The thread: a drawn line with songs hanging along it */}
        <svg
          viewBox="0 0 1200 300"
          className="mt-8 w-full overflow-visible"
          role="img"
          aria-label="A timeline of songs linked to moods"
        >
          <path
            id="thread-path"
            d="M0,170 C150,60 260,250 420,160 S700,40 840,150 S1060,260 1200,110"
            fill="none"
            stroke="#B5C7D1"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {heroStops.map((s) => (
            <g key={getId(s)} className="hero-stop">
              <circle
                className="hero-dot"
                r="11"
                fill={MOODS[s.mood]?.color || "#456155"}
              />
              {/* Labels are hidden on small screens, where the scaled-down text is unreadable. */}
              <text
                className="hero-label hidden sm:block"
                y="-24"
                textAnchor="middle"
                fontSize="20"
                fill="#456155"
              >
                {s.song}
              </text>
            </g>
          ))}
        </svg>
      </section>

      {/* Composer */}
      <section className="mx-auto max-w-3xl px-6 py-10">
        <form onSubmit={save} className="composer surface-card p-6 sm:p-8">
          <label htmlFor="song" className="sr-only">
            Song
          </label>
          <input
            id="song"
            value={form.song}
            onChange={(e) => setForm({ ...form, song: e.target.value })}
            onFocus={expandComposer}
            placeholder="What were you listening to?"
            className="composer-input"
          />
          <label htmlFor="artist" className="sr-only">
            Artist
          </label>
          <input
            id="artist"
            value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
            onFocus={expandComposer}
            placeholder="Who was it by?"
            className="composer-note mt-2"
          />

          <div ref={extraRef} className="h-0 overflow-hidden opacity-0">
            <label htmlFor="note" className="sr-only">
              Why it matters
            </label>
            <textarea
              id="note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={4}
              placeholder="Where were you? What was happening? Why does this one matter?"
              className="composer-note mt-5"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pb-1">
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Emotion"
              >
                {Object.entries(MOODS).map(([key, m]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={form.mood === key}
                    onClick={(e) => pickMood(e, key)}
                    className="focus-ring rounded-full px-3 py-1.5 text-sm transition-colors"
                    style={{
                      backgroundColor:
                        form.mood === key ? m.color : "transparent",
                      color: form.mood === key ? "#fff" : m.color,
                      boxShadow:
                        form.mood === key
                          ? "none"
                          : `inset 0 0 0 1.5px ${m.color}`,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="button-primary focus-ring px-5 py-2"
              >
                {isSaving ? "Saving..." : "Save entry"}
              </button>
            </div>
          </div>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </section>

      {entries.length > 0 && (
        <>
          {/* Time capsule: resurfaces an old entry, opens on click.
              Guarded on capsuleEntry, which is null if the DB was empty on load. */}
          {capsuleEntry && (
            <section className="mx-auto max-w-3xl px-6 pb-14">
              <div className="surface-card relative overflow-hidden">
                <div className="p-6 sm:p-8">
                  <p className="text-accent text-sm">{capsuleEntry.date}</p>
                  <p className="serif-title mt-2">{capsuleEntry.song}</p>
                  <p className="text-accent mt-3 max-w-prose leading-relaxed">
                    {capsuleEntry.note || "No note was added for this entry."}
                  </p>
                </div>
                <button
                  ref={capsuleCover}
                  onClick={openCapsule}
                  aria-label="Open this memory"
                  aria-hidden={opened}
                  tabIndex={opened ? -1 : 0}
                  className={`capsule-cover absolute inset-0 flex flex-col items-start justify-center gap-1 p-6 text-left sm:p-8 ${
                    opened ? "pointer-events-none" : ""
                  }`}
                >
                  <span className="display-serif text-2xl">
                    A memory is waiting
                  </span>
                  <span className="text-sm">Tap to open</span>
                </button>
              </div>
            </section>
          )}

          {/* Recent entries on a thread that fills as you scroll */}
          <section className="mx-auto max-w-3xl px-6 pb-32">
            <h2 className="display-serif text-3xl">Recently</h2>

            <div className="entries relative mt-10 pl-10">
              {/* left-[11px] works on both Tailwind v3 and v4 (left-2.75 is v4 only) */}
              <div className="thread-line absolute left-2.75 top-2 bottom-2 w-0.5" />
              <div className="thread-fill absolute left-2.75 top-2 bottom-2 w-0.5" />

              <ul className="space-y-12">
                {entries.map((e) => (
                  <li key={getId(e)} className="entry relative">
                    <span
                      className="entry-dot absolute -left-10 top-1.5"
                      data-color={MOODS[e.mood]?.color || "#456155"}
                      style={{
                        backgroundColor: MOODS[e.mood]?.color || "#456155",
                      }}
                    />
                    <p className="text-accent text-sm">{e.date}</p>
                    <p className="display-serif mt-1 text-2xl">
                      {e.song}
                      {e.artist && (
                        <span className="text-accent text-base">
                          {" "}
                          by {e.artist}
                        </span>
                      )}
                    </p>
                    {e.note && (
                      <p className="text-accent mt-2 max-w-prose leading-relaxed">
                        {e.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <a href="/timeline" className="button-outline mt-14 px-5 py-2">
              See the full timeline
            </a>
          </section>
        </>
      )}
    </div>
  );
}
