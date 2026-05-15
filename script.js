import * as THREE from 'three';

let scene, camera, renderer, analyser, dataArray;
let particles = [];
const maxParticles = 200; // Raised for a denser tunnel
const clock = new THREE.Clock();

function init() {
    // SCENE SETUP
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // Tighter fog creates an intense "emerging from the dark" effect
    scene.fog = new THREE.FogExp2(0x000000, 0.015);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    const fileInput = document.getElementById('upload');
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            setupAudio(e.target.files[0]);
            document.querySelector('.custom-upload').style.display = 'none';
            document.getElementById('song-title').innerText = e.target.files[0].name.split('.')[0];
            document.getElementById('song-title').style.opacity = "0.4";
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

    analyser.fftSize = 512; 
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function spawnCube(freqValue, range) {
    if (particles.length >= maxParticles) return;

    const geo = new THREE.BoxGeometry(1, 1, 1);
    // Using Wireframe + Basic Material for that clean retro sci-fi grid look
    const mat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.7 });
    const cube = new THREE.Mesh(geo, mat);

    // Arranging spawns in a ring configuration rather than a chaotic block
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 25; 
    const spawnX = Math.cos(angle) * radius;
    const spawnY = Math.sin(angle) * radius;

    cube.position.set(spawnX, spawnY, -150); 

    cube.userData = {
        speed: 20 + Math.random() * 30, // Uniform base speed forward
        vRot: new THREE.Vector3(Math.random() * 1.5, Math.random() * 1.5, Math.random() * 1.5),
        range: range,
        baseScale: 0.5 + Math.random() * 2
    };

    if (range === 'bass') {
        cube.material.color.setHSL(0.85, 1, 0.6); // Hot Pink
    } else if (range === 'mid') {
        cube.material.color.setHSL(0.55, 1, 0.6);  // Cyan Blue
    } else {
        cube.material.color.setHSL(0.12, 1, 0.6); // Neon Orange
    }

    scene.add(cube);
    particles.push(cube);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    let bass = 0, mid = 0, treble = 0;

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);

        // Sampling averages instead of single pinpoint index nodes for smoother data
        bass = dataArray[2] / 255;   
        mid = dataArray[30] / 255;   
        treble = dataArray[100] / 255;  

        // Spawn mechanics relative to beat intensity
        if (bass > 0.6) spawnCube(bass, 'bass');
        if (mid > 0.5 && Math.random() > 0.7) spawnCube(mid, 'mid');
        if (treble > 0.4 && Math.random() > 0.8) spawnCube(treble, 'treble');
    }

    // Loop backwards to safely delete meshes mid-flight without destroying the array index
    for (let i = particles.length - 1; i >= 0; i--) {
        const cube = particles[i];
        
        // Move forward along the Z axis
        cube.position.z += cube.userData.speed * delta;
        
        // Constant rotating motion
        cube.rotation.x += cube.userData.vRot.x * delta;
        cube.rotation.y += cube.userData.vRot.y * delta;

        // LIVE REAL-TIME PULSATION FILTER
        let currentScale = cube.userData.baseScale;
        if (cube.userData.range === 'bass') currentScale += bass * 2.5;
        if (cube.userData.range === 'mid') currentScale += mid * 1.8;
        if (cube.userData.range === 'treble') currentScale += treble * 1.2;
        
        cube.scale.set(currentScale, currentScale, currentScale);

        // Clean arrays up once the object passes behind the camera viewport
        if (cube.position.z > 15) {
            scene.remove(cube);
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
