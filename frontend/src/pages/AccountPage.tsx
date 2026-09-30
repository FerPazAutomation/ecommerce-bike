import { useMutation, useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { formatPrice } from "../lib/formatPrice";
import { PASSWORD_MIN_EXCLUSIVE } from "../lib/validation";
import type { OrderDetail, OrderSummary, UserProfile } from "../types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pagado",
  failed: "Pago fallido",
  cancelled: "Cancelado",
};

type AccountSection = "personal" | "password" | "purchases" | "help";

type TimelineStep = {
  key: string;
  label: string;
  description: string;
  state: "done" | "current" | "pending" | "error";
};

function shippingTimeline(status: string, createdAt: string): TimelineStep[] {
  const dateLabel = new Date(createdAt).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  switch (status) {
    case "pending":
      return [
        { key: "1", label: "Pedido registrado", description: dateLabel, state: "done" },
        {
          key: "2",
          label: "Pago pendiente",
          description: "Completá el pago desde el enlace de checkout.",
          state: "current",
        },
        { key: "3", label: "Preparación", description: "Se habilita al confirmar el pago.", state: "pending" },
        {
          key: "4",
          label: "Envío",
          description: "Recibirás el seguimiento cuando el paquete salga del depósito.",
          state: "pending",
        },
      ];
    case "paid":
      return [
        { key: "1", label: "Pedido registrado", description: dateLabel, state: "done" },
        { key: "2", label: "Pago confirmado", description: "El pago se acreditó correctamente.", state: "done" },
        { key: "3", label: "Preparando envío", description: "Empaquetamos tu pedido.", state: "done" },
        {
          key: "4",
          label: "En tránsito",
          description:
            "Te enviaremos el número de seguimiento por correo cuando el transportista lo asigne.",
          state: "current",
        },
        { key: "5", label: "Entrega", description: "Pendiente de recepción en la dirección indicada.", state: "pending" },
      ];
    case "failed":
      return [
        { key: "1", label: "Pedido registrado", description: dateLabel, state: "done" },
        {
          key: "2",
          label: "Pago no completado",
          description: "Podés reintentar el pago o contactarnos si el problema persiste.",
          state: "error",
        },
      ];
    case "cancelled":
      return [
        { key: "1", label: "Pedido registrado", description: dateLabel, state: "done" },
        { key: "2", label: "Pedido cancelado", description: "Este pedido ya no está activo.", state: "error" },
      ];
    default:
      return [
        { key: "1", label: "Pedido registrado", description: dateLabel, state: "done" },
        { key: "2", label: "Estado", description: status, state: "current" },
      ];
  }
}

