import * as THREE from 'three';

let scene, camera, renderer, analyser, dataArray;
let particles = [];
const maxParticles = 150; 
const clock = new THREE.Clock();

function init() {
    // SCENE SETUP
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 10, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

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

    analyser.fftSize = 512; 
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function spawnCube(freqValue, range) {
    if (particles.length >= maxParticles) return;

    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.8 });
    const cube = new THREE.Mesh(geo, mat);

    const spawnX = (Math.random() - 0.5) * 50; 
    const spawnY = (Math.random() - 0.5) * 30; 
    cube.position.set(spawnX, spawnY, -100); 

    cube.userData = {
        speed: 0.5 + freqValue * 4, 
        vRot: new THREE.Euler(Math.random() * 2, Math.random() * 2, 0),
        baseScale: 0.5 + freqValue * 3,
        range: range
    };

    if (range === 'bass') {
        cube.material.color.setHSL(0.85, 1, 0.6); // Pink/Purple
    } else if (range === 'mid') {
        cube.material.color.setHSL(0.5, 1, 0.6);  // Cyan
    } else {
        cube.material.color.setHSL(0.15, 1, 0.6); // Yellow/Orange
    }

    scene.add(cube);
    particles.push(cube);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);

        const bass = dataArray[4] / 255;   
        const mid = dataArray[40] / 255;   
        const treble = dataArray[150] / 255; 

        // Spawn triggers
        if (bass > 0.65) spawnCube(bass, 'bass');
        if (mid > 0.5 && Math.random() > 0.8) spawnCube(mid, 'mid');
        if (treble > 0.4 && Math.random() > 0.9) spawnCube(treble, 'treble');
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const cube = particles[i];
        cube.position.z += cube.userData.speed;
        cube.rotation.x += cube.userData.vRot.x * delta;
        cube.rotation.y += cube.userData.vRot.y * delta;

        // Cleanup
        if (cube.position.z > 20) {
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
