/**
 * Default gram-equivalents per unit (used when a food has no specific override
 * from the database). These are sensible Indian-kitchen defaults.
 */
export const DEFAULT_UNIT_GRAMS = {
  g: 1,
  ml: 1,        // assumes density ~1 (water-like) for liquids without override
  piece: 50,
  cup: 240,
  bowl: 150,
  katori: 150,
  tbsp: 15,
  tsp: 5,
};

export const SUPPORTED_UNITS = ['g', 'ml', 'piece', 'cup', 'bowl', 'katori', 'tbsp', 'tsp'];

/**
 * Parses a food's unitGramsOverride string like "piece:50,cup:240,tbsp:15"
 * into a lookup object { piece: 50, cup: 240, tbsp: 15 }.
 */
export function parseUnitOverrides(overrideStr) {
  if (!overrideStr) return {};
  const result = {};
  overrideStr.split(',').forEach(pair => {
    const [unit, grams] = pair.split(':');
    if (unit && grams) result[unit.trim()] = parseFloat(grams);
  });
  return result;
}

/**
 * Returns grams-per-unit for a given food + unit, using the food's specific
 * override if available, otherwise falling back to sensible defaults.
 */
export function getGramsPerUnit(food, unit) {
  const overrides = parseUnitOverrides(food?.unitGramsOverride);
  if (overrides[unit] !== undefined) return overrides[unit];
  return DEFAULT_UNIT_GRAMS[unit] ?? 100; // fallback safety net
}

/**
 * Calculates nutrition values for a given quantity + unit of a food,
 * using its per-100g base values and the correct gram-equivalent for the unit.
 *
 * @param {object} food - has caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, fiberPer100g, unitGramsOverride
 * @param {number} qty - the quantity entered by the user (e.g. 2 for "2 pieces")
 * @param {string} unit - one of SUPPORTED_UNITS
 * @returns {{calories:number, protein:number, carbohydrates:number, fat:number, fiber:number}}
 */
export function calcNutritionForUnit(food, qty, unit) {
  const gramsPerUnit = getGramsPerUnit(food, unit);
  const totalGrams = (parseFloat(qty) || 0) * gramsPerUnit;
  const factor = totalGrams / 100;

  return {
    calories:      round1((food.caloriesPer100g || 0) * factor),
    protein:       round1((food.proteinPer100g  || 0) * factor),
    carbohydrates: round1((food.carbsPer100g    || 0) * factor),
    fat:           round1((food.fatPer100g      || 0) * factor),
    fiber:         round1((food.fiberPer100g    || 0) * factor),
  };
}

function round1(n) {
  return parseFloat((n || 0).toFixed(1));
}
