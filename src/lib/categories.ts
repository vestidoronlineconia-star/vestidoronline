// Centralized category definitions
export const GARMENT_CATEGORIES = [
  { id: "buzo", label: "Hoodie", icon: "🧥" },
  { id: "remera", label: "Remera", icon: "👕" },
  { id: "camisa", label: "Camisa", icon: "👔" },
  { id: "vestido", label: "Vestido", icon: "👗" },
  { id: "falda", label: "Falda", icon: "🩱" },
  { id: "pantalon", label: "Pantalón", icon: "👖" },
  { id: "zapatos", label: "Calzado", icon: "👟" },
] as const;

// Alias for components that need value/label/icon format
export const CATEGORIES = GARMENT_CATEGORIES.map(cat => ({
  value: cat.id,
  label: cat.label,
  icon: cat.icon,
}));

export type CategoryId = typeof GARMENT_CATEGORIES[number]['id'];
export type Category = typeof GARMENT_CATEGORIES[number];

// Default letter sizes
export const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type Size = typeof DEFAULT_SIZES[number];
