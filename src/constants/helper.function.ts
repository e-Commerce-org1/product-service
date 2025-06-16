export const toArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(v => v.trim());
  
  return [];
}

export function buildLooseSearchRegex(term: string) {
  const letters = term.replace(/[^a-zA-Z0-9]/g, '').split('');
  const pattern = letters.map(l => escapeRegex(l)).join('[-\' ]*');
  const finalPattern = `\\b${pattern}('?s?)?`;

  return new RegExp(finalPattern, 'i');
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

