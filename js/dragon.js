// 3D Procedural Dragon Cursor Follower using Three.js
let scene, camera, renderer;
let segments = [];
const numSegments = 22;
const segmentSpacing = 0.75;
let mouseTarget = new THREE.Vector3(0, 0, 0);
let mouseX = 0, mouseY = 0;
let time = 0;
let leftWing, rightWing;
let particles = [];
const maxParticles = 40;

// Initialize Three.js scene
function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 25;

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x00f2fe, 0.5);
    mainLight.position.set(0, 10, 10);
    scene.add(mainLight);

    // Create Dragon
    createDragon();

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

function createDragon() {
    for (let i = 0; i < numSegments; i++) {
        // Tapering size from head to tail
        const ratio = i / numSegments;
        const size = i === 0 ? 0.9 : 0.85 * (1 - ratio * 0.8);
        
        const geometry = new THREE.IcosahedronGeometry(size, i === 0 ? 2 : 1);
        
        // Color gradient: Cyan/Blue (Head) to Purple/Indigo (Tail)
        const color = new THREE.Color();
        color.setHSL(0.5 + ratio * 0.25, 1.0, 0.45);
        
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: i === 0 ? 0.6 : 0.25,
            shininess: 80,
            flatShading: true
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, -i * segmentSpacing);
        scene.add(mesh);
        
        segments.push({
            mesh: mesh,
            pos: new THREE.Vector3(0, 0, -i * segmentSpacing),
            size: size
        });
    }

    // Add Dragon Head Details (Eyes, Horns)
    const headMesh = segments[0].mesh;

    // Glowing Neon Green Eyes
    const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x39ff14 });
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.3, 0.25, 0.6);
    headMesh.add(leftEye);
    
    const rightEye = leftEye.clone();
    rightEye.position.set(-0.3, 0.25, 0.6);
    headMesh.add(rightEye);

    // Glowing Horns
    const hornGeo = new THREE.ConeGeometry(0.08, 0.7, 5);
    const hornMat = new THREE.MeshPhongMaterial({ 
        color: 0x00f2fe, 
        emissive: 0x00f2fe,
        emissiveIntensity: 0.4,
        flatShading: true 
    });
    
    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(0.25, 0.6, -0.1);
    leftHorn.rotation.set(0.4, 0, -0.25);
    headMesh.add(leftHorn);
    
    const rightHorn = leftHorn.clone();
    rightHorn.position.set(-0.25, 0.6, -0.1);
    rightHorn.rotation.set(0.4, 0, 0.25);
    headMesh.add(rightHorn);

    // Attach dynamic PointLight to head to light up local page content
    const headLight = new THREE.PointLight(0x00f2fe, 2.0, 16);
    headLight.position.set(0, 0.5, 0.5);
    headMesh.add(headLight);

    // Wings on the 3rd Segment
    const wingSegment = segments[2].mesh;
    
    // Create custom wing shape
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(1.2, 1.5, 2.5, 0.8);
    wingShape.quadraticCurveTo(1.5, -0.2, 0.8, -0.5);
    wingShape.lineTo(0, 0);
    
    const wingGeometry = new THREE.ShapeGeometry(wingShape);
    const wingMaterial = new THREE.MeshPhongMaterial({
        color: 0x764ba2,
        emissive: 0x764ba2,
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
        flatShading: true
    });

    leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0.3, 0, 0);
    wingSegment.add(leftWing);

    rightWing = leftWing.clone();
    rightWing.scale.set(-1, 1, 1);
    rightWing.position.set(-0.3, 0, 0);
    wingSegment.add(rightWing);
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
    // Translate screen coords to 3D world coords on Z=0 plane
    const vector = new THREE.Vector3(
        (mouseX / window.innerWidth) * 2 - 1,
        -(mouseY / window.innerHeight) * 2 + 1,
        0.5
    );
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
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
    
    time += 0.01;
    
    // Smoothly ease head to mouse target
    segments[0].pos.lerp(mouseTarget, 0.09);
    segments[0].mesh.position.copy(segments[0].pos);
    
    // Look ahead direction calculation for head
    if (segments[0].pos.distanceTo(mouseTarget) > 0.1) {
        const lookDir = new THREE.Vector3().subVectors(mouseTarget, segments[0].pos);
        const targetRotation = Math.atan2(lookDir.y, lookDir.x);
        // Ease rotation
        segments[0].mesh.rotation.z += (targetRotation - segments[0].mesh.rotation.z) * 0.1;
        // Tilt based on horizontal movement
        segments[0].mesh.rotation.y += (lookDir.x * 0.15 - segments[0].mesh.rotation.y) * 0.1;
        segments[0].mesh.rotation.x += (-lookDir.y * 0.15 - segments[0].mesh.rotation.x) * 0.1;
    }

    // Link segments with spring kinematics
    for (let i = 1; i < numSegments; i++) {
        const leader = segments[i - 1].pos;
        const current = segments[i].pos;
        
        // Eased follow
        current.lerp(leader, 0.25);
        
        // Keep fixed spacing constraint
        const dist = current.distanceTo(leader);
        if (dist > segmentSpacing) {
            const dir = new THREE.Vector3().subVectors(current, leader).normalize();
            current.copy(leader).addScaledVector(dir, segmentSpacing);
        }
        
        segments[i].mesh.position.copy(current);
        
        // Rotate segment to orient towards the leading segment
        segments[i].mesh.lookAt(leader);
        
        // Minor slither offset wave over time
        const wave = Math.sin(time * 6 - i * 0.4) * 0.06 * (i / numSegments);
        segments[i].mesh.position.y += wave;
    }

    // Flap wings dynamically based on head velocity
    const speed = segments[0].pos.distanceTo(mouseTarget);
    const flapSpeed = 4 + Math.min(speed * 8, 12);
    const flapAngle = Math.sin(time * flapSpeed) * (0.35 + Math.min(speed * 0.3, 0.45));
    
    if (leftWing && rightWing) {
        leftWing.rotation.y = flapAngle;
        rightWing.rotation.y = -flapAngle;
    }

    // Spark Particles from the dragon tail tip
    updateParticles();

    renderer.render(scene, camera);
}

