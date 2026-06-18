#ifndef FIXED_POINT_FIR_HPP
#define FIXED_POINT_FIR_HPP

#include <cstdint>
#include <stdexcept>

/**
 * @brief Templated Fixed-Point FIR Filter Class
 * Designed for low-overhead, zero-allocation DSP execution on microcontrollers.
 * 
 * @tparam NTaps Number of filter coefficients/taps
 * @tparam QFormat Scaling factor representing fractions (typically Q15 for 16-bit math)
 */
template <std::size_t NTaps, std::size_t QFormat = 15>
class FixedPointFIR {
public:
    static_assert(QFormat > 0 && QFormat < 31, "QFormat must be between 1 and 30 to prevent integer shifts issues.");
    static_assert(NTaps > 0, "Filter must have at least one tap.");

    /**
     * @brief Construct a new Fixed Point FIR filter
     * @param coeffs Array of NTaps fixed-point filter coefficients
     */
    explicit FixedPointFIR(const int16_t (&coeffs)[NTaps]) {
        for (std::size_t i = 0; i < NTaps; ++i) {
            m_coeffs[i] = coeffs[i];
            m_buffer[i] = 0; // Clear history buffer
        }
        m_writeIdx = 0;
    }

    /**
     * @brief Process a single input sample through the filter
     * @param sample Input sample in int16_t
     * @return int16_t Filtered and saturated output sample
     */
    int16_t filter(int16_t sample) {
        // Write new sample to circular buffer
        m_buffer[m_writeIdx] = sample;

        // Perform Multiply-Accumulate (MAC) using 32-bit accumulator to prevent overflow
        int32_t accumulator = 0;
        std::size_t readIdx = m_writeIdx;

        for (std::size_t i = 0; i < NTaps; ++i) {
            accumulator += static_cast<int32_t>(m_buffer[readIdx]) * static_cast<int32_t>(m_coeffs[i]);
            
            // Circular buffer wrap-around (backward read)
            if (readIdx == 0) {
                readIdx = NTaps - 1;
            } else {
                --readIdx;
            }
        }

        // Advance circular buffer write index
        ++m_writeIdx;
        if (m_writeIdx >= NTaps) {
            m_writeIdx = 0;
        }

        // Apply rounding bias before bit shifting (0.5 in Q-format corresponds to 2^(Q-1))
        int32_t roundingBias = 1 << (QFormat - 1);
        accumulator += roundingBias;

        // Shift down by QFormat to scale back from product format (Q15 * Q15 -> Q30, shift Q15 -> Q15)
        accumulator >>= QFormat;

        // Apply saturation logic to clamp outputs within int16_t bounds
        if (accumulator > 32767) {
            return 32767;
        } else if (accumulator < -32768) {
            return -32768;
        }

        return static_cast<int16_t>(accumulator);
    }

    /**
     * @brief Reset the internal history buffer to zero
     */
    void reset() {
        for (std::size_t i = 0; i < NTaps; ++i) {
            m_buffer[i] = 0;
        }
        m_writeIdx = 0;
    }

private:
    int16_t m_coeffs[NTaps];
    int16_t m_buffer[NTaps];
    std::size_t m_writeIdx;
};

#endif // FIXED_POINT_FIR_HPP
