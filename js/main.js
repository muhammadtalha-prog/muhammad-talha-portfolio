// Main Website Interactivity & Baseband Simulator Engine

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
            
            // Toggle icon animation
            const spans = mobileToggle.querySelectorAll('span');
            if (mobileToggle.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close menu when links are clicked
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                const spans = mobileToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }

    // 2. Project Category Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card-container');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const category = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = 'block';
                    // Trigger small fade-in
                    setTimeout(() => card.style.opacity = '1', 50);
                } else {
                    card.style.opacity = '0';
                    card.style.display = 'none';
                }
            });
        });
    });

    // 3. Scroll Triggered Skill Bar Animations & Active Nav Tracking
    const skillBars = document.querySelectorAll('.skill-progress');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    const observerOptions = {
        threshold: 0.15
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Active nav highlight
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });

                // Skill bar animation activation
                if (entry.target.getAttribute('id') === 'skills') {
                    skillBars.forEach(bar => {
                        const targetVal = bar.getAttribute('data-progress');
                        bar.style.width = `${targetVal}%`;
                    });
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));

    // 4. Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Mock submission
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = 'Sending Message...';
            submitBtn.style.pointerEvents = 'none';
            
            setTimeout(() => {
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
                submitBtn.style.background = 'linear-gradient(135deg, #39ff14, #00f2fe)';
                submitBtn.style.color = '#000';
                contactForm.reset();
                
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.style.color = '';
                    submitBtn.style.pointerEvents = 'auto';
                }, 3000);
            }, 1500);
        });
    }

    // 5. Interactive Baseband Signal Modulator
    initBasebandSimulator();
});

