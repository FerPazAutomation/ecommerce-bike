import { useQuery } from "@tanstack/react-query";
import { type ReactNode, type Ref, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { ProductSuggestionsResponse } from "../types";

type Props = {
  value: string;
  onChange: (v: string) => void;
  /** Tras elegir sugerencia o cerrar (header). */
  onDone?: () => void;
  variant: "header" | "page";
  extraActions?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
};

export function ProductSearchField({ value, onChange, onDone, variant, extraActions, inputRef }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const debounced = useDebouncedValue(value.trim(), 280);

  const { data: suggestions, isFetching, isFetched } = useQuery({
    queryKey: ["product-suggestions", debounced],
    queryFn: () =>
      apiFetch<ProductSuggestionsResponse>(
        `/products/suggestions?q=${encodeURIComponent(debounced)}`,
        { auth: false },
      ),
    enabled: debounced.length >= 2,
    staleTime: 20_000,
  });

  const items = suggestions?.items ?? [];
  const showList =
    suggestOpen &&
    debounced.length >= 2 &&
    (isFetching || items.length > 0 || (isFetched && !isFetching));

  return (
    <div
      ref={wrapRef}
      className={`product-search-wrap product-search-wrap--${variant}`}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) {
          setSuggestOpen(false);
        }
      }}
    >
      <div className="product-search-row">
        <input
          ref={inputRef ?? undefined}
          className="input"
          placeholder={variant === "header" ? "Buscar…" : "Buscar en la tienda…"}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSuggestOpen(true);
          }}
          onFocus={() => setSuggestOpen(true)}
          aria-label="Buscar productos"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={showList ? "product-search-suggest-list" : undefined}
        />
        {extraActions}
      </div>
      {showList && (
        <ul
          id="product-search-suggest-list"
          className="product-search-suggestions"
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {isFetching && items.length === 0 ? (
            <li className="product-search-suggestions__hint">Buscando…</li>
          ) : null}
          {!isFetching && isFetched && items.length === 0 ? (
            <li className="product-search-suggestions__hint">Sin coincidencias</li>
          ) : null}
          {items.map((item) => (
            <li key={item.slug} role="option">
              <Link
                to={`/productos/${item.slug}`}
                className="product-search-suggestions__link"
                onClick={() => {
                  setSuggestOpen(false);
                  onDone?.();
                }}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
