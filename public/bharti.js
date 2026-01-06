let scene, camera, renderer, head, body, leftArm, rightArm;
let isTalking = false;
let isVoiceOn = true;
const synth = window.speechSynthesis;

// --- 1. 3D Model Creation (Universal - No Files Needed) ---
function init3D() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 4);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Lights
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040, 2));

    // Humanoid Figure
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3498db });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });

    // Torso
    body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), bodyMat);
    body.position.y = 0.6;
    scene.add(body);

    // Head
    head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), skinMat);
    head.position.y = 1.6;
    scene.add(head);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.6, 1, 0);
    scene.add(leftArm);

    rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.6, 1, 0);
    scene.add(rightArm);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    let time = Date.now() * 0.002;

    // Breathing
    head.position.y = 1.6 + Math.sin(time) * 0.02;
    
    if (isTalking) {
        head.scale.y = 1 + Math.sin(time * 15) * 0.05;
        leftArm.rotation.x = Math.sin(time * 5) * 0.2;
    } else {
        head.scale.y = 1;
    }

    renderer.render(scene, camera);
}

// --- 2. Mic / Speech Recognition Fix ---
const micBtn = document.getElementById('mic-btn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;

    micBtn.onclick = () => {
        recognition.start();
        micBtn.classList.add('recording');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('user-input').value = transcript;
        handleChat();
        micBtn.classList.remove('recording');
    };

    recognition.onerror = () => micBtn.classList.remove('recording');
    recognition.onend = () => micBtn.classList.remove('recording');
}

// --- 3. Voice Logic (Original Names) ---
const voiceSelect = document.getElementById('voice-select');

function loadVoices() {
    let voices = synth.getVoices();
    // Filter only Hindi or Indian English
    let filtered = voices.filter(v => v.lang.includes('hi') || v.lang.includes('IN'));
    
    voiceSelect.innerHTML = filtered.map(v => 
        `<option value="${v.name}">${v.name}</option>`
    ).join('');
}

synth.onvoiceschanged = loadVoices;

function speak(text) {
    synth.cancel();
    if (!isVoiceOn) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    utterance.voice = voices.find(v => v.name === voiceSelect.value);
    utterance.lang = 'hi-IN';

    utterance.onstart = () => isTalking = true;
    utterance.onend = () => isTalking = false;

    synth.speak(utterance);
}

// --- 4. Voice Toggle Fix ---
document.getElementById('voice-toggle').onclick = function() {
    isVoiceOn = !isVoiceOn;
    this.innerText = isVoiceOn ? "Voice: ON" : "Voice: OFF";
    this.classList.toggle('off');
    if (!isVoiceOn) {
        synth.cancel();
        isTalking = false;
    }
};

// --- 5. Chat Handler ---
async function handleChat() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const prompt = input.value.trim();
    if (!prompt) return;

    chatBox.innerHTML += `<p class="user"><b>Aap:</b> ${prompt}</p>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        
        // Agar AI response "samajh nahi pa rahi" wala hai, toh check Groq Key in backend
        chatBox.innerHTML += `<p class="bot"><b>Bharti:</b> ${data.reply}</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        speak(data.reply);
    } catch (err) {
        chatBox.innerHTML += `<p class="bot"><b>Bharti:</b> Server issue hai.</p>`;
    }
}

document.getElementById('send-btn').onclick = handleChat;
window.onload = init3D;
