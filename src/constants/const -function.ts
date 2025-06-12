export const toArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map(v => v.trim());
  return [];
}

export function buildLooseSearchRegex(term) {
  // Remove all non-word characters from the search term
  const letters = term.replace(/[^a-zA-Z0-9]/g, '').split('');
  // Build a pattern that allows optional hyphen or space between each letter
  const pattern = letters.map(l => escapeRegex(l)).join('[- ]*');
  return new RegExp(`\\b${pattern}`, 'i');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface side {
            brands : string[], 
            categories : string[],
            subCategories : string[],
            genders : string[],
            colors : string[],
            lowestPrice : number,
            highestPrice : number
}