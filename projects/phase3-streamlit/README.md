# Phase 3: The Baseband Explorer Agent (Streamlit Diagnostics)

This directory houses the python-based Streamlit utility designed to automate mathematical verification and diagnostic plotting for digital baseband links.

---

## 1. Diagnostics Dashboard
**File:** [`baseband_explorer_agent.py`](file:///E:/portfolio/projects/phase3-streamlit/baseband_explorer_agent.py)

### Functional Mechanics
In baseband communications, evaluating the Bit Error Rate (BER) against the Energy per Bit to Noise Power Spectral Density ratio ($E_b/N_0$) is the industry-standard method for auditing receiver quality. This dashboard acts as a diagnostic agent:
- **BER vs Eb/No curve plotting:** Takes CSV logs containing experimental BER performance data and plots them.
- **Theoretical Benchmark comparison:** Overlays the mathematical QPSK threshold (calculated via the complimentary error function $\frac{1}{2}\text{erfc}(\sqrt{E_b/N_0})$) to serve as a baseline.
- **Implementation Loss calculation:** Numerically computes the distance (in dB) between measured and ideal curves at selected BER indices (e.g. $10^{-3}$).
- **Automated DSP Analysis:** Generates an engineering report detailing potential sources of loss (such as Costas loop phase noise, timing jitter, or fixed-point quantization noise) and outlines specific recommendations for optimization.

---

## Installation & Running

Ensure you have a Python environment with the required plotting and processing libraries installed:

### Install Dependencies
```bash
pip install streamlit pandas numpy matplotlib
```

### Launch the App
Run the local development server from this directory:
```bash
streamlit run baseband_explorer_agent.py
```
This will open the application in your default browser at `http://localhost:8501`.
