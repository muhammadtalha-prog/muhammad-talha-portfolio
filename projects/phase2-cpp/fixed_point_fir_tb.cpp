#include <iostream>
#include <iomanip>
#include "fixed_point_fir.hpp"

int main() {
    std::cout << "====================================================\n";
    std::cout << "   Fixed-Point FIR Filter Verification Test Bench   \n";
    std::cout << "====================================================\n\n";

    // 1. Setup a 5-Tap Low-Pass Filter in Q15
    // Ideal floating-point coefficients: [0.10, 0.25, 0.30, 0.25, 0.10] (Sum = 1.0)
    // Scale factor: 2^15 = 32768
    // Fixed-point equivalents:
    // 0.10 * 32768 = 3276.8   -> 3277
    // 0.25 * 32768 = 8192     -> 8192
    // 0.30 * 32768 = 9830.4   -> 9830
    const int16_t coeffs[5] = {3277, 8192, 9830, 8192, 3277};

    // Instantiate filter with 5 taps, using default Q15 scaling
    FixedPointFIR<5, 15> filter(coeffs);

    std::cout << "Filter configured with 5 taps (Q15 format).\n";
    std::cout << "Coefficients: [" 
              << coeffs[0] << ", " 
              << coeffs[1] << ", " 
              << coeffs[2] << ", " 
              << coeffs[3] << ", " 
              << coeffs[4] << "]\n\n";

    // 2. Run Test 1: Impulse Response
    // Feed an impulse of 16384 (which is 0.5 in Q15 representation)
    std::cout << "--- Test 1: Impulse Response Verification ---\n";
    std::cout << "Feeding an impulse of magnitude 16384 (0.5 in Q15)\n";
    
    int16_t impulseInput[8] = {16384, 0, 0, 0, 0, 0, 0, 0};
    int16_t expectedOutputs[8] = {1639, 4096, 4915, 4096, 1639, 0, 0, 0}; // Input * Coeff / 32768 (rounded)
    
    bool test1Passed = true;
    std::cout << std::setw(8) << "Sample" << " | "
              << std::setw(8) << "Input" << " | "
              << std::setw(10) << "Output" << " | "
              << std::setw(10) << "Expected" << " | "
              << "Status\n";
    std::cout << "-----------------------------------------------------\n";

    for (int i = 0; i < 8; ++i) {
        int16_t out = filter.filter(impulseInput[i]);
        bool matched = (out == expectedOutputs[i]);
        if (!matched) {
            test1Passed = false;
        }

        std::cout << std::setw(8) << i << " | "
                  << std::setw(8) << impulseInput[i] << " | "
                  << std::setw(10) << out << " | "
                  << std::setw(10) << expectedOutputs[i] << " | "
                  << (matched ? "PASSED" : "FAILED") << "\n";
    }
    std::cout << "Impulse Response Test: " << (test1Passed ? "SUCCESS" : "FAILED") << "\n\n";

    // 3. Run Test 2: Saturation/Clipping Prevention
    // Reset filter states first
    filter.reset();
    std::cout << "--- Test 2: Accumulator Saturation Verification ---\n";
    std::cout << "Feeding full-scale signals to force arithmetic overflow.\n";
    std::cout << "Without saturation, values wrap and distort. With saturation, they clamp.\n";

    // Feed sequential max values: 32767
    int16_t dcInput[6] = {32767, 32767, 32767, 32767, 32767, 32767};
    
    std::cout << "\n" << std::setw(8) << "Sample" << " | "
              << std::setw(8) << "Input" << " | "
              << std::setw(10) << "Output" << " | "
              << "Saturation Check\n";
    std::cout << "-----------------------------------------------------\n";

    for (int i = 0; i < 6; ++i) {
        int16_t out = filter.filter(dcInput[i]);
        std::cout << std::setw(8) << i << " | "
                  << std::setw(8) << dcInput[i] << " | "
                  << std::setw(10) << out << " | "
                  << (out == 32767 ? "Clamped to Max (Safe)" : "Transient/Rising") << "\n";
    }

    std::cout << "\nTest bench validation sequence finished.\n";
    std::cout << "====================================================\n";

    return (test1Passed ? 0 : 1);
}
