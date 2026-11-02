import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { STOCK_WARNING_TEXT } from "../lib/stock";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Aviso modal cuando el pago se rechaza por falta de stock.
 * `<dialog>` nativo con `showModal()`: atrapa el foco, cierra con Escape y deja el fondo inerte.
 */
export function StockDialog({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cartLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cartLinkRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog ref={dialogRef} className="landing-gate-dialog stock-dialog" aria-labelledby="stock-dialog-title" onClose={onClose}>
      <h2 id="stock-dialog-title" className="landing-gate-dialog__title">
        Sin stock suficiente
      </h2>
      <p className="landing-gate-dialog__text">{STOCK_WARNING_TEXT}</p>
      <div className="landing-gate-dialog__actions">
        <Link ref={cartLinkRef} to="/carrito" className="btn">
          Ir al carrito
        </Link>
        <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current?.close()}>
          Cerrar
        </button>
      </div>
    </dialog>
  );
}
