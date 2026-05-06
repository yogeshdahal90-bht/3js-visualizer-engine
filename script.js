import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

let scene, camera, renderer, analyser, dataArray;
let leftLeg, rightLeg, floor;
let obstacles = [];
const clock = new THREE.Clock();

function init() {
    // 1. SCENE SETUP
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x000000, 5, 40); // Fog creates the "fading into memory" look

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 4, 12);
    camera.lookAt(0, 2, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 2. THE BOX BOT (Simple but effective)
    const botMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    
    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 1), botMat);
    torso.position.y = 3;
    scene.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), botMat);
    head.position.y = 4.2;
    scene.add(head);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.4, 1.8, 0.4);
    leftLeg = new THREE.Mesh(legGeo, botMat);
    leftLeg.position.set(-0.3, 1.5, 0);
    scene.add(leftLeg);

    rightLeg = new THREE.Mesh(legGeo, botMat);
    rightLeg.position.set(0.3, 1.5, 0);
    scene.add(rightLeg);

    // 3. THE "TREADMILL" GRID
    const floorGeo = new THREE.PlaneGeometry(100, 100, 40, 40);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });
    floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 4. FLOATING MEMORIES (The Obstacles)
    for (let i = 0; i < 15; i++) {
        const obsGeo = new THREE.BoxGeometry(Math.random() * 2, Math.random() * 8, 0.5);
        const obs = new THREE.Mesh(obsGeo, botMat);
        obs.position.set(
            Math.random() > 0.5 ? 8 : -8, // Side of the path
            obs.geometry.parameters.height / 2, 
            -Math.random() * 60 // Scattered in the distance
        );
        scene.add(obs);
        obstacles.push(obs);
    }

    // 5. INTERACTION HOOK
    const btn = document.getElementById('play-btn');
    btn.addEventListener('click', () => {
        setupAudio();
        btn.style.display = 'none';
        // Make title slightly transparent after clicking
        document.getElementById('song-title').style.opacity = "0.3";
    });

    window.addEventListener('resize', onWindowResize, false);
    animate();
}

function setupAudio() {
    // Exact filename matching your assets folder
    const audio = new Audio('assets/music.mp3');
    audio.crossOrigin = "anonymous";
    audio.play();

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    source.connect(analyser);
    analyser.connect(ctx.destination);

    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // LEG ANIMATION (Walking Speed)
    // 0.8 is the stride length, 4 is the speed of the steps
    leftLeg.rotation.x = Math.sin(elapsed * 4) * 0.8;
    rightLeg.rotation.x = Math.cos(elapsed * 4) * 0.8;

    // FLOOR SCROLL (Creates the movement illusion)
    floor.position.z += 0.15;
    if (floor.position.z > 5) floor.position.z = 0;

    // OBSTACLE MOVEMENT
    obstacles.forEach(obs => {
        obs.position.z += 0.15;
        if (obs.position.z > 15) {
            obs.position.z = -50; // Send back to the start of the horizon
        }
    });

    // AUDIO REACTIVITY
    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        const bass = dataArray[2] / 255; // Reacting to low-end rhythm
        
        // Make the bot grow slightly with the beat
        scene.children.forEach(child => {
            if (child.isMesh && child !== floor) {
                const s = 1 + bass * 0.2;
                child.scale.set(s, s, s);
            }
        });
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
