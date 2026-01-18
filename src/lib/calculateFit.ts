// Size guide types
export interface SizeDefinition {
  label: string;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  length_cm?: number;
  foot_cm?: number;
}

export interface SizeGuide {
  id: string;
  client_id: string;
  category: string;
  size_system: 'letter' | 'numeric' | 'cm';
  sizes: SizeDefinition[];
}

export interface FitResult {
  fit: 'very_tight' | 'tight' | 'ideal' | 'loose' | 'very_loose';
  label: string;
  difference_cm?: number;
}

// Default letter sizes with fallback measurements
const defaultLetterSizes: SizeDefinition[] = [
  { label: 'XS', chest_cm: 84, waist_cm: 66, hips_cm: 90 },
  { label: 'S', chest_cm: 88, waist_cm: 70, hips_cm: 94 },
  { label: 'M', chest_cm: 92, waist_cm: 76, hips_cm: 98 },
  { label: 'L', chest_cm: 100, waist_cm: 84, hips_cm: 104 },
  { label: 'XL', chest_cm: 108, waist_cm: 92, hips_cm: 112 },
  { label: 'XXL', chest_cm: 116, waist_cm: 100, hips_cm: 120 },
];

// Get available sizes from a size guide or use defaults
export const getAvailableSizes = (sizeGuide: SizeGuide | null): string[] => {
  if (sizeGuide && sizeGuide.sizes.length > 0) {
    return sizeGuide.sizes.map(s => s.label);
  }
  return defaultLetterSizes.map(s => s.label);
};

// Get the size system type
export const getSizeSystem = (sizeGuide: SizeGuide | null): 'letter' | 'numeric' | 'cm' => {
  return sizeGuide?.size_system || 'letter';
};

// Calculate fit based on size guide or fallback to generic calculation
export const calculateFit = (
  userSize: string,
  garmentSize: string,
  sizeGuide: SizeGuide | null,
  category: string
): FitResult => {
  // If we have a size guide with cm measurements, use precise calculation
  if (sizeGuide && sizeGuide.sizes.length > 0) {
    const userSizeDef = sizeGuide.sizes.find(s => s.label === userSize);
    const garmentSizeDef = sizeGuide.sizes.find(s => s.label === garmentSize);
    
    if (userSizeDef && garmentSizeDef) {
      // Use chest measurement as primary comparison for upper body
      // Use waist/hips for lower body
      let userMeasure: number | undefined;
      let garmentMeasure: number | undefined;
      
      if (['pantalon', 'falda'].includes(category)) {
        userMeasure = userSizeDef.waist_cm || userSizeDef.hips_cm;
        garmentMeasure = garmentSizeDef.waist_cm || garmentSizeDef.hips_cm;
      } else if (category === 'zapatos') {
        userMeasure = userSizeDef.foot_cm;
        garmentMeasure = garmentSizeDef.foot_cm;
      } else {
        userMeasure = userSizeDef.chest_cm;
        garmentMeasure = garmentSizeDef.chest_cm;
      }
      
      if (userMeasure && garmentMeasure) {
        const diffCm = garmentMeasure - userMeasure;
        return calculateFitFromDifference(diffCm, category);
      }
    }
  }
  
  // Fallback to generic index-based calculation
  const sizes = sizeGuide ? sizeGuide.sizes.map(s => s.label) : defaultLetterSizes.map(s => s.label);
  const userIndex = sizes.indexOf(userSize);
  const garmentIndex = sizes.indexOf(garmentSize);
  
  if (userIndex === -1 || garmentIndex === -1) {
    return { fit: 'ideal', label: 'Ideal' };
  }
  
  const diff = garmentIndex - userIndex;
  
  if (diff <= -2) return { fit: 'very_tight', label: 'Muy ajustado' };
  if (diff === -1) return { fit: 'tight', label: 'Ajustado' };
  if (diff === 0) return { fit: 'ideal', label: 'Ideal' };
  if (diff === 1) return { fit: 'loose', label: 'Holgado' };
  return { fit: 'very_loose', label: 'Muy grande' };
};

// Calculate fit from cm difference
const calculateFitFromDifference = (diffCm: number, category: string): FitResult => {
  // Adjust thresholds based on category
  const isFootwear = category === 'zapatos';
  
  // Footwear is more sensitive to size differences
  const thresholds = isFootwear 
    ? { veryTight: -1, tight: -0.5, loose: 0.5, veryLoose: 1 }
    : { veryTight: -8, tight: -4, loose: 4, veryLoose: 8 };
  
  if (diffCm <= thresholds.veryTight) {
    return { fit: 'very_tight', label: 'Muy ajustado', difference_cm: diffCm };
  }
  if (diffCm <= thresholds.tight) {
    return { fit: 'tight', label: 'Ajustado', difference_cm: diffCm };
  }
  if (diffCm >= thresholds.veryLoose) {
    return { fit: 'very_loose', label: 'Muy grande', difference_cm: diffCm };
  }
  if (diffCm >= thresholds.loose) {
    return { fit: 'loose', label: 'Holgado', difference_cm: diffCm };
  }
  return { fit: 'ideal', label: 'Ideal', difference_cm: diffCm };
};

// Get fit badge color
export const getFitBadgeColor = (fit: FitResult['fit']): string => {
  switch (fit) {
    case 'very_tight':
    case 'very_loose':
      return 'hsl(0, 84%, 60%)'; // red
    case 'tight':
    case 'loose':
      return 'hsl(45, 93%, 47%)'; // yellow/amber
    case 'ideal':
    default:
      return 'hsl(142, 71%, 45%)'; // green
  }
};