function updateParticles() {
    const tailPos = segments[numSegments - 1].pos;
    
    // Spawn particle at tail position
    if (particles.length < maxParticles && Math.random() < 0.3) {
        const pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        
        // Match tail color gradient
        const pColor = new THREE.Color();
        pColor.setHSL(0.7 + Math.random() * 0.1, 1.0, 0.65);
        
        const pMat = new THREE.MeshBasicMaterial({
            color: pColor,
            transparent: true,
            opacity: 0.9
        });
        
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(tailPos);
        
        // Add random scatter velocity
        pMesh.position.x += (Math.random() - 0.5) * 0.3;
        pMesh.position.y += (Math.random() - 0.5) * 0.3;
        pMesh.position.z += (Math.random() - 0.5) * 0.3;
        
        scene.add(pMesh);
        
        particles.push({
            mesh: pMesh,
            vel: new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05 + 0.04, // light upward float
                (Math.random() - 0.5) * 0.05
            ),
            rotVel: new THREE.Vector3(Math.random() * 0.05, Math.random() * 0.05, Math.random() * 0.05),
            life: 1.0
        });
    }

    // Update and prune particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.add(p.vel);
        p.mesh.rotation.add(p.rotVel);
        
        p.life -= 0.015; // particle decay
        p.mesh.material.opacity = p.life;
        p.mesh.scale.setScalar(p.life);
        
        if (p.life <= 0) {
            scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            particles.splice(i, 1);
        }
    }
}

// Start on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure scripts are parsed
    setTimeout(init3D, 100);
});
