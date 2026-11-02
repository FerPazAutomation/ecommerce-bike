import { OUT_OF_STOCK_LABEL } from "../lib/stock";

type Props = {
  label?: string;
  className?: string;
};

/** Etiqueta de stock con texto visible: no depende solo del color (lectores de pantalla y escala de grises). */
export function StockBadge({ label = OUT_OF_STOCK_LABEL, className }: Props) {
  return <span className={["badge", "badge--stock", className].filter(Boolean).join(" ")}>{label}</span>;
}
