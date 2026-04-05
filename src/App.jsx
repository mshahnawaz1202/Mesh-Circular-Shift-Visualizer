import React, { useState, useCallback, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import MeshGrid from './components/MeshGrid';
import ComplexityPanel from './components/ComplexityPanel';
import { computeFullShift, computeShiftParams, initNodes } from './utils/shiftLogic';

/**
 * App — Root component orchestrating state and animation flow.
 *
 * Animation flow:
 *   idle → (Run) → showRowArrows → afterRow → showColArrows → final
 *
 * Stage labels for MeshGrid:
 *   'initial' | 'row' | 'col' | 'final'
 */
function App() {
  const [p, setP] = useState(16);
  const [q, setQ] = useState(5);

  // Computed shift data (populated on run)
  const [shiftData, setShiftData] = useState(null);
  const [animStage, setAnimStage] = useState('idle');
  // 'idle' | 'row-arrows' | 'after-row' | 'col-arrows' | 'final'

  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef([]);

  // Delay helper that stores timeout IDs for cleanup
  const delay = (ms) => new Promise(res => {
    const id = setTimeout(res, ms);
    timeoutRef.current.push(id);
  });

  const clearTimeouts = () => {
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
  };

  const handleChange = useCallback((newP, newQ) => {
    clearTimeouts();
    setIsAnimating(false);
    setAnimStage('idle');
    setShiftData(null);
    setP(newP);
    setQ(newQ);
  }, []);

  const handleReset = useCallback(() => {
    clearTimeouts();
    setIsAnimating(false);
    setAnimStage('idle');
    setShiftData(null);
  }, []);

  const handleRun = useCallback(async (overrideP, overrideQ) => {
    const finalP = typeof overrideP === 'number' ? overrideP : p;
    const finalQ = typeof overrideQ === 'number' ? overrideQ : q;

    clearTimeouts();
    const result = computeFullShift(finalP, finalQ);
    setShiftData(result);
    
    // Sync state in case 'Run Shift' was clicked before 'Apply'
    setP(finalP);
    setQ(finalQ);
    setIsAnimating(true);

    // Stage sequence with timing
    setAnimStage('row-arrows');
    await delay(1400);   // show row arrows
    setAnimStage('after-row');
    await delay(900);    // brief pause showing after-row state
    setAnimStage('col-arrows');
    await delay(1400);   // show col arrows
    setAnimStage('final');
    setIsAnimating(false);
  }, [p, q]);

  // Derive display data and grid stage
  const { data, gridStage, highlightArrows, stageLabel, stageDesc } = (() => {
    const params = computeShiftParams(p, q);
    const initial = initNodes(p);

    if (!shiftData || animStage === 'idle') {
      return {
        data: initial,
        gridStage: 'initial',
        highlightArrows: false,
        stageLabel: 'Initial State',
        stageDesc: `Each node i holds data value i. Ready to apply circular ${q}-shift on a ${params.side}×${params.side} mesh.`,
      };
    }
    if (animStage === 'row-arrows') {
      return {
        data: shiftData.initial,
        gridStage: 'row',
        highlightArrows: true,
        stageLabel: 'Stage 1 — Row Shift',
        stageDesc: `Shifting right by ${params.rowShift} ${params.rowShift === 1 ? 'position' : 'positions'} within each row (q mod √p = ${q} mod ${params.side} = ${params.rowShift}).`,
      };
    }
    if (animStage === 'after-row') {
      return {
        data: shiftData.afterRow,
        gridStage: 'row',
        highlightArrows: false,
        stageLabel: 'Stage 1 Complete',
        stageDesc: `Row shift done. Each node moved right by ${params.rowShift} within its row. Now applying column shift…`,
      };
    }
    if (animStage === 'col-arrows') {
      return {
        data: shiftData.afterRow,
        gridStage: 'col',
        highlightArrows: true,
        stageLabel: 'Stage 2 — Column Shift',
        stageDesc: `Shifting down by ${params.colShift} for normal columns, and ${params.colShift + 1} for wrapped columns.`,
      };
    }
    // final
    return {
      data: shiftData.afterCol,
      gridStage: 'final',
      highlightArrows: false,
      stageLabel: 'Final State ✓',
      stageDesc: `Circular ${q}-shift complete. Node i now holds data from node (i−${q}+p) mod ${p}. Algorithm verified: ${shiftData.valid ? '✅ correct' : '❌ error'}.`,
    };
  })();

  const params = computeShiftParams(p, q);

  const stageSteps = [
    { key: 'idle', label: 'Initial' },
    { key: 'row-arrows', label: 'Row Shift' },
    { key: 'after-row', label: 'Row Done' },
    { key: 'col-arrows', label: 'Col Shift' },
    { key: 'final', label: 'Final' },
  ];
  const currentStepIdx = stageSteps.findIndex(s => s.key === animStage);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⬡</span>
            <div>
              <h1 className="app-title">Mesh Circular Shift Visualizer</h1>
              <p className="app-subtitle">2D Mesh Topology · Parallel Computing · PDC A2</p>
            </div>
          </div>
          <div className="header-badges">
            <span className="badge badge-blue">p = {p}</span>
            <span className="badge badge-purple">q = {q}</span>
            <span className="badge badge-green">{params.side}×{params.side} Mesh</span>
          </div>
        </div>
      </header>

      {/* Progress stepper */}
      <div className="stepper" aria-label="Animation progress">
        {stageSteps.map((step, idx) => (
          <React.Fragment key={step.key}>
            <div className={`step ${idx < currentStepIdx ? 'step-done' : idx === currentStepIdx ? 'step-active' : 'step-pending'}`}>
              <div className="step-dot">{idx < currentStepIdx ? '✓' : idx + 1}</div>
              <span className="step-label">{step.label}</span>
            </div>
            {idx < stageSteps.length - 1 && <div className={`step-line ${idx < currentStepIdx ? 'line-done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Main layout */}
      <main className="main-layout">
        {/* Left: Controls */}
        <aside className="sidebar">
          <ControlPanel
            p={p}
            q={q}
            onChange={handleChange}
            onRun={handleRun}
            onReset={handleReset}
            isAnimating={isAnimating}
          />
          <ComplexityPanel p={p} q={q} />
        </aside>

        {/* Center: Grid visualization */}
        <section className="viz-area">
          <div className={`stage-banner stage-${gridStage}`}>
            <div className="stage-badge">{stageLabel}</div>
            <p className="stage-desc">{stageDesc}</p>
          </div>

          <div className="grid-card">
            <MeshGrid
              key={`${p}-${q}-${animStage}`}
              data={data}
              p={p}
              side={params.side}
              stage={gridStage}
              rowShift={params.rowShift}
              colShift={params.colShift}
              highlightArrows={highlightArrows}
            />
          </div>

          {/* Before/After state tables */}
          {shiftData && animStage === 'final' && (
            <div className="state-tables">
              <StateTable title="Initial" data={shiftData.initial} side={params.side} variant="initial" />
              <div className="arrow-between">→</div>
              <StateTable title="After Stage 1" data={shiftData.afterRow} side={params.side} variant="row" />
              <div className="arrow-between">→</div>
              <StateTable title="Final (After Stage 2)" data={shiftData.afterCol} side={params.side} variant="final" />
            </div>
          )}

          {animStage === 'idle' && (
            <div className="idle-hint">
              <div className="hint-icon">▶</div>
              <p>Configure p and q, then press <strong>Run Shift</strong> to watch the animation.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/** Compact state table showing data at each node position */
function StateTable({ title, data, side, variant }) {
  return (
    <div className={`state-table state-table-${variant}`}>
      <div className="table-title">{title}</div>
      <div className="table-grid" style={{ gridTemplateColumns: `repeat(${side}, 1fr)` }}>
        {data.map((val, idx) => (
          <div key={idx} className="table-cell" title={`Node ${idx} = ${val}`}>
            {val}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
