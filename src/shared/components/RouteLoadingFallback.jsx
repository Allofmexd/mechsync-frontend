import './routeLoading.css';

function RouteLoadingFallback() {
  return (
    <main
      className="route-feedback"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="route-feedback__spinner" aria-hidden="true" />
      <h1 className="route-feedback__title">Cargando sección...</h1>
      <p className="route-feedback__message">La vista estará disponible en un momento.</p>
    </main>
  );
}

export default RouteLoadingFallback;
