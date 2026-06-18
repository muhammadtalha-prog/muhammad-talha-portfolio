# Muhammad Talha | Portfolio & Signal Processing Projects

This repository represents the engineering portfolio of **Muhammad Talha**, specializing in **Real-Time Edge AI, Digital Signal Processing (DSP), and Autonomous AI Agents**. 

It contains a premium single-page portfolio website equipped with a live WebGL 3D animation, and self-contained project directories spanning MATLAB communication links, C++ fixed-point DSP filters, and Streamlit agent diagnostics.

---

## 📂 Repository Structure

The directory is organized into the following component packages:

```
E:/portfolio/
├── index.html                      # Premium Web Portfolio Interface
├── css/
│   └── style.css                   # Glassmorphic Design System Styles
├── js/
│   ├── dragon.js                   # Three.js 3D Dragon Mouse Follower
│   └── main.js                     # Interactive 2D Scope Visualizer & Menu Controls
│
└── projects/
    ├── phase1-matlab/              # Signal Prototyping
    │   ├── irstd_cfar.m            # Difference of Gaussians & CA-CFAR Detector
    │   ├── qpsk_transceiver.m      # Grey-Coded QPSK Link & Costas Loop Sync
    │   └── README.md               # Mathematical explanations
    │
    ├── phase2-cpp/                 # Embedded C++ DSP
    │   ├── fixed_point_fir.hpp     # Templated Q15 circular-buffer FIR Filter
    │   ├── fixed_point_fir_tb.cpp  # Verification Test Bench (Impulse/Saturation)
    │   └── README.md               # Floating-to-Fixed details and compilation
    │
    └── phase3-streamlit/           # Agentic Diagnostics
        ├── baseband_explorer_agent.py # BER Plotter and automated analyzer
        └── README.md               # Dashboard installation & usage guide
```

---

## 🎨 Highlighted Features

### 1. Interactive 3D Web Environment
- **Three.js Dragon Follower:** A procedural 3D dragon utilizing Inverse Kinematics (IK) and spring physics to slither and trace cursor moves in real-time. Employs dynamic point-light reflections and trailing spark particles.
- **Baseband Modulator Scope:** An interactive canvas widget modeling real-time **BPSK, QPSK, and Frequency Modulation (FM)**. Simulates dynamic In-phase/Quadrature (I/Q) constellation diagrams showing noise dispersion clouds based on user-adjustable AWGN sliders.

### 2. High-Performance Algorithms (MATLAB/C++)
- **IRSTD CA-CFAR:** Classical bandpass image filtering and cell-average adaptive thresholding to detect faint point targets in heavy clutter.
- **Costas Loop Synchronization:** Phase-locked loop tracking carrier frequency offset for Gray-coded baseband signals.
- **Embedded FIR Filter:** Non-allocating templated filter using integer math with rounding offsets and saturation clamping.

---

## 🚀 Getting Started

### Local Web Preview
To run the portfolio website locally, open `index.html` directly in any web browser or serve it using a lightweight local server (e.g., Live Server or python's http-server):
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000`.

### Technical Codebases
Refer to the individual `README.md` files inside the `projects/` directories for detailed compilation, setup, and mathematical backgrounds:
- **MATLAB Guide:** [projects/phase1-matlab/README.md](file:///E:/portfolio/projects/phase1-matlab/README.md)
- **C++ Guide:** [projects/phase2-cpp/README.md](file:///E:/portfolio/projects/phase2-cpp/README.md)
- **Streamlit Guide:** [projects/phase3-streamlit/README.md](file:///E:/portfolio/projects/phase3-streamlit/README.md)
