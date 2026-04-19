const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "local";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function HomePage() {
  return (
    <main>
      <section className="shell">
        <span className="eyebrow">Storefront Bootstrap</span>
        <h1>TiendaOnline Web Store</h1>
        <p>
          Esta app existe solo como base técnica del monorepo. No contiene catálogo,
          carrito ni checkout todavía.
        </p>
        <p>
          Su objetivo en esta fase es validar el entorno local, el workspace y la
          conexión futura con la API.
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
