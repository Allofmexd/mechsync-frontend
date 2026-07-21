import { TECHNICIAN_PAGE_SIZE_OPTIONS } from './technicianPaginationUtils';

export default function TechnicianPagination({
  pageData,
  size,
  loading,
  resourceLabel,
  onPageChange,
  onSizeChange,
}) {
  if (pageData.totalElements <= 0) return null;

  const currentPage = pageData.totalPages > 0 ? pageData.page + 1 : 0;

  return (
    <nav className="technician-pagination" aria-label={`Paginación de ${resourceLabel}`}>
      <div className="technician-pagination__summary" aria-live="polite">
        <span>Página {currentPage} de {pageData.totalPages}</span>
        <span>{pageData.totalElements} {resourceLabel}</span>
      </div>
      <label className="technician-pagination__size">
        Registros por página
        <select
          value={size}
          onChange={(event) => onSizeChange(Number(event.target.value))}
          disabled={loading}
        >
          {TECHNICIAN_PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
      <div className="technician-pagination__actions">
        <button
          type="button"
          disabled={loading || pageData.first}
          onClick={() => onPageChange(pageData.page - 1)}
          aria-label={`Ir a la página anterior de ${resourceLabel}`}
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={loading || pageData.last}
          onClick={() => onPageChange(pageData.page + 1)}
          aria-label={`Ir a la página siguiente de ${resourceLabel}`}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}
