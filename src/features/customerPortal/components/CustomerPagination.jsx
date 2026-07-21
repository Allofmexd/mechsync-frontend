const PAGE_SIZES = [5, 10, 20];

export default function CustomerPagination({
  pageData,
  size,
  loading,
  onPageChange,
  onSizeChange,
  resourceLabel = 'resultados',
  ariaLabel = 'Paginación',
}) {
  if (pageData.totalElements <= 0) return null;

  return (
    <nav className="customer-pagination" aria-label={ariaLabel}>
      <div aria-live="polite">
        <strong>Página {pageData.page + 1} de {pageData.totalPages}</strong>
        <span>{pageData.totalElements} {resourceLabel}</span>
      </div>
      <label>
        Registros por página
        <select
          value={size}
          disabled={loading}
          onChange={(event) => onSizeChange(Number(event.target.value))}
        >
          {PAGE_SIZES.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <div className="customer-pagination__actions">
        <button
          type="button"
          disabled={loading || pageData.first}
          onClick={() => onPageChange(pageData.page - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={loading || pageData.last}
          onClick={() => onPageChange(pageData.page + 1)}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}
