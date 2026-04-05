import React, { useMemo } from 'react';
import { computeShiftParams } from '../utils/shiftLogic';

/**
 * ComplexityPanel — Real-time complexity analysis for Mesh vs Ring shift.
 * Props:
 *   p: number
 *   q: number
 */
function ComplexityPanel({ p, q }) {
  const { side, rowShift, colShift, ringSteps, meshSteps } = useMemo(
    () => computeShiftParams(p, q),
    [p, q]
  );

  const maxSteps = Math.max(ringSteps, meshSteps, 1);
  const meshPct = (meshSteps / maxSteps) * 100;
  const ringPct = (ringSteps / maxSteps) * 100;
  const savings = ringSteps > 0 ? (((ringSteps - meshSteps) / ringSteps) * 100).toFixed(1) : '0';
  const speedup = meshSteps > 0 ? (ringSteps / meshSteps).toFixed(2) : '∞';

  return (
    <div className="complexity-panel">
      <div className="panel-header">
        <div className="panel-icon">📊</div>
        <h2 className="panel-title">Complexity Analysis</h2>
      </div>

      {/* Shift Parameters */}
      <div className="complexity-section">
        <div className="section-label">Shift Decomposition</div>
        <div className="param-grid">
          <div className="param-card param-blue">
            <div className="param-value">{rowShift}</div>
            <div className="param-name">Row Shift</div>
            <div className="param-formula">q mod √p = {q} mod {side}</div>
          </div>
          <div className="param-card param-purple">
            <div className="param-value">{colShift}</div>
            <div className="param-name">Col Shift</div>
            <div className="param-formula">⌊q / √p⌋ = ⌊{q} / {side}⌋</div>
          </div>
          <div className="param-card param-green">
            <div className="param-value">{meshSteps}</div>
            <div className="param-name">Mesh Steps</div>
            <div className="param-formula">{rowShift} + {colShift}</div>
          </div>
        </div>
      </div>

      {/* Formula display */}
      <div className="complexity-section">
        <div className="section-label">Formulas</div>
        <div className="formula-box">
          <div className="formula-row formula-ring">
            <span className="formula-label">Ring steps</span>
            <span className="formula-eq">= min(q, p−q) = min({q}, {p - q})</span>
            <span className="formula-result badge-ring">{ringSteps}</span>
          </div>
          <div className="formula-row formula-mesh">
            <span className="formula-label">Mesh steps</span>
            <span className="formula-eq">= (q mod √p) + ⌊q/√p⌋ = {rowShift} + {colShift}</span>
            <span className="formula-result badge-mesh">{meshSteps}</span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="complexity-section">
        <div className="section-label">Visual Comparison</div>
        <div className="bar-chart">
          <div className="bar-row">
            <span className="bar-label">Ring</span>
            <div className="bar-track">
              <div
                className="bar-fill bar-ring"
                style={{ width: `${ringPct}%` }}
                role="progressbar"
                aria-valuenow={ringSteps}
                aria-valuemax={maxSteps}
                aria-label={`Ring steps: ${ringSteps}`}
              />
            </div>
            <span className="bar-val">{ringSteps} steps</span>
          </div>
          <div className="bar-row">
            <span className="bar-label">Mesh</span>
            <div className="bar-track">
              <div
                className="bar-fill bar-mesh"
                style={{ width: `${meshPct}%` }}
                role="progressbar"
                aria-valuenow={meshSteps}
                aria-valuemax={maxSteps}
                aria-label={`Mesh steps: ${meshSteps}`}
              />
            </div>
            <span className="bar-val">{meshSteps} steps</span>
          </div>
        </div>
      </div>

      {/* Efficiency Summary */}
      <div className="efficiency-row">
        <div className="efficiency-card">
          <div className="eff-value text-amber">{savings}%</div>
          <div className="eff-label">Steps Saved</div>
        </div>
        <div className="efficiency-card">
          <div className="eff-value text-emerald">{speedup}×</div>
          <div className="eff-label">Speedup</div>
        </div>
        <div className="efficiency-card">
          <div className="eff-value text-sky">{side}×{side}</div>
          <div className="eff-label">Mesh Size</div>
        </div>
      </div>

      {meshSteps < ringSteps && (
        <div className="insight-box">
          <span className="insight-icon">💡</span>
          <span>
            The 2D mesh topology completes this shift in <strong>{meshSteps}</strong> steps vs the
            ring's <strong>{ringSteps}</strong> steps — <strong>{savings}% fewer</strong> hops by
            parallelising row and column transfers.
          </span>
        </div>
      )}
      {meshSteps === ringSteps && (
        <div className="insight-box insight-equal">
          <span className="insight-icon">⚖️</span>
          <span>
            For this (p, q) pair, mesh and ring require the same number of steps ({meshSteps}).
          </span>
        </div>
      )}
    </div>
  );
}

export default ComplexityPanel;
