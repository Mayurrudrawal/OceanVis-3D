/**
 * Scientific Validation Metrics Utility
 * Conforms to GOV (GODAE OceanView) validation standards
 */

/**
 * Root Mean Square Error (RMSE)
 * RMSE = sqrt( 1/N * sum((obs_i - mod_i)^2) )
 */
export function calculateRMSE(observed, model) {
  if (!observed || !model || observed.length === 0 || observed.length !== model.length) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < observed.length; i++) {
    const error = observed[i] - model[i];
    sum += error * error;
  }

  return Math.sqrt(sum / observed.length);
}

/**
 * Mean Bias Error (Model Bias)
 * Bias = 1/N * sum(mod_i - obs_i)
 */
export function calculateBias(observed, model) {
  if (!observed || !model || observed.length === 0 || observed.length !== model.length) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < observed.length; i++) {
    sum += (model[i] - observed[i]);
  }

  return sum / observed.length;
}

/**
 * Maximum Absolute Error
 */
export function calculateMaxError(observed, model) {
  if (!observed || !model || observed.length === 0 || observed.length !== model.length) {
    return 0;
  }

  let maxErr = 0;
  for (let i = 0; i < observed.length; i++) {
    const err = Math.abs(observed[i] - model[i]);
    if (err > maxErr) maxErr = err;
  }

  return maxErr;
}

/**
 * Pearson Correlation Coefficient (r)
 */
export function calculateCorrelation(observed, model) {
  if (!observed || !model || observed.length < 2) return 1.0;

  const n = observed.length;
  const meanObs = observed.reduce((a, b) => a + b, 0) / n;
  const meanMod = model.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denObs = 0;
  let denMod = 0;

  for (let i = 0; i < n; i++) {
    const diffObs = observed[i] - meanObs;
    const diffMod = model[i] - meanMod;
    num += diffObs * diffMod;
    denObs += diffObs * diffObs;
    denMod += diffMod * diffMod;
  }

  const denom = Math.sqrt(denObs * denMod);
  return denom === 0 ? 1.0 : num / denom;
}
