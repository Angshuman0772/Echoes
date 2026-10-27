import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Mood colors drive the whole app: hero dots, entry dots, chips, heatmap, retrospective.
const MOODS = {
  glow: { label: "Glow", color: "#F2B84B" },
  tide: { label: "Tide", color: "#5BB8C9" },
  bloom: { label: "Bloom", color: "#E58FB0" },
  moss: { label: "Moss", color: "#8DBF8A" },
  ember: { label: "Ember", color: "#E2674F" },
};

// Where the dots sit along the hero thread (0 to 1) and what they say.
const HERO_STOPS = [
  { at: 0.12, mood: "tide", label: "Dreams" },
  { at: 0.38, mood: "bloom", label: "Sunset Lover" },
  { at: 0.62, mood: "glow", label: "Holocene" },
  { at: 0.86, mood: "ember", label: "Your next song" },
];

// Replace with data from your Express API.
const SAMPLE_ENTRIES = [
  {
    id: 1,
    song: "Dreams",
    artist: "Fleetwood Mac",
    mood: "tide",
    date: "Oct 24",
    note: "Played on repeat during the long bus ride back after exams.",
  },
  {
    id: 2,
    song: "Sunset Lover",
    artist: "Petit Biscuit",
    mood: "bloom",
    date: "Oct 19",
    note: "Rooftop, golden hour, nobody talking. It was enough.",
  },
  {
    id: 3,
    song: "Holocene",
    artist: "Bon Iver",
    mood: "glow",
    date: "Oct 11",
    note: "First quiet morning in weeks. Felt like starting over.",
  },
  {
    id: 4,
    song: "Mr. Brightside",
    artist: "The Killers",
    mood: "ember",
    date: "Oct 02",
    note: "Hostel night, everyone screaming the chorus off-key.",
  },
];

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function HomePage() {
  const root = useRef(null);
  const extraRef = useRef(null);
  const capsuleCover = useRef(null);

  const [entries, setEntries] = useState(SAMPLE_ENTRIES);
  const [form, setForm] = useState({ song: "", note: "", mood: "glow" });
  const [opened, setOpened] = useState(false);

  // ---------- Page-load sequence + scroll thread ----------
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const path = root.current.querySelector("#thread-path");
        const len = path.getTotalLength();

        // Place each stop on the path
        const stops = gsap.utils.toArray(".hero-stop");
        stops.forEach((el, i) => {
          const p = path.getPointAtLength(len * HERO_STOPS[i].at);
          gsap.set(el, { x: p.x, y: p.y });
        });

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
        gsap.utils.toArray(".hero-dot").forEach((dot, i) => {
          tl.from(
            dot,
            {
              scale: 0,
              transformOrigin: "50% 50%",
              duration: 0.8,
              ease: "back.out(2.4)",
            },
            0.3 + draw * HERO_STOPS[i].at,
          );
        });

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
        ).from(
          ".composer",
          { opacity: 0, y: 24, duration: 1, ease: "power3.out" },
          1.4,
        );

        // Slow idle drift so the thread feels alive, not static.
        gsap.to(".hero-dot", {
          y: "+=7",
          duration: 3.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          stagger: { each: 0.5, from: "random" },
          delay: 4,
        });

        // The vertical thread fills as you scroll the entries.
        gsap.fromTo(
          ".thread-fill",
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: "top center",
            ease: "none",
            scrollTrigger: {
              trigger: ".entries",
              start: "top 60%",
              end: "bottom 70%",
              scrub: 0.6,
            },
          },
        );

        // Each dot lights up with its mood color when the thread reaches it.
        gsap.utils.toArray(".entry").forEach((el) => {
          const dot = el.querySelector(".entry-dot");
          gsap.fromTo(
            dot,
            { scale: 0.6, backgroundColor: "#3A3358" },
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
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  // Recalculate scroll positions when entries are added.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [entries.length]);

  // ---------- Interactions (respond to the user's actions) ----------
  const expandComposer = () => {
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

  const save = (e) => {
    e.preventDefault();
    if (!form.song.trim()) return;
    // TODO: POST /api/entries, then prepend the saved entry returned by the server.
    setEntries((list) => [
      {
        id: Date.now(),
        song: form.song,
        artist: "",
        mood: form.mood,
        date: "Today",
        note: form.note,
      },
      ...list,
    ]);
    setForm({ song: "", note: "", mood: form.mood });
  };

  return (
    <div
      ref={root}
      className="echoes-page"
    >
      {/* Navigation: three pages total. Swap <a> for react-router <Link>. */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <a href="/" className="display-serif text-xl">
          Echoes
        </a>
        <nav className="site-nav flex gap-6 text-sm">
          <a href="/" className="is-active">
            Home
          </a>
          <a
            href="/timeline"
          >
            Timeline
          </a>
          <a
            href="/retrospective"
          >
            Retrospective
          </a>
        </nav>
      </header>

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
            stroke="#E9E4F5"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {HERO_STOPS.map((s) => (
            <g key={s.label} className="hero-stop">
              <circle className="hero-dot" r="11" fill={MOODS[s.mood].color} />
              <text
                className="hero-label"
                y="-24"
                textAnchor="middle"
                fontSize="17"
                fill="#A59FC0"
              >
                {s.label}
              </text>
            </g>
          ))}
        </svg>
      </section>

      {/* Composer: the note is the star, the song is the key */}
      <section className="mx-auto max-w-3xl px-6 py-10">
        <form
          onSubmit={save}
          className="composer surface-card p-6 sm:p-8"
        >
          <label htmlFor="song" className="sr-only">
            Song
          </label>
          <input
            id="song"
            value={form.song}
            onChange={(e) => setForm({ ...form, song: e.target.value })}
            onFocus={expandComposer}
            placeholder="What are you listening to?"
            className="composer-input"
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
                aria-label="Mood"
              >
                {Object.entries(MOODS).map(([key, m]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={form.mood === key}
                    onClick={(e) => pickMood(e, key)}
                    className="rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#E9E4F5]"
                    style={{
                      backgroundColor:
                        form.mood === key ? m.color : "transparent",
                      color: form.mood === key ? "#1F1A33" : "#E9E4F5",
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
                className="button-primary px-5 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E9E4F5]"
              >
                Save entry
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Time capsule: resurfaces an old entry, opens on click */}
      <section className="mx-auto max-w-3xl px-6 pb-14">
        <div className="surface-card relative overflow-hidden">
          <div className="p-6 sm:p-8">
            <p className="text-muted text-sm">One year ago today</p>
            <p className="serif-title mt-2">Night Changes</p>
            <p className="text-subtle mt-3 max-w-prose leading-relaxed">
              Drove home with the windows down. Didn't know yet how much would
              change by this time next year.
            </p>
          </div>
          <button
            ref={capsuleCover}
            onClick={openCapsule}
            aria-label="Open this memory"
            className="capsule-cover absolute inset-0 flex flex-col items-start justify-center gap-1 p-6 text-left sm:p-8"
          >
            <span className="display-serif text-2xl">
              A memory is waiting
            </span>
            <span className="text-sm">Tap to open</span>
          </button>
        </div>
      </section>

      {/* Recent entries on a thread that fills as you scroll */}
      <section className="mx-auto max-w-3xl px-6 pb-32">
        <h2 className="display-serif text-3xl">Recently</h2>

        <div className="entries relative mt-10 pl-10">
          <div className="thread-line absolute left-2.75 top-2 bottom-2 w-0.5" />
          <div className="thread-fill absolute left-2.75 top-2 bottom-2 w-0.5" />

          <ul className="space-y-12">
            {entries.map((e) => (
              <li key={e.id} className="entry relative">
                <span
                  className="entry-dot absolute -left-10 top-1.5"
                  data-color={MOODS[e.mood].color}
                  style={{ backgroundColor: MOODS[e.mood].color }}
                />
                <p className="text-muted text-sm">{e.date}</p>
                <p className="display-serif mt-1 text-2xl">
                  {e.song}
                  {e.artist && (
                    <span className="text-muted text-base">
                      {" "}
                      by {e.artist}
                    </span>
                  )}
                </p>
                {e.note && (
                  <p className="text-subtle mt-2 max-w-prose leading-relaxed">
                    {e.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <a
          href="/timeline"
          className="button-outline mt-14 px-5 py-2"
        >
          See the full timeline
        </a>
      </section>
    </div>
  );
}
