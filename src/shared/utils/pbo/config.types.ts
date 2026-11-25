/**
 * A parsed Arma config (mission.sqm, description.ext, …) as plain JSON:
 * classes → objects, `name[]` arrays → arrays (key without `[]`),
 * numbers → numbers, strings / bare words → strings.
 * Class inheritance (`class A: B`) is not resolved, only the body is kept.
 */
export type ConfigValue = string | number | ConfigValue[] | ConfigClass;

export type ConfigClass = { [key: string]: ConfigValue };

/** Shared nesting limit, protects from stack overflow on malicious input. */
export const MAX_CONFIG_DEPTH = 256;

/**
 * Shortest decimal that round-trips to the same float32, so binarized
 * floats look like their text form (0.2617994, not 0.26179939508438110).
 */
export const float32ToNumber = (value: number) => {
  if (!Number.isFinite(value) || Number.isInteger(value)) return value;

  for (let precision = 1; precision < 10; precision++) {
    const digits = value.toPrecision(precision);
    const candidate = Number(digits);
    if (Math.fround(candidate) !== value) continue;

    // Exact ties (5504.03125 → 5504.0312 / 5504.0313) are rounded half to
    // even, like printf and Mikero's derap; toPrecision always rounds up.
    const exponent = Math.floor(Math.log10(Math.abs(candidate)));
    const unit = 10 ** (exponent - precision + 1);
    const isTie =
      Math.abs(Math.abs(value - candidate) - unit / 2) <= unit * 1e-6;
    const lastDigit = Number(digits.replace(/e.*$/, '').slice(-1));

    if (isTie && lastDigit % 2 === 1) {
      const even = Number(
        (candidate - Math.sign(candidate) * unit).toPrecision(precision),
      );
      if (Math.fround(even) === value) return even;
    }

    return candidate;
  }

  return value;
};
