// --- Three.js Setup ---
let scene, camera, renderer, model, mixer;
let idleAction, talkingAction;
const clock = new THREE.Clock();

function initThreeJS() {
    const container = document.getElementById('threejs-canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x81d4fa); // Match CSS background

    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 2); // Adjust camera position for full body view

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);

    // Load GLB Model
    const gltfLoader = new THREE.GLTFLoader();
    gltfLoader.load('./assets/humanoid.glb', (gltf) => {
        model = gltf.scene;
        model.scale.set(0.8, 0.8, 0.8); // Adjust scale if needed
        model.position.y = -0.8; // Set model on the floor
        scene.add(model);

        mixer = new THREE.AnimationMixer(model);

        // Load FBX Animations
        const fbxLoader = new THREE.FBXLoader();
        fbxLoader.load('./assets/idle.fbx', (anim) => {
            idleAction = mixer.clipAction(anim.animations[0]);
            idleAction.play();
        });

        fbxLoader.load('./assets/talking.fbx', (anim) => {
            talkingAction = mixer.clipAction(anim.animations[0]);
            talkingAction.setLoop(THREE.LoopRepeat); // Loop the talking animation
            talkingAction.clampWhenFinished = true; // Animation will stop at the end frame if not looping
        });

        animate(); // Start animation loop after model is loaded
    });

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    const container = document.getElementById('threejs-canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
}

// --- Chat & Voice Setup (Previous code se) ---
const voiceSelect = document.getElementById('voice-select');
const voiceToggle = document.getElementById('voice-toggle');
const chatDisplay = document.getElementById('chat-display');
const userInput = document.getElementById('user-input');

let isVoiceOn = true;
let synth = window.speechSynthesis;
let voices = [];

function loadVoices() {
    voices = synth.getVoices();
    const hindiVoices = voices.filter(v => v.lang.includes('hi') || v.name.includes('Google') || v.name.includes('Microsoft'));
    
    voiceSelect.innerHTML = hindiVoices.map(v => 
        `<option value="${v.name}">${v.name} (${v.lang})</option>`
    ).join('');

    // Select a good default Hindi voice if available
    const defaultHindiVoice = hindiVoices.find(v => v.name.includes('Google Hindi') || v.name.includes('hi-IN'));
    if (defaultHindiVoice) {
        voiceSelect.value = defaultHindiVoice.name;
    }
}

// Wait for voices to be loaded
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
} else {
    // Fallback if event not supported or already fired
    setTimeout(loadVoices, 500);
}

function speak(text) {
    if (!isVoiceOn) return;

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const selectedVoice = voices.find(v => v.name === voiceSelect.value);
    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.pitch = 1; // Default pitch
    utterance.rate = 1;

    utterance.onstart = () => {
        if (idleAction) idleAction.stop(); // Stop idle
        if (talkingAction) talkingAction.play(); // Play talking
    };

    utterance.onend = () => {
        if (talkingAction) talkingAction.stop(); // Stop talking
        if (idleAction) idleAction.play(); // Back to idle
    };

    synth.speak(utterance);
}

voiceToggle.onclick = () => {
    isVoiceOn = !isVoiceOn;
    voiceToggle.innerText = isVoiceOn ? "Voice: ON" : "Voice: OFF";
    voiceToggle.className = isVoiceOn ? "on" : "off";
    if (!isVoiceOn) synth.cancel();
};

async function handleChat() {
    const msg = userInput.value.trim();
    if (!msg) return;

    chatDisplay.innerHTML += `<p><b>Aap:</b> ${msg}</p>`;
    userInput.value = "";
    chatDisplay.scrollTop = chatDisplay.scrollHeight;

    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: msg })
        });
        const data = await response.json();
        
        chatDisplay.innerHTML += `<p class="bot-text"><b>Bharti:</b> ${data.reply}</p>`;
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        
        speak(data.reply);
    } catch (e) {
        chatDisplay.innerHTML += `<p class="bot-text">Maaf kijiye, kuch error aa gaya hai.</p>`;
        console.error("Error:", e);
    }
}

document.getElementById('send-btn').onclick = handleChat;
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleChat();
});

// Speech to Text (Mic)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const rec = new SpeechRecognition();
    rec.lang = 'hi-IN';
    document.getElementById('mic-btn').onclick = () => {
        rec.start();
        document.getElementById('mic-btn').textContent = '🔴'; // Indicating recording
    };
    rec.onresult = (e) => {
        userInput.value = e.results[0][0].transcript;
        document.getElementById('mic-btn').textContent = '🎤';
        handleChat();
    };
    rec.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        document.getElementById('mic-btn').textContent = '🎤';
    };
    rec.onend = () => {
        document.getElementById('mic-btn').textContent = '🎤';
    };
} else {
    document.getElementById('mic-btn').style.display = 'none'; // Hide mic if not supported
}

// Initialize Three.js when the window loads
window.onload = initThreeJS;
