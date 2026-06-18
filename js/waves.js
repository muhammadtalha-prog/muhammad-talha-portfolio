// Interactive 3D Signal & Neural Wave Grid using Three.js
let scene, camera, renderer;
let gridGeometry, gridLines, gridPoints;
const gridWidth = 40;
const gridHeight = 40;
const spacing = 0.9;
let mouseX = 0, mouseY = 0;
let time = 0;

// Target projected mouse coordinates in 3D
let mouseTarget = new THREE.Vector3(0, 0, 0);
let currentMouseTarget = new THREE.Vector3(0, 0, 0);

// Floating code packets particles
let particleSystem;
const particleCount = 60;
let particlePositions = [];
let particleVelocities = [];

// Initialize Three.js scene
function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, -14, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00f2fe, 2.0, 30);
    pointLight.position.set(0, 0, 8);
    scene.add(pointLight);

    // Create Signal Grid
    createSignalGrid();

    // Create Floating Data Particles
    createDataParticles();

    // Window resize handler
    window.addEventListener('resize', onWindowResize);

    // Mouse movement listener
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // Hide loading screen once initialized
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = 0;
            setTimeout(() => loader.style.display = 'none', 500);
        }, 1000);
    }

    // Start render loop
    animate();
}

function createSignalGrid() {
    const positions = [];
    const indices = [];
    const colors = [];

    // 1. Generate grid vertices
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const posX = (x - gridWidth / 2) * spacing;
            const posY = (y - gridHeight / 2) * spacing;
            positions.push(posX, posY, 0);

            // Set color gradient (Teal at center, Purple at boundaries)
            const distFromCenter = Math.sqrt(posX*posX + posY*posY) / 20;
            const color = new THREE.Color();
            color.setHSL(0.5 + Math.min(distFromCenter * 0.25, 0.3), 1.0, 0.55);
            colors.push(color.r, color.g, color.b);
        }
    }

    // 2. Map grid connections (Line Indices)
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const idx = y * gridWidth + x;
            
            // Connect to right neighbor
            if (x < gridWidth - 1) {
                indices.push(idx, idx + 1);
            }
            // Connect to bottom neighbor
            if (y < gridHeight - 1) {
                indices.push(idx, idx + gridWidth);
            }
        }
    }

    // Build geometry
    gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    gridGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    gridGeometry.setIndex(indices);

    // Material for Grid Lines (Lattice)
    const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending
    });

    gridLines = new THREE.LineSegments(gridGeometry, lineMaterial);
    scene.add(gridLines);

    // Material for Grid Intersection Nodes (Glowing points)
    const pointMaterial = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    gridPoints = new THREE.Points(gridGeometry, pointMaterial);
    scene.add(gridPoints);

    // Initial grid tilt to look like a digital landscape
    gridLines.rotation.x = -Math.PI / 4.5;
    gridPoints.rotation.x = -Math.PI / 4.5;
}

function createDataParticles() {
    const geo = new THREE.BufferGeometry();
    const pos = [];
    const colors = [];

    for (let i = 0; i < particleCount; i++) {
        // Distribute randomly above/around the grid plane
        const px = (Math.random() - 0.5) * 35;
        const py = (Math.random() - 0.5) * 35;
        const pz = Math.random() * 8 - 4; // float depth
        pos.push(px, py, pz);

        // Random velocities
        particleVelocities.push(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            0.01 + Math.random() * 0.03 // float upward
        );

        // Neon teal/purple color mix
        const color = new THREE.Color();
        color.setHSL(Math.random() > 0.5 ? 0.52 : 0.76, 1.0, 0.6);
        colors.push(color.r, color.g, color.b);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.18,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(geo, mat);
    // Rotate to match the grid plane
    particleSystem.rotation.x = -Math.PI / 4.5;
    scene.add(particleSystem);
}

function onMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    updateMouseTarget();
}

function onTouchMove(event) {
    if (event.touches.length > 0) {
        mouseX = event.touches[0].clientX;
        mouseY = event.touches[0].clientY;
        updateMouseTarget();
    }
}

function updateMouseTarget() {
    // Project mouse coordinates onto Z=0 plane
    const vector = new THREE.Vector3(
        (mouseX / window.innerWidth) * 2 - 1,
        -(mouseY / window.innerHeight) * 2 + 1,
        0.5
    );
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    
    // Find intersection with the grid's rotated plane (Y-tilted)
    // For simplicity, project on Z=0 relative to the rotated grid container
    const distance = -camera.position.z / dir.z;
    mouseTarget.copy(camera.position).add(dir.multiplyScalar(distance));
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    time += 0.012;

    // Smoothly ease 3D mouse vector
    currentMouseTarget.lerp(mouseTarget, 0.08);

    // Update Grid Vertices
    const posAttribute = gridGeometry.getAttribute('position');
    const positionsArray = posAttribute.array;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const idx = (y * gridWidth + x) * 3;
            const vx = positionsArray[idx];
            const vy = positionsArray[idx + 1];

            // 1. Base wave structure (Sine wave ripples propagating outward)
            const distFromCenter = Math.sqrt(vx*vx + vy*vy);
            let vz = Math.sin(distFromCenter * 0.4 - time * 2.5) * 0.9;
            
            // Secondary diagonal wave
            vz += Math.cos((vx + vy) * 0.2 - time * 1.5) * 0.4;

            // 2. Mouse Ripple effect (stone thrown in pond)
            // Need to transform mouseTarget to align with tilted grid coordinate frame
            const gridCos = Math.cos(gridLines.rotation.x);
            const gridSin = Math.sin(gridLines.rotation.x);
            
            // Simple projected coordinates
            const rx = currentMouseTarget.x;
            const ry = currentMouseTarget.y / gridCos; // compensate tilt

            const distToMouse = Math.sqrt(Math.pow(vx - rx, 2) + Math.pow(vy - ry, 2));
            const activeRange = 9.0;

            if (distToMouse < activeRange) {
                const ratio = 1.0 - (distToMouse / activeRange);
                // Dynamic ripple phase delay
                vz += Math.sin(time * 6 - distToMouse * 0.75) * 2.8 * ratio;
            }

            positionsArray[idx + 2] = vz;
        }
    }

    posAttribute.needsUpdate = true;

    // Slow atmospheric rotation of grid to add depth
    gridLines.rotation.z = Math.sin(time * 0.05) * 0.05;
    gridPoints.rotation.z = Math.sin(time * 0.05) * 0.05;

    // Update Data Particles
    if (particleSystem) {
        const pPosAttribute = particleSystem.geometry.getAttribute('position');
        const pArray = pPosAttribute.array;

        for (let i = 0; i < particleCount; i++) {
            const idx = i * 3;
            
            // Apply velocities
            pArray[idx] += particleVelocities[idx];
            pArray[idx + 1] += particleVelocities[idx + 1];
            pArray[idx + 2] += particleVelocities[idx + 2];

            // Reset when floating too high
            if (pArray[idx + 2] > 6.0) {
                pArray[idx] = (Math.random() - 0.5) * 35;
                pArray[idx + 1] = (Math.random() - 0.5) * 35;
                pArray[idx + 2] = -4.0;
            }
        }
        pPosAttribute.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

// Start on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init3D, 100);
});
