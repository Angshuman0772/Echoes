import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { getEntries } from "../api/entry";
import Navbar from "../components/Navbar";

gsap.registerPlugin(useGSAP);

export default function Timeline() {
  const root = useRef(null);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getEntries()
      .then((data) => {
        if (active) setEntries(data);
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

  useGSAP(
    () => {
      if (isLoading) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.timeline().from(".hero-line", {
          yPercent: 110,
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.14,
        });
      });

      return () => mm.revert();
    },
    {
      scope: root,
      dependencies: [isLoading],
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

        {!error && entries.length > 0 && <section></section>}
      </main>
    </div>
  );
}
