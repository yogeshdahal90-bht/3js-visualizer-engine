import * as THREE from 'three';

let scene, camera, renderer, analyser, dataArray;
let particles = [];
const maxParticles = 200; // Keep performance stable
const clock = new THREE.Clock();

function init() {
    // 1. SCENE SETUP (No floor, just void)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // Dark fog makes cubes appear out of nothing in the distance
    scene.fog = new THREE.Fog(0x000000, 10, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10); // Camera in the center

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // 2. INPUT HANDLER
    const fileInput = document.getElementById('upload');
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            setupAudio(e.target.files[0]);
            document.querySelector('.custom-upload').style.display = 'none';
            document.getElementById('song-title').innerText = e.target.files[0].name.split('.')[0];
        }
    });

    window.addEventListener('resize', onWindowResize);
    animate();
}

function setupAudio(file) {
    const audioURL = URL.createObjectURL(file);
    const audio = new Audio(audioURL);
    audio.play();

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    source.connect(analyser);
    analyser.connect(ctx.destination);

    // Bigger FFT means higher frequency resolution
    analyser.fftSize = 512; 
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

// Function to create a new music-reactive cube
function spawnCube(freqValue, range) {
    if (particles.length >= maxParticles) return; // Performance cap

    // Use wireframe for a futuristic look
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.8 });
    const cube = new THREE.Mesh(geo, mat);

    // Spawn point: Far away, scattered across the screen area
    const spawnX = (Math.random() - 0.5) * 60; // Wide spread
    const spawnY = (Math.random() - 0.5) * 40; // High spread
    cube.position.set(spawnX, spawnY, -100); // Start far back in the fog

    // Data to store on the cube for movement logic
    cube.userData = {
        speed: 1 + freqValue * 5, // Lighter hits move slower, heavy hits fly fast
        velocityRotation: new THREE.Euler(Math.random() * 2, Math.random() * 2, 0),
        baseScale: 0.5 + freqValue * 2, // Heavy hits are massive
        rangeType: range // bass, mid, or treble
    };

    cube.scale.set(cube.userData.baseScale, cube.userData.baseScale, cube.userData.baseScale);

    // Define color based on frequency range (using HSL for vibrancy)
    if (range === 'bass') {
        cube.material.color.setHSL(0.9, 1, 0.6); // Deep Pink/Red for Bass
    } else if (range === 'mid') {
        cube.material.color.setHSL(0.5, 1, 0.6); // Cyan/Green for Tempo/Vocals
    } else {
        cube.material.color.setHSL(0.1, 1, 0.7); // Yellow/Orange for Treble/Cymbals
    }

    scene.add(cube);
    particles.push(cube);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta(); // Time since last frame

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);

        // 1. ANALYZE KEY RANGES
        const bass = dataArray[4] / 255;   // Very low end
        const mid = dataArray[40] / 255;   // Rhythm/Snare
        const treble = dataArray[150] / 255; // High hats

        // 2. SPAWN LOGIC based on thresholds
        // (Adjust these sensitivities if it spawns too much or too little)
        if (bass > 0.6) spawnCube(bass, 'bass');
        if (mid > 0.5 && Math.random() > 0.8) spawnCube(mid, 'mid'); // Spawns slightly less often
        if (treble > 0.4 && Math.random() > 0.9) spawnCube(treble, 'treble');
    }

    // 3. CUBE MOVEMENT ENGINE
    for (let i = particles.length - 1; i >= 0; i--) {
        const cube = particles[i];

        // Move toward camera (Z-axis positive) based on its individual speed
        cube.position.z += cube.userData.speed;

        // Spin slightly
        cube.rotation.x += cube.userData.velocityRotation.x * delta;
        cube.rotation.y += cube.userData.velocityRotation.y * delta;

        // Reactive Pulsing: Cubes slightly expand on recent audio hits
        if(analyser) {
            let currentIntensity = dataArray[2] / 255; // General bass throb
            let s = cube.userData.baseScale * (1 + currentIntensity * 0.2);
            cube.scale.set(s, s, s);
        }

        // 4. CLEANUP: Remove cubes that have passed the camera
        if (cube.position.z > 15) {
            scene.remove(cube);
            // Must dispose of materials/geometries to avoid memory leaks
            cube.geometry.dispose();
            cube.material.dispose();
            particles.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
