# Phase 2: The Embedded C++ Bridge (Fixed-Point DSP)

This directory contains hardware-ready, zero-allocation C++ implementations of signal processing algorithms. It demonstrates how to translate high-level MATLAB simulation designs into clean, real-time code optimized for DSP microcontrollers (such as ARM Cortex-M or TI C6000).

---

## 1. Fixed-Point FIR Filter
**File:** [`fixed_point_fir.hpp`](file:///E:/portfolio/projects/phase2-cpp/fixed_point_fir.hpp)

### Design Philosophy
Embedded systems running on microcontrollers or DSP cores frequently lack float hardware (FPU) or have strict speed limits. This filter uses fixed-point representations to speed up math:
- **Zero-allocation:** No dynamic memory allocation (`new`, `malloc`, or `std::vector`) is used.
- **Circular Buffer:** Employs an array-based circular buffer with a sliding write index, avoiding copying sample arrays.
- **Q15 Arithmetic:** Multiplies 16-bit inputs by 16-bit coefficients, generating 32-bit products.
- **Rounding Bias:** Adds $2^{Q-1}$ before shifting down to prevent negative truncation bias.
- **Saturation Protection:** Prevents binary wrap-around (which causes high-amplitude clicking noise) by clamping values that exceed 16-bit limits:
  $$\text{Output} = \max(-32768, \min(32767, \text{Accumulator} \gg 15))$$

---

## 2. Validation Test Bench
**File:** [`fixed_point_fir_tb.cpp`](file:///E:/portfolio/projects/phase2-cpp/fixed_point_fir_tb.cpp)

Tests two critical properties of the filter:
1. **Impulse Response:** Verifies that a unit impulse returns scaled versions of the filter coefficients, confirming mathematical precision.
2. **Saturation:** Validates that feeding consecutive full-scale signals causes the output to clamp safely to maximum limits instead of wrapping around.

---

## Compiling & Running

You can compile this code using any modern C++11 compiler:

### Using GCC / G++ (MinGW/Linux)
```bash
g++ -O3 -std=c++11 fixed_point_fir_tb.cpp -o fixed_point_fir_tb.exe
./fixed_point_fir_tb.exe
```

### Using MSVC (Developer PowerShell/CMD)
```bash
cl /EHsc /O2 fixed_point_fir_tb.cpp /Fe:fixed_point_fir_tb.exe
.\fixed_point_fir_tb.exe
```
