export const PHONE_VALIDATION_MESSAGE = 'El teléfono debe contener entre 10 y 15 dígitos.';
export const PHONE_CHARACTERS_MESSAGE = 'El teléfono solo permite dígitos, espacios, guiones, paréntesis y el prefijo +.';

export function getPhoneValidationMessage(value) {
  const phone = String(value ?? '').trim();
  if (!phone) return '';
  if (!/^\+?[\d\s()-]+$/.test(phone)) return PHONE_CHARACTERS_MESSAGE;

  const digitCount = (phone.match(/\d/g) ?? []).length;
  return digitCount >= 10 && digitCount <= 15 ? '' : PHONE_VALIDATION_MESSAGE;
}

export function validatePhoneField(input) {
  const message = getPhoneValidationMessage(input?.value);
  input?.setCustomValidity(message);
  return message;
}
