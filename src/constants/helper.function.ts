// for coverting the string into array
export const toArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map((v) => v.trim());

  return [];
};

// for removing the extra special characters from the search term and \\b partial match
export function buildLooseSearchRegex(term: string) {
  const letters = term.replace(/[^a-zA-Z0-9]/g, '').split('');
  const pattern = letters.map((l) => escapeRegex(l)).join("[-' ]*");
  const finalPattern = `\\b${pattern}('?s?)?`;

  return new RegExp(finalPattern, 'i');
}

// replace each special character with a \
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
