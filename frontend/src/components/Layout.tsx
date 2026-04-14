import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, clearToken, getToken } from "../api/client";
import { CartIcon } from "./CartIcon";
import { ProductSearchField } from "./ProductSearchField";
import type { Category } from "../types";

const FALLBACK_CATEGORIES: Category[] = [
  { id: 0, slug: "montana", name: "Montaña", description: "Bicicletas todo terreno." },
  { id: 0, slug: "ciudad", name: "Ciudad", description: "Urbanas y commuting." },
  { id: 0, slug: "electrica", name: "Eléctricas", description: "E-bikes y asistencia al pedaleo." },
  { id: 0, slug: "cascos", name: "Cascos", description: "Protección para cada salida." },
];

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const token = getToken();

  function logout() {
    clearToken();
    queryClient.invalidateQueries();
    setAccountOpen(false);
    setDrawerOpen(false);
    navigate("/");
  }

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/categories", { auth: false }),
    retry: false,
  });

  const { data: cart } = useQuery({
    queryKey: ["cart", token],
    queryFn: () => apiFetch<{ items: unknown[] }>("/cart"),
    enabled: !!token,
  });

  const cartCount = token ? cart?.items?.length ?? 0 : 0;
  const navCategories = categories?.length ? categories : FALLBACK_CATEGORIES;

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const t = q.trim();
    const params = new URLSearchParams();
    if (t) params.set("q", t);
    navigate(`/productos?${params.toString()}`);
    setSearchOpen(false);
    setDrawerOpen(false);
  }

  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <button type="button" className="icon-btn menu-toggle" aria-label="Abrir menú" onClick={() => setDrawerOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>

          <Link to="/" className="site-logo">
            EBIKE BD.
          </Link>

          <nav className="site-nav" aria-label="Principal">
            <Link to="/">Inicio</Link>
            <div
              className="nav-dropdown-wrap"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <button type="button" className="nav-link" aria-expanded={shopOpen} aria-haspopup="true">
                Tienda ▾
              </button>
              {shopOpen && (
                <div className="nav-dropdown-panel" role="menu">
                  <Link to="/productos" role="menuitem" onClick={() => setShopOpen(false)}>
                    Todas las bicicletas
                  </Link>
                  {!navCategories.some((c) => c.slug === "cascos") && (
                    <Link to="/productos?categoria=cascos" role="menuitem" onClick={() => setShopOpen(false)}>
                      Cascos
                    </Link>
                  )}
                  {navCategories.map((c) => (
                    <Link
                      key={c.slug}
                      to={`/productos?categoria=${encodeURIComponent(c.slug)}`}
                      role="menuitem"
                      onClick={() => setShopOpen(false)}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link to="/servicio">Servicio</Link>
            <Link to="/sobre-nosotros">Contacto</Link>
          </nav>

          <div className="site-header-actions">
            {searchOpen ? (
              <form className="header-search-form" onSubmit={onSearch}>
                <ProductSearchField
                  value={q}
                  onChange={setQ}
                  onDone={() => setSearchOpen(false)}
                  variant="header"
                  inputRef={searchRef}
                  extraActions={
                    <>
                      <button type="submit" className="btn header-search-submit" style={{ padding: "0.45rem 0.85rem" }}>
                        Ir
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Cerrar búsqueda"
                        onClick={() => {
                          setSearchOpen(false);
                          setQ("");
                        }}
                      >
                        ✕
                      </button>
                    </>
                  }
                />
              </form>
            ) : (
              <button type="button" className="icon-btn" aria-label="Buscar" onClick={() => setSearchOpen(true)}>
                <SearchIcon />
              </button>
            )}
            <Link to="/carrito" className="icon-btn" aria-label={`Carrito${cartCount ? `, ${cartCount} artículos` : ""}`} style={{ position: "relative" }}>
              <CartIcon />
              {cartCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: "var(--accent)",
                    color: "#062812",
                    fontSize: 11,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
            {token ? (
              <div
                className="nav-dropdown-wrap header-account-wrap"
                onMouseEnter={() => setAccountOpen(true)}
                onMouseLeave={() => setAccountOpen(false)}
              >
                <button type="button" className="btn header-account-trigger" aria-expanded={accountOpen} aria-haspopup="true">
                  Mi cuenta ▾
                </button>
                {accountOpen && (
                  <div className="nav-dropdown-panel header-account-panel" role="menu">
                    <Link to="/cuenta" role="menuitem" onClick={() => setAccountOpen(false)}>
                      Ir a mi cuenta
                    </Link>
                    <button type="button" role="menuitem" className="nav-dropdown-logout" onClick={logout}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn" style={{ padding: "0.5rem 1rem", marginLeft: 4 }}>
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {drawerOpen && (
        <>
          <button type="button" className="drawer-backdrop" aria-label="Cerrar" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Menú</strong>
              <button type="button" className="btn-ghost" onClick={() => setDrawerOpen(false)}>
                ✕
              </button>
            </div>
            <Link to="/" onClick={() => setDrawerOpen(false)}>
              Inicio
            </Link>
            <Link to="/productos" onClick={() => setDrawerOpen(false)}>
              Todas las bicicletas
            </Link>
            <Link to="/servicio" onClick={() => setDrawerOpen(false)}>
              Servicio
            </Link>
            {!navCategories.some((c) => c.slug === "cascos") && (
              <Link to="/productos?categoria=cascos" onClick={() => setDrawerOpen(false)}>
                Cascos
              </Link>
            )}
            {navCategories.map((c) => (
              <Link
                key={c.slug}
                to={`/productos?categoria=${encodeURIComponent(c.slug)}`}
                onClick={() => setDrawerOpen(false)}
              >
                {c.name}
              </Link>
            ))}
            <Link to="/sobre-nosotros" onClick={() => setDrawerOpen(false)}>
              Contacto
            </Link>
            <Link to="/carrito" onClick={() => setDrawerOpen(false)}>
              Carrito{cartCount ? ` (${cartCount})` : ""}
            </Link>
            {token ? (
              <>
                <Link to="/cuenta" onClick={() => setDrawerOpen(false)}>
                  Mi cuenta
                </Link>
                <button type="button" className="drawer-logout-btn" onClick={logout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setDrawerOpen(false)}>
                Iniciar sesión
              </Link>
            )}
          </aside>
        </>
      )}

      <main style={{ padding: "0 0 3rem" }}>{children}</main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "1.75rem 0", color: "var(--muted)", fontSize: "0.9rem" }}>
        <div className="container">
          © {new Date().getFullYear()} EBIKE BD. · Catálogo demo · Tucson, AZ
        </div>
      </footer>
    </>
  );
}
