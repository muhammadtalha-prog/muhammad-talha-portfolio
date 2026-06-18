# Phase 1: The MATLAB Bridge (Signal Prototyping)

This directory contains MATLAB reference implementations for testing, simulating, and validating signal processing concepts before deploying them to embedded targets or integrating them with AI engines.

---

## 1. Real-Time Infrared Small Target Detection (IRSTD)
**File:** [`irstd_cfar.m`](file:///E:/portfolio/projects/phase1-matlab/irstd_cfar.m)

### Algorithmic Concept
This simulation models a classical signal processing pipeline that mimics the attention layers of the YOLO11-Nano neural network. It isolates dim point-source targets (IR signatures) from heavy, non-uniform cloud clutter and sensor noise.

```
+-----------+     +---------------+     +--------------+     +-------------+
| Raw Frame | --> | Difference of | --> | 2D CA-CFAR   | --> | Output      |
| (Noisy)   |     | Gaussians Filt|     | Thresholding |     | Detections  |
+-----------+     +---------------+     +--------------+     +-------------+
```

1. **Difference of Gaussians (DoG) Bandpass Filter:**
   Suppresses large-scale slow variations (cloud background) and high-frequency noise using:
   $$DoG(x, y) = G(x, y, \sigma_1) - G(x, y, \sigma_2)$$
   where $\sigma_1 = 1.2$ and $\sigma_2 = 3.5$ define the target and noise boundaries.

2. **2D Constant False Alarm Rate (CFAR) Detector:**
   Uses a sliding window to calculate local noise statistics around a Cell Under Test (CUT), separated by guard cells to avoid target self-nulling, and training cells to establish a dynamic noise floor.
   $$T = \alpha \times P_{\text{noise}}$$
   If $CUT > T$, a detection flag is raised.

---

## 2. Grey-Coded QPSK Transceiver & Costas Loop
**File:** [`qpsk_transceiver.m`](file:///E:/portfolio/projects/phase1-matlab/qpsk_transceiver.m)

### Algorithmic Concept
An end-to-end baseband QPSK transceiver simulation implementing Gray-mapped constellations, root-raised cosine pulse shaping, carrier tracking, and bit-error testing. Runs completely on standard MATLAB core without needing the Communications Toolbox.

1. **Root-Raised Cosine (RRC) Impulse Response:**
   Calculated manually using the RRC transfer function:
   $$h(t) = \frac{\sin(\pi t (1-\beta)) + 4\beta t \cos(\pi t (1+\beta))}{\pi t (1 - (4\beta t)^2)}$$
   Which shapes symbols to mitigate Inter-Symbol Interference (ISI).

2. **Costas Loop Phase Tracking:**
   Tracks and cancels Carrier Frequency Offset (CFO) dynamically. Uses a Decision-Directed QPSK Phase Error Detector (PED):
   $$e(n) = \text{Im}\{y(n) \times \text{conj}(\hat{d}(n))\}$$
   Fed into a Proportional-Integral (PI) loop filter to continuously adjust the receiver's local phase accumulator.

---

## Execution
Open MATLAB and execute either script:
```matlab
run('irstd_cfar.m')
run('qpsk_transceiver.m')
```
Both files generate diagnostic plots demonstrating signal capture and lock behaviors.
