import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

let scene, camera, renderer, terrain, analyser, dataArray;

function init() {
    // 1. THE STAGE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); // Deep black/purple

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 2. THE LANDSCAPE (The "Geometry")
    const geometry = new THREE.PlaneGeometry(100, 100, 64, 64);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xff00ff, // Neon Pink
        wireframe: true 
    });
    terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    scene.add(terrain);

    // 3. START BUTTON (Browser Requirement)
    const btn = document.createElement('button');
    btn.innerHTML = "Play Visualizer";
    btn.style.position = 'absolute';
    btn.style.top = '20px';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
        setupAudio();
        btn.remove();
    });

    animate();
}

function setupAudio() {
    const audio = new Audio('assets/your-song.mp3'); // Put your file path here!
    audio.play();

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    source.connect(analyser);
    analyser.connect(ctx.destination);

    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

function animate() {
    requestAnimationFrame(animate);

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);

        // This is the "Magic": Manipulating the grid with music
        const positions = terrain.geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // We use the audio data to move the Z-height of each point
            // dataArray[i % 128] links specific notes to grid points
            const bounce = dataArray[i % 128] / 10; 
            positions[i + 2] = bounce * Math.sin(i + Date.now() * 0.001);
        }
        terrain.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

init();
