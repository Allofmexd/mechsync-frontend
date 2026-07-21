const NUMBER_FORMAT = new Intl.NumberFormat('es-MX');
const QUANTITY_FORMAT = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });
const MONEY_FORMAT = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatLocalDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getPresetPeriod(preset, now = new Date()) {
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from;

  if (preset === 'last-3-months') {
    from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  } else if (preset === 'last-6-months') {
    from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  } else if (preset === 'current-year') {
    from = new Date(now.getFullYear(), 0, 1);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { from: formatLocalDate(from), to: formatLocalDate(to) };
}

export function validatePeriod(period) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(period.from)
      || !/^\d{4}-\d{2}-\d{2}$/.test(period.to)) {
    return 'Selecciona ambas fechas para aplicar el periodo.';
  }
  if (period.from > period.to) {
    return 'La fecha inicial no puede ser posterior a la fecha final.';
  }
  return '';
}

export function formatNumber(value) {
  return NUMBER_FORMAT.format(Number(value ?? 0));
}

export function formatQuantity(value) {
  return QUANTITY_FORMAT.format(Number(value ?? 0));
}

export function formatMoney(value) {
  return MONEY_FORMAT.format(Number(value ?? 0));
}

export function formatMonth(period) {
  if (!/^\d{4}-\d{2}$/.test(period ?? '')) return period ?? '';
  const [year, month] = period.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' })
    .format(new Date(year, month - 1, 1))
    .replace('.', '');
}

export function getDashboardErrorMessage(error) {
  if (error?.status === 400) return 'El periodo seleccionado no es válido.';
  if (error?.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (error?.status === 403) return 'No tienes permiso para consultar el Dashboard administrativo.';
  if (error?.status >= 500) return 'No fue posible obtener las métricas. Intenta nuevamente.';
  return 'No fue posible conectar con el Dashboard. Intenta nuevamente.';
}
