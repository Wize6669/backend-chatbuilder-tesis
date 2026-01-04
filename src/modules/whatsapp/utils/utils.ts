export function jidFromPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  return `${clean}@s.whatsapp.net`;
}