function initBasebandSimulator() {
    const canvas = document.getElementById('sim-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Controls
    const freqSlider = document.getElementById('sim-freq');
    const ampSlider = document.getElementById('sim-amp');
    const noiseSlider = document.getElementById('sim-noise');
    
    const freqVal = document.getElementById('val-freq');
    const ampVal = document.getElementById('val-amp');
    const noiseVal = document.getElementById('val-noise');

    const schemeButtons = document.querySelectorAll('.scheme-btn');

    // State Variables
    let currentScheme = 'qpsk'; // default
    let carrierFreq = parseFloat(freqSlider.value);
    let signalAmp = parseFloat(ampSlider.value);
    let noiseLevel = parseFloat(noiseSlider.value);
    let timeOffset = 0;

    // Constellation history cache for noise trace
    const constellationHistory = [];
    const maxHistory = 35;

    // Setup slider listeners
    freqSlider.addEventListener('input', (e) => {
        carrierFreq = parseFloat(e.target.value);
        freqVal.textContent = carrierFreq + ' Hz';
    });

    ampSlider.addEventListener('input', (e) => {
        signalAmp = parseFloat(e.target.value);
        ampVal.textContent = signalAmp + ' mV';
    });

    noiseSlider.addEventListener('input', (e) => {
        noiseLevel = parseFloat(e.target.value);
        noiseVal.textContent = noiseLevel.toFixed(2);
    });

    // Scheme buttons
    schemeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            schemeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentScheme = btn.getAttribute('data-scheme');
            constellationHistory.length = 0; // Clear trace
        });
    });

    // Digital bits sequence to modulate
    const bits = [1, 0, 1, 1, 0, 1, 0, 0];
    const bitWidth = 80; // Pixels per bit

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }
    
    // Initial size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Main Draw Loop
    function render() {
        if (!canvas) return;
        
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        
        // Clear background
        ctx.fillStyle = '#030508';
        ctx.fillRect(0, 0, width, height);

        // Draw grids
        drawGrids(ctx, width, height);

        // Scope viewport boundaries (Left 65% is Scope, Right 35% is Constellation)
        const scopeWidth = width * 0.65;
        const constStartX = width * 0.65 + 10;
        const constWidth = width * 0.35 - 20;

        // Run simulation equations and draw wave
        drawScopeWave(ctx, scopeWidth, height, carrierFreq, signalAmp, noiseLevel);

        // Draw constellation IQ plot
        drawConstellation(ctx, constStartX, 15, constWidth, height - 30, noiseLevel);

        // Animate horizontal wave drift
        timeOffset += 0.05;
        
        requestAnimationFrame(render);
    }

    function drawGrids(c, w, h) {
        c.strokeStyle = 'rgba(255,255,255,0.02)';
        c.lineWidth = 1;

        // Horizontal Gridlines
        for (let y = 30; y < h; y += 30) {
            c.beginPath();
            c.moveTo(0, y);
            c.lineTo(w, y);
            c.stroke();
        }

        // Scope vertical separators
        c.strokeStyle = 'rgba(255,255,255,0.08)';
        c.beginPath();
        c.moveTo(w * 0.65, 0);
        c.lineTo(w * 0.65, h);
        c.stroke();
    }

    function drawScopeWave(c, w, h, freq, amp, noise) {
        const centerY = h / 2;
        
        // Draw baseline axis
        c.strokeStyle = 'rgba(255,255,255,0.1)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(10, centerY);
        c.lineTo(w - 10, centerY);
        c.stroke();

        // Draw bit overlay text and separator boundaries
        c.font = 'bold 10px "Space Grotesk"';
        c.fillStyle = 'rgba(255, 255, 255, 0.2)';
        
        const activeOffset = timeOffset * 4;
        
        c.strokeStyle = 'rgba(255,255,255,0.04)';
        c.lineWidth = 1;
        
        for (let i = 0; i < bits.length + 2; i++) {
            const bx = (i * bitWidth) - (activeOffset % bitWidth);
            if (bx > 0 && bx < w) {
                c.beginPath();
                c.moveTo(bx, 10);
                c.lineTo(bx, h - 10);
                c.stroke();
            }
        }

        // Generate and draw Waveform
        c.strokeStyle = '#00f2fe';
        c.lineWidth = 2.5;
        c.shadowColor = 'rgba(0, 242, 254, 0.4)';
        c.shadowBlur = 8;
        c.beginPath();

        let initialized = false;

        for (let x = 10; x < w - 10; x++) {
            // Determine active bit at location x
            const bitIndex = Math.floor((x + activeOffset) / bitWidth) % bits.length;
            const activeBit = bits[bitIndex];
            
            // Time variable mapping to x
            const t = (x + activeOffset) * 0.05;
            
            // Calculate base carrier signal
            let signal = 0;
            const carrier = Math.sin(t * freq * 0.2);

            if (currentScheme === 'bpsk') {
                // BPSK: Modulates phase by 0 or PI. Phase offset = bit is 0 ? PI : 0.
                // Amplitude * carrier * (bit value mapped to 1 or -1)
                const mappedVal = activeBit === 1 ? 1 : -1;
                signal = amp * 0.6 * mappedVal * Math.sin(t * freq * 0.2);
            } 
            else if (currentScheme === 'qpsk') {
                // QPSK: Pairs of bits. We mock 2 bits mapping to 4 symbols.
                // Get next bit for pairs
                const nextBit = bits[(bitIndex + 1) % bits.length];
                const iVal = activeBit === 1 ? 1 : -1;
                const qVal = nextBit === 1 ? 1 : -1;
                
                // QPSK wave formula: I * cos(wt) - Q * sin(wt)
                const cosC = Math.cos(t * freq * 0.2);
                const sinC = Math.sin(t * freq * 0.2);
                signal = amp * 0.5 * (iVal * cosC - qVal * sinC);
            } 
            else if (currentScheme === 'fm') {
                // FM Modulation
                // Modulating wave: low frequency sine representing data smoothing
                const modFreq = 0.05;
                const modVal = Math.sin(t * modFreq);
                // Frequency is changed dynamically by modulator
                signal = amp * 0.6 * Math.sin(t * freq * 0.15 + 4 * modVal);
            }

            // Inject Additive White Gaussian Noise
            const randNoise = (Math.random() - 0.5) * noise * 60;
            const y = centerY + signal + randNoise;

            if (!initialized) {
                c.moveTo(x, y);
                initialized = true;
            } else {
                c.lineTo(x, y);
            }
        }
        c.stroke();
        c.shadowBlur = 0; // Reset shadow
    }

    function drawConstellation(c, startX, startY, width, height, noise) {
        const centerCX = startX + width / 2;
        const centerCY = startY + height / 2;
        const radius = Math.min(width, height) * 0.4;

        // Draw I-Q Axes
        c.strokeStyle = 'rgba(255,255,255,0.06)';
        c.lineWidth = 1.5;
        
        c.beginPath();
        c.moveTo(centerCX - radius * 1.1, centerCY);
        c.lineTo(centerCX + radius * 1.1, centerCY);
        c.moveTo(centerCX, centerCY - radius * 1.1);
        c.lineTo(centerCX, centerCY + radius * 1.1);
        c.stroke();

        // Axis Label text
        c.font = '9px "Space Grotesk"';
        c.fillStyle = 'rgba(255,255,255,0.2)';
        c.fillText('In-Phase (I)', centerCX + radius * 0.7, centerCY - 5);
        c.fillText('Quadrature (Q)', centerCX + 5, centerCY - radius * 0.9);

        // Determine target ideal constellation coordinates based on active scheme
        const idealPoints = [];
        if (currentScheme === 'bpsk') {
            idealPoints.push({ x: 1, y: 0 }, { x: -1, y: 0 });
        } else if (currentScheme === 'qpsk') {
            const factor = Math.SQRT1_2;
            idealPoints.push(
                { x: factor, y: factor },
                { x: -factor, y: factor },
                { x: factor, y: -factor },
                { x: -factor, y: -factor }
            );
        } else if (currentScheme === 'fm') {
            // FM sweeps continuous phase, draw circle outline
            c.strokeStyle = 'rgba(0, 242, 254, 0.08)';
            c.lineWidth = 1;
            c.beginPath();
            c.arc(centerCX, centerCY, radius, 0, Math.PI * 2);
            c.stroke();
        }

        // Draw Ideal points
        c.fillStyle = 'rgba(255, 255, 255, 0.15)';
        idealPoints.forEach(p => {
            c.beginPath();
            c.arc(centerCX + p.x * radius, centerCY - p.y * radius, 4, 0, Math.PI * 2);
            c.fill();
        });

        // Determine current sample point based on clock sequence
        let currentTarget = { x: 0, y: 0 };
        const activeBitIndex = Math.floor((timeOffset * 4) / bitWidth) % bits.length;
        
        if (currentScheme === 'bpsk') {
            const activeBit = bits[activeBitIndex];
            currentTarget.x = activeBit === 1 ? 1 : -1;
            currentTarget.y = 0;
        } else if (currentScheme === 'qpsk') {
            const activeBit = bits[activeBitIndex];
            const nextBit = bits[(activeBitIndex + 1) % bits.length];
            const factor = Math.SQRT1_2;
            currentTarget.x = activeBit === 1 ? factor : -factor;
            currentTarget.y = nextBit === 1 ? factor : -factor;
        } else if (currentScheme === 'fm') {
            // FM drifts along circle boundary
            currentTarget.x = Math.cos(timeOffset * 0.8);
            currentTarget.y = Math.sin(timeOffset * 0.8);
        }

        // Add Noise offset to sample
        const nx = (Math.random() - 0.5) * noise * 0.8;
        const ny = (Math.random() - 0.5) * noise * 0.8;
        
        const noisySample = {
            x: centerCX + (currentTarget.x + nx) * radius,
            y: centerCY - (currentTarget.y + ny) * radius
        };

        // Cache historical trace points
        constellationHistory.push(noisySample);
        if (constellationHistory.length > maxHistory) {
            constellationHistory.shift();
        }

        // Draw trailing decay points
        constellationHistory.forEach((pt, idx) => {
            const lifeRatio = idx / constellationHistory.length;
            c.fillStyle = `rgba(118, 75, 162, ${lifeRatio * 0.45})`;
            c.beginPath();
            c.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
            c.fill();
        });

        // Draw Active floating target crosshair
        c.strokeStyle = '#39ff14';
        c.lineWidth = 1.5;
        c.shadowColor = 'rgba(57, 255, 20, 0.4)';
        c.shadowBlur = 6;
        
        c.beginPath();
        // horizontal bar
        c.moveTo(noisySample.x - 6, noisySample.y);
        c.lineTo(noisySample.x + 6, noisySample.y);
        // vertical bar
        c.moveTo(noisySample.x, noisySample.y - 6);
        c.lineTo(noisySample.x, noisySample.y + 6);
        c.stroke();
        
        c.shadowBlur = 0; // reset
    }

    // Launch loop
    render();
}
