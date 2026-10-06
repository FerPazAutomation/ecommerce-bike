/**
 * Formateo único de precios. La API envía montos como string (Decimal): "689.00", "0".
 * Mostrar siempre los totales que calcula la API (`line_total`, `subtotal`, `total_amount`).
 */

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string): Intl.NumberFormat {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("es-AR", { style: "currency", currency });
    formatters.set(currency, formatter);
  }
  return formatter;
}

export function formatPrice(amount: string | number, currency = "usd"): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) return String(amount);
  const code = currency.toUpperCase();
  try {
    return formatterFor(code).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}