function AccountCollapsible({
  sectionId,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  sectionId: AccountSection;
  title: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const headingId = `account-${sectionId}-heading`;
  const panelId = `account-${sectionId}-panel`;
  return (
    <section className="card account-section account-collapsible">
      <button
        type="button"
        className="account-collapsible-trigger"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        id={headingId}
      >
        <span className="account-collapsible-title-wrap">
          <span className="account-collapsible-title">{title}</span>
          {summary ? <span className="account-collapsible-sub">{summary}</span> : null}
        </span>
        <span className="account-collapsible-chevron" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <div className="account-collapsible-panel" id={panelId} role="region" aria-labelledby={headingId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function AccountPage() {
  const { token } = useAuth();
  const [detailId, setDetailId] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<Record<AccountSection, boolean>>({
    personal: false,
    password: false,
    purchases: false,
    help: false,
  });

  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");

  const toggle = (s: AccountSection) => {
    setOpenSection((o) => ({ ...o, [s]: !o[s] }));
  };

  const { data: profile, isError: profileError } = useQuery({
    queryKey: ["me", token],
    queryFn: () => apiFetch<UserProfile>("/auth/me"),
    enabled: !!token,
  });

  const { data: orders } = useQuery({
    queryKey: ["orders", "list", token],
    queryFn: () => apiFetch<OrderSummary[]>("/orders"),
    enabled: !!token,
  });

  const { data: orderDetail } = useQuery({
    queryKey: ["orders", detailId],
    queryFn: () => apiFetch<OrderDetail>(`/orders/${detailId}`),
    enabled: detailId != null,
  });

  const changePassword = useMutation({
    mutationFn: (body: { current_password: string; new_password: string }) =>
      apiFetch<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      setPwdCurrent("");
      setPwdNew("");
      setPwdConfirm("");
    },
  });

  if (profileError) {
    return (
      <div className="container account-page">
        <p className="form-alert" role="alert">
          No se pudo cargar tu cuenta. Vuelve a iniciar sesión.
        </p>
        <p>
          <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    );
  }

  const pwdMismatch = pwdNew.length > 0 && pwdNew !== pwdConfirm;
  const canSubmitPwd =
    pwdCurrent.length > 0 &&
    pwdNew.length > PASSWORD_MIN_EXCLUSIVE &&
    pwdNew === pwdConfirm &&
    !changePassword.isPending;

  return (
    <div className="container account-page">
      <h1 className="account-page-title">Mi cuenta</h1>

      <div className="account-sections-stack">
        <AccountCollapsible
          sectionId="personal"
          title="Mis datos personales"
          summary="Nombre y correo"
          open={openSection.personal}
          onToggle={() => toggle("personal")}
        >
          {profile ? (
            <dl className="account-dl">
              <div>
                <dt>Nombre</dt>
                <dd>{profile.full_name || "—"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{profile.email}</dd>
              </div>
            </dl>
          ) : (
            <p style={{ color: "var(--muted)", margin: 0 }}>Cargando…</p>
          )}
        </AccountCollapsible>

        <AccountCollapsible
          sectionId="password"
          title="Cambiar contraseña"
          summary="Actualizá tu clave de acceso"
          open={openSection.password}
          onToggle={() => toggle("password")}
        >
          <form
            className="account-password-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmitPwd || pwdMismatch) return;
              changePassword.mutate({ current_password: pwdCurrent, new_password: pwdNew });
            }}
          >
            <label className="account-field">
              <span>Contraseña actual</span>
              <input
                type="password"
                autoComplete="current-password"
                value={pwdCurrent}
                onChange={(e) => setPwdCurrent(e.target.value)}
              />
            </label>
            <label className="account-field">
              <span>Nueva contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
              />
            </label>
            <p className="account-field-hint">Más de 8 caracteres.</p>
            <label className="account-field">
              <span>Repetir nueva contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
              />
            </label>
            {pwdMismatch ? (
              <p className="account-form-error" role="alert">
                Las contraseñas nuevas no coinciden.
              </p>
            ) : null}
            {changePassword.isError ? (
              <p className="account-form-error" role="alert">
                {(changePassword.error as Error).message}
              </p>
            ) : null}
            {changePassword.isSuccess ? (
              <p className="account-form-success" role="status">
                Contraseña actualizada. Podés seguir usando la sesión actual.
              </p>
            ) : null}
            <button type="submit" className="btn" disabled={!canSubmitPwd || pwdMismatch}>
              {changePassword.isPending ? "Guardando…" : "Guardar nueva contraseña"}
            </button>
          </form>
        </AccountCollapsible>

        <AccountCollapsible
          sectionId="purchases"
          title="Mis compras"
          summary="Historial y trazabilidad de envíos"
          open={openSection.purchases}
          onToggle={() => toggle("purchases")}
        >
          <p className="account-section-lead">
            Aquí ves el historial de pedidos. Al abrir el detalle, el producto y la línea de tiempo del envío según el
            estado del pedido.
          </p>
          {!orders?.length ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Aún no tienes pedidos. <Link to="/productos">Ver tienda</Link>
            </p>
          ) : (
            <div className="account-orders">
              <div className="account-orders-scroll">
                <table className="account-orders-table">
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>
                          {new Date(o.created_at).toLocaleString("es-AR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td>{STATUS_LABEL[o.status] ?? o.status}</td>
                        <td>{formatPrice(o.total_amount, o.currency)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-ghost account-orders-detail-btn"
                            onClick={() => setDetailId((id) => (id === o.id ? null : o.id))}
                          >
                            {detailId === o.id ? "Ocultar detalle" : "Ver detalle"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {detailId != null && orderDetail && orderDetail.id === detailId && (
                <div className="account-order-detail">
                  <h3 className="account-order-detail-title">Pedido #{orderDetail.id}</h3>

                  <h4 className="account-order-subheading">Trazabilidad del envío</h4>
                  <ol className="account-shipping-timeline">
                    {shippingTimeline(orderDetail.status, orderDetail.created_at).map((step) => (
                      <li
                        key={step.key}
                        className={`account-shipping-step account-shipping-step--${step.state}`}
                      >
                        <span className="account-shipping-step-marker" aria-hidden />
                        <div className="account-shipping-step-body">
                          <span className="account-shipping-step-label">{step.label}</span>
                          <span className="account-shipping-step-desc">{step.description}</span>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <h4 className="account-order-subheading">Productos</h4>
                  <ul className="account-order-lines">
                    {orderDetail.items.map((line, i) => (
                      <li key={`${line.product_id}-${i}`}>
                        <span>{line.name}</span>
                        <span>
                          ×{line.quantity} · {formatPrice(line.unit_price, orderDetail.currency)} ·{" "}
                          {formatPrice(Number(line.unit_price) * line.quantity, orderDetail.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p style={{ margin: "0.75rem 0 0", fontWeight: 700 }}>
                    Total: {formatPrice(orderDetail.total_amount, orderDetail.currency)}
                  </p>
                </div>
              )}
            </div>
          )}
        </AccountCollapsible>

        <AccountCollapsible
          sectionId="help"
          title="Centro de ayuda"
          summary="Preguntas frecuentes y contacto"
          open={openSection.help}
          onToggle={() => toggle("help")}
        >
          <ul className="account-help-list">
            <li>
              <strong>¿Cómo compro?</strong> Elegí productos en{" "}
              <Link to="/productos">la tienda</Link>, cargá el carrito y completá el pago con Stripe.
            </li>
            <li>
              <strong>¿Olvidé mi contraseña?</strong> Usá{" "}
              <Link to="/recuperar">recuperar contraseña</Link> desde el inicio de sesión.
            </li>
            <li>
              <strong>¿Dónde veo mis pedidos?</strong> En la sección <em>Mis compras</em> de esta misma página.
            </li>
            <li>
              <strong>Conocé la tienda:</strong> <Link to="/sobre-nosotros">Sobre nosotros</Link>.
            </li>
          </ul>
          <p className="account-help-contact">
            ¿Necesitás más ayuda? Escribinos a{" "}
            <a href="mailto:soporte@example.com">soporte@example.com</a> indicando el número de pedido.
          </p>
        </AccountCollapsible>
      </div>
    </div>
  );
}
