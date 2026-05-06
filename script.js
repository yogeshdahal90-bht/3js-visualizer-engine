import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

let scene, camera, renderer, analyser, dataArray;
let bars = [];
const BAR_COUNT = 32;

let particleSystem;
const PARTICLE_COUNT = 1500; // Increased for better "Rain" effect

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 25);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 1. Create Equalizer Bars
    for (let i = 0; i < BAR_COUNT; i++) {
        const geometry = new THREE.BoxGeometry(0.8, 1, 0.8);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const bar = new THREE.Mesh(geometry, material);
        
        bar.position.x = (i - BAR_COUNT / 2) * 1.5; 
        scene.add(bar);
        bars.push(bar);
    }

    // 2. Create Particle Rain
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100; // X (Width)
        positions[i * 3 + 1] = Math.random() * 50;      // Y (Height)
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // Z (Depth)
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    const btn = document.getElementById('play-btn');
    btn.addEventListener('click', () => {
        setupAudio();
        btn.style.display = 'none';
    });

    animate();
}

function setupAudio() {
    // !!! CHANGE THIS TO YOUR EXACT FILENAME !!!
    const audio = new Audio('assets/Katy Perry - The One That Got Away (Official Music Video).mp3'); 
    audio.crossOrigin = "anonymous";
    audio.play();

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    source.connect(analyser);
    analyser.connect(ctx.destination);

    analyser.fftSize = 128;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function animate() {
    requestAnimationFrame(animate);

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);

        // Update Bars
        for (let i = 0; i < bars.length; i++) {
            const scale = dataArray[i] * 0.15 + 1; // 0.15 makes it a bit more reactive
            bars[i].scale.y = scale;
            bars[i].position.y = scale / 2;
            bars[i].material.color.setHSL(i / BAR_COUNT, 1, 0.5);
        }

        // Update Particle Rain
        const positions = particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            positions[i * 3 + 1] -= 0.1; // Speed of rain
            if (positions[i * 3 + 1] < -10) positions[i * 3 + 1] = 50; // Reset
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

init();
