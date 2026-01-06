let scene, camera, renderer, model, mixer, idleAction, talkingAction;
let isTalking = false;
let clock = new THREE.Clock();

// --- 1. 3D INITIALIZATION (Direct Link Version) ---
function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    
    // Camera settings
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.3, 2.5); // Focus on upper body

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lights (Zaroori hai model dikhne ke liye)
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dLight = new THREE.DirectionalLight(0xffffff, 1);
    dLight.position.set(1, 1, 2);
    scene.add(dLight);

    // --- DIRECT 3D MODEL LINK ---
    // Hum ek universal human model link use kar rahe hain
    const modelUrl = 'https://models.readyplayer.me/64db6e5e8e80629618b76251.glb'; 

    const loader = new THREE.GLTFLoader();
    loader.load(modelUrl, (gltf) => {
        model = gltf.scene;
        model.position.y = -1.1; 
        scene.add(model);

        // Animations settings
        mixer = new THREE.AnimationMixer(model);
        
        // Agar model mein animations inbuilt hain toh wo load hongi
        if (gltf.animations.length > 0) {
            idleAction = mixer.clipAction(gltf.animations[0]);
            idleAction.play();
        }
        
        animate();
    }, 
    (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% loaded'); },
    (error) => { console.error('Error loading 3D model:', error); });

    // --- MOUSE MOVE / ROTATION ---
    let isDragging = false;
    let previousMouseX = 0;

    container.onmousedown = (e) => { isDragging = true; };
    window.onmouseup = (e) => { isDragging = false; };
    window.onmousemove = (e) => {
        if (isDragging && model) {
            let deltaX = e.clientX - previousMouseX;
            model.rotation.y += deltaX * 0.01; // Screen pe move/rotate karne ke liye
        }
        previousMouseX = e.clientX;
    };
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    // Simple breathing movement agar animation nahi mili toh
    if (model && !isTalking) {
        model.position.y = -1.1 + Math.sin(Date.now() * 0.002) * 0.02;
    }
    
    // Talking effect (Head shake)
    if (isTalking && model) {
        model.rotation.y += Math.sin(Date.now() * 0.01) * 0.02;
    }

    renderer.render(scene, camera);
}

// --- 2. VOICE LOGIC (Bharti 1, Bharti 2...) ---
const synth = window.speechSynthesis;
const voiceSelect = document.getElementById('voice-select');
const voiceToggle = document.getElementById('voice-toggle');
let isVoiceOn = true;

function loadVoices() {
    const allVoices = synth.getVoices();
    const bhartiVoices = allVoices.filter(v => v.lang.includes('hi') || v.lang.includes('IN') || v.name.includes('Google'));
    voiceSelect.innerHTML = bhartiVoices.map((v, i) => `<option value="${v.name}">Bharti ${i + 1}</option>`).join('');
}

if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(text) {
    synth.cancel();
    if (!isVoiceOn) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const actualVoice = synth.getVoices().find(v => v.name === voiceSelect.value);
    if (actualVoice) utterance.voice = actualVoice;

    utterance.onstart = () => { isTalking = true; };
    utterance.onend = () => { isTalking = false; };
    synth.speak(utterance);
}

// Voice Toggle Fix
voiceToggle.onclick = () => {
    isVoiceOn = !isVoiceOn;
    voiceToggle.innerText = isVoiceOn ? "Voice: ON" : "Voice: OFF";
    if (!isVoiceOn) {
        synth.cancel();
        isTalking = false;
    }
};

// --- 3. CHAT HANDLER ---
async function handleChat() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const msg = input.value.trim();
    if(!msg) return;

    chatBox.innerHTML += `<div><b>Aap:</b> ${msg}</div>`;
    input.value = "";

    try {
        const res = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: msg })
        });
        const data = await res.json();
        chatBox.innerHTML += `<div style="color:blue"><b>Bharti:</b> ${data.reply}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        speak(data.reply);
    } catch(e) {
        chatBox.innerHTML += `<div><b>Bharti:</b> Error!</div>`;
    }
}

document.getElementById('send-btn').onclick = handleChat;
window.onload = init3D;
