# Mesh Circular Shift Visualizer

> **Live Demo:** [<!-- TODO: Add Vercel/Netlify URL after deployment -->]()  
> **PDC Assignment 2** — Parallel and Distributed Computing, Semester 6

An interactive web application that simulates and visualizes the **circular q-shift** operation on a **2D mesh topology** in parallel computing.

---

## 🧠 Background

A circular **q-shift** is a fundamental permutation where node `i` transfers its data to node `(i + q) mod p`.

On a **√p × √p mesh**, this is implemented in two stages:

| Stage | Operation | Formula |
|-------|-----------|---------|
| **Stage 1** — Row Shift | Each node shifts right within its row | `rowShift = q mod √p` |
| **Stage 2** — Column Shift | Each node shifts down within its column | `colShift = ⌊q / √p⌋` |

**Why mesh is faster than ring:**
- Ring (naïve) best case: `min(q, p−q)` hops
- Mesh: `(q mod √p) + ⌊q/√p⌋` hops — often significantly fewer

---

## ✨ Features

- **Interactive Controls** — Enter any `p` (perfect square, 4–64) and `q` (1 to p−1) with full validation
- **Step-by-Step Animation** — Animated arrows show Stage 1 (row shift) and Stage 2 (column shift)
- **Before/After State** — Data tables compare initial → after row shift → final state
- **Progress Stepper** — Visual 5-step progress indicator
- **Complexity Panel** — Real-time formulas, bar chart, speedup metrics
- **Dark Glassmorphism UI** — Premium visual design with glow effects

---

## 📁 Project Structure

```
mesh-shift-visualizer/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── MeshGrid.jsx        ← canvas-based grid rendering + animation
│   │   ├── ControlPanel.jsx    ← user inputs with validation
│   │   └── ComplexityPanel.jsx ← real-time analysis panel
│   ├── utils/
│   │   └── shiftLogic.js       ← pure shift algorithm (testable)
│   ├── App.jsx
│   └── index.js
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# Clone the repository
git clone https://github.com/<your-username>/mesh-shift-visualizer.git
cd mesh-shift-visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build       # outputs to dist/
npm run preview     # preview production build locally
```

---

## 🌐 Deployment

This application is deployed on **Vercel** (or Netlify).

**To deploy yourself:**

```bash
# Using Vercel CLI
npm i -g vercel
vercel --prod

# Or using Netlify CLI
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## 🧪 Algorithm Verification

The `shiftLogic.js` module includes a self-verification step after every full shift:

```
afterCol[dst] should equal src = (dst − q + p) mod p
```

The UI displays ✅ verified or ❌ error after animation completes.

---

## 🖥️ Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite 5 |
| Rendering | HTML5 Canvas (MeshGrid) |
| Styling | Vanilla CSS (dark glassmorphism) |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Deployment | Vercel / Netlify |

---

## 📊 Complexity Analysis

The panel shows in real time:

```
Ring steps = min(q, p−q)
Mesh steps = (q mod √p) + ⌊q/√p⌋
```

Example for p=16, q=5:
- Ring: min(5, 11) = **5 steps**
- Mesh: (5 mod 4) + ⌊5/4⌋ = 1 + 1 = **2 steps** → **60% fewer hops**

---

## 👤 Author

**[Your Name]** — [your-email@example.com]  
Semester 6 · Parallel & Distributed Computing
