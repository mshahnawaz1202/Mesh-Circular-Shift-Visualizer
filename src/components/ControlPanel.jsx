import React, { useState } from 'react';
import { isPerfectSquare } from '../utils/shiftLogic';

/**
 * ControlPanel — Input controls for p and q with validation.
 * Props:
 *   p, q: current values
 *   onChange(newP, newQ): called when valid values change
 *   onRun(): trigger animation
 *   onReset(): reset to initial state
 *   isAnimating: boolean
 */
function ControlPanel({ p, q, onChange, onRun, onReset, isAnimating }) {
  const [pInput, setPInput] = useState(String(p));
  const [qInput, setQInput] = useState(String(q));
  const [errors, setErrors] = useState({});

  const validate = (pVal, qVal) => {
    const errs = {};
    const pNum = Number(pVal);
    const qNum = Number(qVal);

    if (!pVal || isNaN(pNum) || !Number.isInteger(pNum)) {
      errs.p = 'p must be an integer.';
    } else if (pNum < 4 || pNum > 64) {
      errs.p = 'p must be between 4 and 64.';
    } else if (!isPerfectSquare(pNum)) {
      errs.p = 'p must be a perfect square (4, 9, 16, 25, 36, 49, 64).';
    }

    if (!qVal || isNaN(qNum) || !Number.isInteger(qNum)) {
      errs.q = 'q must be an integer.';
    } else if (pNum && qNum < 1) {
      errs.q = 'q must be ≥ 1.';
    } else if (pNum && qNum >= pNum) {
      errs.q = `q must be < p (i.e., ≤ ${pNum - 1}).`;
    }

    return errs;
  };

  const handleApply = () => {
    const errs = validate(pInput, qInput);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onChange(Number(pInput), Number(qInput));
    }
  };

  const perfSquares = [4, 9, 16, 25, 36, 49, 64];

  return (
    <div className="control-panel">
      <div className="panel-header">
        <div className="panel-icon">⚙️</div>
        <h2 className="panel-title">Configuration</h2>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="input-p">
          <span className="label-text">p — Total Nodes</span>
          <span className="label-hint">Perfect square, 4–64</span>
        </label>
        <input
          id="input-p"
          className={`form-input ${errors.p ? 'input-error' : ''}`}
          type="number"
          value={pInput}
          min={4}
          max={64}
          onChange={e => setPInput(e.target.value)}
          disabled={isAnimating}
          aria-describedby="p-error p-presets"
        />
        {errors.p && <span id="p-error" className="error-text">{errors.p}</span>}

        <div id="p-presets" className="presets">
          {perfSquares.map(v => (
            <button
              key={v}
              className={`preset-btn ${Number(pInput) === v ? 'preset-active' : ''}`}
              onClick={() => { setPInput(String(v)); setErrors({}); }}
              disabled={isAnimating}
              aria-label={`Set p to ${v}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="input-q">
          <span className="label-text">q — Shift Amount</span>
          <span className="label-hint">1 to p−1</span>
        </label>
        <input
          id="input-q"
          className={`form-input ${errors.q ? 'input-error' : ''}`}
          type="number"
          value={qInput}
          min={1}
          max={Number(pInput) - 1 || 1}
          onChange={e => setQInput(e.target.value)}
          disabled={isAnimating}
          aria-describedby="q-error"
        />
        {errors.q && <span id="q-error" className="error-text">{errors.q}</span>}
      </div>

      <div className="btn-group">
        <button
          id="btn-apply"
          className="btn btn-secondary"
          onClick={handleApply}
          disabled={isAnimating}
        >
          <span>✓</span> Apply
        </button>
        <button
          id="btn-run"
          className="btn btn-primary"
          onClick={() => {
            const errs = validate(pInput, qInput);
            setErrors(errs);
            if (Object.keys(errs).length === 0) {
              const validP = Number(pInput);
              const validQ = Number(qInput);
              onChange(validP, validQ);
              onRun(validP, validQ);
            }
          }}
          disabled={isAnimating}
        >
          {isAnimating ? (
            <><span className="spinner" /> Running…</>
          ) : (
            <><span>▶</span> Run Shift</>
          )}
        </button>
        <button
          id="btn-reset"
          className="btn btn-ghost"
          onClick={() => {
            setErrors({});
            onReset();
          }}
          disabled={isAnimating}
        >
          <span>↺</span> Reset
        </button>
      </div>

      <div className="legend-box">
        <div className="legend-title">Stage Legend</div>
        <div className="legend-item">
          <span className="legend-dot dot-initial" />
          <span>Initial State</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-stage1" />
          <span>After Row Shift (Stage 1)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-stage2" />
          <span>After Col Shift (Stage 2)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-arrow" />
          <span>Movement Arrow</span>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
