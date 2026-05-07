import * as THREE from 'three';

let scene, camera, renderer, analyser, dataArray;
let leftLeg, rightLeg, floor, botGroup;
let visualizerBars = [];
const clock = new THREE.Clock();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);
    scene.fog = new THREE.Fog(0x000000, 10, 50);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 6, 15);
    camera.lookAt(0, 2, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // 1. THE BOT GROUP (To scale the whole bot at once)
    botGroup = new THREE.Group();
    const botMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
    
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 1), botMat);
    torso.position.y = 3;
    botGroup.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), botMat);
    head.position.y = 4.2;
    botGroup.add(head);

    const legGeo = new THREE.BoxGeometry(0.4, 1.8, 0.4);
    leftLeg = new THREE.Mesh(legGeo, botMat);
    leftLeg.position.set(-0.3, 1.5, 0);
    botGroup.add(leftLeg);

    rightLeg = new THREE.Mesh(legGeo, botMat);
    rightLeg.position.set(0.3, 1.5, 0);
    botGroup.add(rightLeg);
    
    scene.add(botGroup);

    // 2. FREQUENCY RING (Treble reactivity)
    const barGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    for (let i = 0; i < 64; i++) {
        const barMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const bar = new THREE.Mesh(barGeo, barMat);
        
        let angle = (i / 64) * Math.PI * 2;
        let radius = 10;
        bar.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        scene.add(bar);
        visualizerBars.push(bar);
    }

    // 3. THE FLOOR (Mid reactivity)
    const floorGeo = new THREE.PlaneGeometry(100, 100, 50, 50);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true, transparent: true, opacity: 0.5 });
    floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

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

    analyser.fftSize = 256; 
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Walking Motion
    leftLeg.rotation.x = Math.sin(elapsed * 4) * 0.8;
    rightLeg.rotation.x = Math.cos(elapsed * 4) * 0.8;

    // Floor Scroll
    floor.position.z += 0.1;
    if (floor.position.z > 2) floor.position.z = 0;

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);

        // DATA BINS
        const bass = dataArray[2] / 255;      // Low frequencies
        const mid = dataArray[20] / 255;     // Mid frequencies
        const treble = dataArray[50] / 255;  // High frequencies

        // BASS: Bot Scaling & Camera Shake
        const botScale = 1 + bass * 0.5;
        botGroup.scale.set(botScale, botScale, botScale);
        camera.position.y = 6 + (bass * 0.5);

        // MID: Floor Color Shifting
        floor.material.color.setHSL(0.8 + mid * 0.2, 1, 0.5);

        // TREBLE: Ring of Bars
        visualizerBars.forEach((bar, i) => {
            const freqValue = dataArray[i % 60] / 255;
            bar.scale.y = freqValue * 20 + 1;
            bar.position.y = bar.scale.y / 2;
            // Bars turn white on high treble hits
            bar.material.color.setHSL(0.5, 1, 0.5 + (treble * 0.5));
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
