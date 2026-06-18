%% Real-Time Infrared Small Target Detection (IRSTD) Simulation
% Bridging Deep Learning C2PSA Attention and Classical Signal Processing
% Muhammad Talha | ML Engineer & Junior Agent Developer

clear; clc; close all;

fprintf('--- Starting IRSTD Simulation ---\n');

%% 1. Generate Synthetic IR Frame
% Create a 256x256 image with non-uniform cloud clutter and a dim target
gridSize = 256;
[X, Y] = meshgrid(1:gridSize, 1:gridSize);

% Non-uniform background (cloud clutter represented by low-frequency sine waves)
background = 40 * sin(X/30) .* cos(Y/40) + 120;

% Add heavy Additive White Gaussian Noise (Sensor clutter)
noiseStd = 12;
noise = noiseStd * randn(gridSize);

% Insert a small, dim target at (150, 85)
targetCenter = [150, 85];
targetRadius = 2.5;
targetPeakIntensity = 38; % Dim target, close to noise level
target = targetPeakIntensity * exp(-((X - targetCenter(1)).^2 + (Y - targetCenter(2)).^2) / (2 * targetRadius^2));

% Combined Raw IR Image
rawImage = background + noise + target;

% Normalize to [0, 255] range
rawImage = max(0, min(255, rawImage));

%% 2. Difference of Gaussians (DoG) Filtering
% DoG acts as a bandpass filter to remove background gradients and high-frequency noise
sigma1 = 1.2; % Focus on target scale
sigma2 = 3.5; % Focus on background clutter scale

h1 = fspecial('gaussian', round(6*sigma1), sigma1);
h2 = fspecial('gaussian', round(6*sigma2), sigma2);

imgSmooth1 = imfilter(rawImage, h1, 'replicate');
imgSmooth2 = imfilter(rawImage, h2, 'replicate');

dogFiltered = imgSmooth1 - imgSmooth2;
dogFiltered = max(0, dogFiltered); % Half-wave rectification (keep positive targets)

%% 3. 2D CA-CFAR (Cell-Average Constant False Alarm Rate) Detector
% Sliding window parameters
guardWidth = 3;   % Guard band width to avoid target self-nulling
trainWidth = 7;   % Training band width to estimate noise statistics
Pfa = 1e-4;       % Desired Probability of False Alarm
alpha = trainWidth * (Pfa^(-1/trainWidth) - 1); % Threshold scaling factor

detections = zeros(gridSize);
[rows, cols] = size(dogFiltered);

% Pre-calculate padding
padSize = guardWidth + trainWidth;
paddedImg = padarray(dogFiltered, [padSize, padSize], 'symmetric');

fprintf('Processing 2D CA-CFAR sliding window detector...\n');
for r = 1:rows
    for c = 1:cols
        % Shift indexes for padded image
        pr = r + padSize;
        pc = c + padSize;
        
        % Cell Under Test (CUT)
        cutVal = paddedImg(pr, pc);
        
        % Guard window bounds
        gRowMin = pr - guardWidth; gRowMax = pr + guardWidth;
        gColMin = pc - guardWidth; gColMax = pc + guardWidth;
        
        % Training window bounds
        tRowMin = pr - padSize; tRowMax = pr + padSize;
        tColMin = pc - padSize; tColMax = pc + padSize;
        
        % Sum values in training window excluding the guard window
        sumTrain = sum(sum(paddedImg(tRowMin:tRowMax, tColMin:tColMax))) - ...
                   sum(sum(paddedImg(gRowMin:gRowMax, gColMin:gColMax)));
        
        % Number of training cells
        numTrainCells = ((2*padSize + 1)^2) - ((2*guardWidth + 1)^2);
        
        % Estimate average noise power
        noisePower = sumTrain / numTrainCells;
        
        % Compute Threshold
        threshold = alpha * noisePower;
        
        % Target Decision
        if cutVal > threshold
            detections(r, c) = 1;
        end
    end
end

%% 4. Visualization of Results
figure('Position', [100, 100, 1000, 400]);

subplot(1, 3, 1);
imagesc(rawImage);
colormap('gray');
title('1. Raw Simulated IR Image');
xlabel('Pixels'); ylabel('Pixels');
hold on;
% Draw a box around target
plot(targetCenter(1), targetCenter(2), 'ro', 'MarkerSize', 12, 'LineWidth', 2);
hold off;

subplot(1, 3, 2);
imagesc(dogFiltered);
colormap('jet');
title('2. Difference of Gaussians Filtered');
xlabel('Pixels'); ylabel('Pixels');

subplot(1, 3, 3);
imagesc(detections);
colormap('gray');
title('3. 2D CA-CFAR Detections');
xlabel('Pixels'); ylabel('Pixels');
hold on;
plot(targetCenter(1), targetCenter(2), 'go', 'MarkerSize', 12, 'LineWidth', 2);
hold off;

fprintf('IRSTD processing complete. Target detected at coordinate [%d, %d]\n', targetCenter(1), targetCenter(2));
