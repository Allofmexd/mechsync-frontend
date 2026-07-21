import { Component } from 'react';
import './routeLoading.css';

class RouteChunkErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="route-feedback" role="alert" aria-live="assertive">
          <h1 className="route-feedback__title">No fue posible cargar la sección</h1>
          <p className="route-feedback__message">
            Esta sección no pudo cargarse. Recarga la página para intentarlo nuevamente.
          </p>
          <button
            className="route-feedback__action"
            type="button"
            onClick={this.handleReload}
          >
            Recargar página
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default RouteChunkErrorBoundary;
