import { useState, type CSSProperties } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: "eager" | "lazy";
  /** URL si `src` falla (404/red). Debe ser estable (p. ej. picsum con seed). */
  fallbackSrc: string;
};

/**
 * Imagen con respaldo: rutas locales rotas o CDNs caídos no dejan el layout en blanco.
 */
export function FallbackImage({ src, alt, className, style, loading, fallbackSrc }: Props) {
  const [useFallback, setUseFallback] = useState(false);
  const effective = useFallback ? fallbackSrc : src;
  return (
    <img
      className={className}
      style={style}
      src={effective}
      alt={alt}
      loading={loading}
      onError={() => setUseFallback(true)}
      decoding="async"
    />
  );
}
