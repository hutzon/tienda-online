const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "local";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function HomePage() {
  return (
    <main>
      <section className="shell">
        <span className="eyebrow">Admin Bootstrap</span>
        <h1>TiendaOnline Admin</h1>
        <p>
          Esta aplicación arranca con una pantalla mínima de control para validar
          entorno, workspace y base técnica del panel.
        </p>
        <p>
          No incluye módulos de pedidos, inventario, clientes ni facturación en esta
          fase.
        </p>
        <dl>
          <div>
            <dt>Entorno</dt>
            <dd>{appEnv}</dd>
          </div>
          <div>
            <dt>API prevista</dt>
            <dd>{apiBaseUrl}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
