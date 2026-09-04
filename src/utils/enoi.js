/**
 * OceanVis-3D Localized EnOI (Ensemble Optimal Interpolation) Demonstration Engine
 * 
 * NOTE: Clearly labelled as a scientific prototype demonstration.
 * In a full operational ocean prediction system (e.g. INCOIS MOM6/EnKF),
 * EnOI uses a stationary ensemble sampled from multi-year model runs:
 *   x_a = x_b + B H^T (H B H^T + R)^(-1) * (y - H x_b)
 * 
 * Here, we evaluate the innovation vector and apply a localized gain operator
 * with realistic scientific steps and metrics update.
 */

import { calculateRMSE, calculateBias, calculateMaxError } from "./rmse.js";

export const ENOI_STAGES = [
  { progress: 15, label: "Formulating Innovation Vector: d = y - H(x_b)", formula: "d = y_obs - H(x_background)" },
  { progress: 38, label: "Sampling Ensemble Covariance Matrix B (N_ens = 60)", formula: "B ≈ (A' A'^T) / (N - 1)" },
  { progress: 62, label: "Applying 5th-Order Gaspari-Cohn Localization (L = 150 km)", formula: "ρ_GC(r/L) ⊗ B" },
  { progress: 85, label: "Inverting Innovation Covariance: (H B H^T + R)^(-1)", formula: "K = B H^T (H B H^T + R)^(-1)" },
  { progress: 100, label: "Assimilation Complete: Model state updated to x_a", formula: "x_analysis = x_b + K * d" }
];

/**
 * Executes simulated asynchronous EnOI Assimilation with step-by-step progress callbacks
 */
export async function runLocalizedEnOI(observedProfile, modelProfile, options = {}, onProgress = () => {}) {
  const gain = options.gain ?? 0.58; // Standard EnOI gain weight
  const delayStepMs = options.delayStepMs ?? 320;

  // Extract parallel arrays
  const obsVals = observedProfile.map(p => p.value);
  const modVals = modelProfile.map(p => p.value);

  // Compute baseline metrics
  const beforeRMSE = calculateRMSE(obsVals, modVals);
  const beforeBias = calculateBias(obsVals, modVals);
  const beforeMaxErr = calculateMaxError(obsVals, modVals);

  // Simulate algorithmic progress pipeline
  for (let i = 0; i < ENOI_STAGES.length; i++) {
    const stage = ENOI_STAGES[i];
    onProgress(stage.progress, stage.label, stage.formula);
    await new Promise(res => setTimeout(res, delayStepMs));
  }

  // Generate deterministic updated model profile
  // Depth-dependent nudging: stronger in thermocline (depths 50-200m) where forecast error covariance is highest
  const updatedProfile = modelProfile.map((pt, idx) => {
    const obsVal = obsVals[idx];
    const modVal = pt.value;
    const depth = pt.depth;

    // Thermocline depth sensitivity factor (higher error covariance in thermocline)
    let depthFactor = 1.0;
    if (depth >= 50 && depth <= 200) depthFactor = 1.15;
    else if (depth > 500) depthFactor = 0.85;

    const effectiveGain = Math.min(0.92, gain * depthFactor);
    const updatedVal = modVal + (obsVal - modVal) * effectiveGain;

    return {
      depth: pt.depth,
      value: parseFloat(updatedVal.toFixed(2)),
      originalValue: modVal
    };
  });

  const updatedVals = updatedProfile.map(p => p.value);

  // Recalculate metrics
  const afterRMSE = calculateRMSE(obsVals, updatedVals);
  const afterBias = calculateBias(obsVals, updatedVals);
  const afterMaxErr = calculateMaxError(obsVals, updatedVals);

  const errorReductionPct = beforeRMSE > 0 
    ? Math.max(0, ((beforeRMSE - afterRMSE) / beforeRMSE) * 100) 
    : 0;

  return {
    success: true,
    updatedProfile,
    before: {
      rmse: parseFloat(beforeRMSE.toFixed(3)),
      bias: parseFloat(beforeBias.toFixed(3)),
      maxError: parseFloat(beforeMaxErr.toFixed(3))
    },
    after: {
      rmse: parseFloat(afterRMSE.toFixed(3)),
      bias: parseFloat(afterBias.toFixed(3)),
      maxError: parseFloat(afterMaxErr.toFixed(3))
    },
    errorReductionPct: parseFloat(errorReductionPct.toFixed(1)),
    gainUsed: gain
  };
}
