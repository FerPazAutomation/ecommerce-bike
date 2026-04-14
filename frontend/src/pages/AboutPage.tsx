export function AboutPage() {
  return (
    <div className="container" style={{ maxWidth: "720px" }}>
      <h1>Sobre E-bike Tucson</h1>
      <p style={{ color: "var(--muted)" }}>
        Somos un equipo local apasionado por el ciclismo urbano y de montaña en el desierto de Arizona. Seleccionamos
        bicicletas y e-bikes con componentes fiables para rutas como el Chuck Huckleberry y el carril The Loop.
      </p>
      <p style={{ color: "var(--muted)" }}>
        Esta tienda demo está construida con React, FastAPI y PostgreSQL; los pagos usan Stripe en modo sandbox para
        pruebas seguras.
      </p>
    </div>
  );
}
