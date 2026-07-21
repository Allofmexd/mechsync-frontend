import { getApiErrorMessage } from '../../shared/api/apiErrorMessages';

export const REVISION_STATUS_LABELS = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  SUPERSEDED: 'Reemplazada',
  CANCELLED: 'Cancelada',
};

export function unwrapApiData(response) {
  return response?.data ?? response;
}

export function unwrapRevisionPage(response) {
  const data = unwrapApiData(response) ?? {};
  const content = Array.isArray(data) ? data : data.content ?? [];
  return {
    content,
    page: Number(data.page ?? 0),
    size: Number(data.size ?? content.length),
    totalElements: Number(data.totalElements ?? content.length),
    totalPages: Number(data.totalPages ?? (content.length ? 1 : 0)),
  };
}

export function getRevisionErrorMessage(error, fallback) {
  if (error?.status >= 500) return 'El servidor no pudo completar la operación de cotización. Intenta nuevamente.';
  if (error?.status === 400) return getApiErrorMessage(error, 'Revisa los datos de la cotización.');
  if (error?.status === 404) return getApiErrorMessage(error, 'La orden o revisión ya no está disponible.');
  if (error?.status === 409) return getApiErrorMessage(error, 'Transición inválida o conflicto de concurrencia. Recarga las revisiones.');
  return getApiErrorMessage(error, fallback);
}

export function formatRevisionMoney(value, currency = 'MXN') {
  if (value === null || value === undefined || value === '') return 'Dato no disponible';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(value));
}

export function formatRevisionDate(value) {
  if (!value) return 'Dato no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Dato no disponible';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function parseScaledDecimal(value, scale) {
  const normalized = String(value ?? '').trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const [integer, fraction = ''] = normalized.split('.');
  if (fraction.length > scale) return null;
  return BigInt(integer) * (10n ** BigInt(scale)) + BigInt(fraction.padEnd(scale, '0') || '0');
}

function roundScale(value, fromScale, toScale) {
  if (fromScale <= toScale) return value * (10n ** BigInt(toScale - fromScale));
  const divisor = 10n ** BigInt(fromScale - toScale);
  return (value + divisor / 2n) / divisor;
}

function formatScaledDecimal(value, scale) {
  const divisor = 10n ** BigInt(scale);
  const integer = value / divisor;
  const fraction = (value % divisor).toString().padStart(scale, '0');
  return scale ? `${integer}.${fraction}` : integer.toString();
}

export function calculateRevisionAmounts(services, parts, applyIva, ivaRate) {
  const lines = [...services, ...parts];
  const calculatedLines = [];
  let subtotalScale4 = 0n;

  for (const line of lines) {
    const quantity = parseScaledDecimal(line.quantity, 6);
    const unitPrice = parseScaledDecimal(line.unitPrice, 4);
    if (quantity === null || quantity <= 0n || unitPrice === null || unitPrice < 0n) {
      return { valid: false, message: 'Cada línea requiere cantidad positiva y precio no negativo.' };
    }
    const lineSubtotal = roundScale(quantity * unitPrice, 10, 4);
    calculatedLines.push(formatScaledDecimal(lineSubtotal, 4));
    subtotalScale4 += lineSubtotal;
  }

  const subtotalScale2 = roundScale(subtotalScale4, 4, 2);
  let ivaScale2 = 0n;
  let normalizedRate = '0.000000';
  if (applyIva) {
    const rateScale6 = parseScaledDecimal(ivaRate || '0.160000', 6);
    if (rateScale6 === null || rateScale6 <= 0n) {
      return { valid: false, message: 'La tasa de IVA debe ser un decimal positivo con máximo 6 decimales.' };
    }
    ivaScale2 = roundScale(subtotalScale2 * rateScale6, 8, 2);
    normalizedRate = formatScaledDecimal(rateScale6, 6);
  }

  return {
    valid: true,
    lineSubtotals: calculatedLines,
    subtotalAmount: formatScaledDecimal(subtotalScale2, 2),
    ivaRate: normalizedRate,
    ivaAmount: formatScaledDecimal(ivaScale2, 2),
    totalAmount: formatScaledDecimal(subtotalScale2 + ivaScale2, 2),
  };
}
