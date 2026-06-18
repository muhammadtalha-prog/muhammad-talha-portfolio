%% End-to-End QPSK Transceiver & Carrier Synchronization Simulation
% Demonstrating Baseband Communications Engineering & Closed-Loop Synchronization
% Muhammad Talha | ML Engineer & Junior Agent Developer

clear; clc; close all;

fprintf('--- Starting QPSK Transceiver Simulation ---\n');

%% 1. Parameters Setup
numBits = 10000;          % Number of bits to transmit
sps = 8;                  % Samples per symbol (Upsampling factor)
beta = 0.35;              % Roll-off factor for Root-Raised Cosine (RRC) filter
span = 6;                 % RRC filter span in symbols
EbNo_dB = 10;             % Energy per bit to noise power spectral density ratio (dB)
cfo_hz = 0.02;            % Normalized Carrier Frequency Offset (fraction of symbol rate)

%% 2. Generate RRC Filter Coefficients (First-Principles Implementation)
% Formulating RRC coefficients manually to eliminate Communications Toolbox dependency
numTaps = 2 * span * sps + 1;
t = (-span*sps : span*sps) / sps;
h_rrc = zeros(1, numTaps);

for i = 1:numTaps
    ti = t(i);
    if ti == 0
        h_rrc(i) = (1 - beta) + 4*beta/pi;
    elseif abs(ti) == 1 / (4*beta)
        h_rrc(i) = beta/sqrt(2) * ((1+2/pi)*sin(pi/(4*beta)) + (1-2/pi)*cos(pi/(4*beta)));
    else
        numerator = sin(pi*ti*(1-beta)) + 4*beta*ti.*cos(pi*ti*(1+beta));
        denominator = pi*ti.*(1 - (4*beta*ti).^2);
        h_rrc(i) = numerator / denominator;
    end
end
% Normalize energy
h_rrc = h_rrc / sqrt(sum(h_rrc.^2));

%% 3. Transmitter Section
% Generate random bits
txBits = randi([0, 1], 1, numBits);

% Map bits to QPSK symbols (Gray Coding)
% 00 -> exp(j*pi/4), 01 -> exp(j*3*pi/4), 11 -> exp(-j*3*pi/4), 10 -> exp(-j*pi/4)
txSyms = zeros(1, numBits/2);
for k = 1:numBits/2
    b1 = txBits(2*k - 1);
    b2 = txBits(2*k);
    
    I = (2*b1 - 1) / sqrt(2);
    Q = (2*b2 - 1) / sqrt(2);
    txSyms(k) = I + 1j*Q;
end

% Upsample symbols (Zero padding between symbols)
txSymsUpsampled = zeros(1, length(txSyms) * sps);
txSymsUpsampled(1:sps:end) = txSyms;

% RRC Pulse Shaping filter
txSignal = conv(txSymsUpsampled, h_rrc, 'same');

%% 4. Channel Simulation (AWGN + Carrier Frequency Offset)
% Add Carrier Frequency Offset (CFO)
t_vec = 0:length(txSignal)-1;
cfoSignal = txSignal .* exp(1j * 2 * pi * cfo_hz / sps * t_vec);

% Add AWGN noise
snr = EbNo_dB + 10*log10(2) - 10*log10(sps); % Adjust SNR for QPSK + Oversampling
noiseSigma = sqrt(1 / (2 * 10^(snr/10)));
rxSignalNoisy = cfoSignal + noiseSigma * (randn(size(cfoSignal)) + 1j*randn(size(cfoSignal)));

%% 5. Receiver Section
% Matched Filtering (Convolve with RRC filter)
rxSignalMatched = conv(rxSignalNoisy, h_rrc, 'same');

% Extract symbol-rate samples (Downsample back to symbol rate before CFO recovery)
rxSymsNoisy = rxSignalMatched(1:sps:end);

%% 6. Costas Loop for CFO and Phase Synchronization
% Implementing a 2nd-order Costas Loop for QPSK carrier recovery
numSyms = length(rxSymsNoisy);
rxSymsSynced = zeros(1, numSyms);

% Loop parameters (dampened tracking responses)
dampingFactor = 0.707;
targetBandwidth = 0.01;
theta = (targetBandwidth/sps)/(dampingFactor + 0.25/dampingFactor);
d = 1 + 2*dampingFactor*theta + theta^2;
kp = 2*dampingFactor*theta/d; % Proportional Gain
ki = 2*theta^2/d;             % Integral Gain

% Loop states initialization
phaseEst = 0;
freqEst = 0;
loopError = zeros(1, numSyms);
phaseHistory = zeros(1, numSyms);

for n = 1:numSyms
    % Apply current phase correction
    correctedSym = rxSymsNoisy(n) * exp(-1j * phaseEst);
    rxSymsSynced(n) = correctedSym;
    
    % QPSK Phase Error Detector (Decision-Directed)
    % e = Im{y * conj(dec)} = Q*dec_I - I*dec_Q
    decI = sign(real(correctedSym));
    decQ = sign(imag(correctedSym));
    
    % Error calculation
    err = imag(correctedSym) * decI - real(correctedSym) * decQ;
    loopError(n) = err;
    
    % PI Loop Filter update
    freqEst = freqEst + ki * err;
    phaseEst = phaseEst + kp * err + freqEst;
    phaseHistory(n) = phaseEst;
end

%% 7. Demodulate Recovered Symbols to Bits
rxBits = zeros(1, numBits);
for k = 1:numSyms
    sym = rxSymsSynced(k);
    rxBits(2*k - 1) = real(sym) > 0;
    rxBits(2*k)     = imag(sym) > 0;
end

% Compute BER
[~, ber] = biterr(txBits, rxBits);
fprintf('QPSK Demodulation complete. Bit Error Rate (BER): %.4f\n', ber);

%% 8. Plots and Constellation Visualization
figure('Position', [100, 100, 1200, 500]);

% Plot 1: CFO Distorted Noisy Constellation
subplot(1, 3, 1);
plot(real(rxSymsNoisy), imag(rxSymsNoisy), '.', 'Color', [0.8, 0.2, 0.2], 'MarkerSize', 3);
grid on; axis square;
title('1. CFO Noisy Input Constellation');
xlabel('In-Phase (I)'); ylabel('Quadrature (Q)');
xlim([-2, 2]); ylim([-2, 2]);

% Plot 2: Costas Loop Locking error
subplot(1, 3, 2);
plot(loopError, 'Color', [0.1, 0.6, 0.8], 'LineWidth', 1.5);
grid on;
title('2. Costas Loop Phase Error Convergence');
xlabel('Symbol Index'); ylabel('Phase Error (Rad)');

% Plot 3: Synchronized QPSK Constellation (Output)
subplot(1, 3, 3);
plot(real(rxSymsSynced(end-2000:end)), imag(rxSymsSynced(end-2000:end)), '.', 'Color', [0.2, 0.8, 0.2], 'MarkerSize', 4);
grid on; axis square;
title('3. Post-Sync Constellation (Locked)');
xlabel('In-Phase (I)'); ylabel('Quadrature (Q)');
xlim([-2, 2]); ylim([-2, 2]);
hold on;
% Plot ideal constellation positions
plot([-1/sqrt(2), 1/sqrt(2), -1/sqrt(2), 1/sqrt(2)], ...
     [-1/sqrt(2), 1/sqrt(2), 1/sqrt(2), -1/sqrt(2)], 'ko', 'LineWidth', 2, 'MarkerSize', 8);
hold off;
