interface PlaceholderPageProps {
  title: string;
  description: string;
  module: string;
}

export default function PlaceholderPage({ title, description, module }: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-inner">
        <span className="placeholder-badge">Próximamente — {module}</span>
        <h2>{title}</h2>
        <p>{description}</p>
        <p className="placeholder-note">
          Este módulo se implementará en una fase posterior. La estructura de navegación
          y protección de rutas ya está activa.
        </p>
      </div>
    </div>
  );
}
