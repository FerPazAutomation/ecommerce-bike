import { useCallback, useEffect, useMemo, useState } from "react";
import { getLandingTestimonials } from "../data/landingTestimonials";

const AUTO_MS = 7000;

type Props = {
  categorySlug: string;
};

export function LandingTestimonialCarousel({ categorySlug }: Props) {
  const items = useMemo(() => getLandingTestimonials(categorySlug), [categorySlug]);
  const [index, setIndex] = useState(0);

  const len = items.length;
  const safeIndex = len ? index % len : 0;
  const current = items[safeIndex];

  const go = useCallback(
    (delta: number) => {
      if (!len) return;
      setIndex((i) => (i + delta + len) % len);
    },
    [len],
  );

  useEffect(() => {
    if (len <= 1) return;
    const t = window.setInterval(() => go(1), AUTO_MS);
    return () => window.clearInterval(t);
  }, [len, go, categorySlug]);

  if (!len || !current) return null;

  return (
    <div className="landing-testimonial-carousel" aria-labelledby="landing-testimonials-heading">
      <div className="landing-testimonial-carousel__head">
        <h3 className="landing-testimonial-carousel__title" id="landing-testimonials-heading">
          Lo que dicen quienes ya eligieron
        </h3>
        <div className="landing-testimonial-carousel__stars" aria-hidden>
          {"★★★★★"}
        </div>
      </div>

      <div className="landing-testimonial-carousel__viewport">
        <blockquote className="landing-testimonial-carousel__quote" key={`${categorySlug}-${safeIndex}`}>
          <p>{current.quote}</p>
          <footer>
            <cite className="landing-testimonial-carousel__author">{current.author}</cite>
            <span className="landing-testimonial-carousel__detail">{current.detail}</span>
          </footer>
        </blockquote>

        <div className="landing-testimonial-carousel__controls">
          <button
            type="button"
            className="landing-testimonial-carousel__btn"
            onClick={() => go(-1)}
            aria-label="Comentario anterior"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="landing-testimonial-carousel__dots" role="tablist" aria-label="Seleccionar comentario">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                className={`landing-testimonial-carousel__dot ${i === safeIndex ? "is-active" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Comentario ${i + 1} de ${len}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="landing-testimonial-carousel__btn"
            onClick={() => go(1)}
            aria-label="Siguiente comentario"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
