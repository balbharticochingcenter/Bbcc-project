// --- 1. GLOBAL VARIABLES & INITIALIZATION ---
const sessionID = Math.random().toString(36).substring(7); // Har refresh pe nayi memory
let scene, camera, renderer, head, body, leftArm, rightArm;
let isTalking = false;
let isVoiceOn = true;
const synth = window.speechSynthesis;

// --- 2. 3D MODEL CREATION ---
function init3D() {
    const container = document.getElementById('canvas-container');
    if(!container) return;

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

    // Humanoid Figure Materials
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

    // Idle Breathing Movement
    if (head) head.position.y = 1.6 + Math.sin(time) * 0.02;
    
    // Talking Animation
    if (isTalking && head && leftArm) {
        head.scale.y = 1 + Math.sin(time * 15) * 0.05; // Mouth effect
        leftArm.rotation.x = Math.sin(time * 5) * 0.2; // Arm gesture
    } else if (head) {
        head.scale.y = 1;
    }

    renderer.render(scene, camera);
}

// --- 3. VOICE LOGIC (CLEANED & MEMORY COMPATIBLE) ---
const voiceSelect = document.getElementById('voice-select');

function loadVoices() {
    let voices = synth.getVoices();
    // Filter only Hindi or Indian English
    let filtered = voices.filter(v => v.lang.includes('hi') || v.lang.includes('IN'));
    
    if (voiceSelect) {
        voiceSelect.innerHTML = filtered.map(v => 
            `<option value="${v.name}">${v.name}</option>`
        ).join('');
    }
}

// Chrome fix for loading voices
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(text) {
    synth.cancel(); // Purani aawaaz rokein
    if (!isVoiceOn) return;

    // VOICE CLEANING: Bolne se pehle symbols (*, #, _) ko puri tarah hatana
    const cleanText = text.replace(/[#*_~`>]/g, "").replace(/(\r\n|\n|\r)/gm, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synth.getVoices();
    
    // User dwara select ki gayi voice apply karein
    if (voiceSelect) {
        const selectedVoiceName = voiceSelect.value;
        utterance.voice = voices.find(v => v.name === selectedVoiceName);
    }
    
    utterance.lang = 'hi-IN';
    utterance.pitch = 1.0;
    utterance.rate = 1.0;

    utterance.onstart = () => { isTalking = true; };
    utterance.onend = () => { isTalking = false; };
    utterance.onerror = () => { isTalking = false; };

    synth.speak(utterance);
}

// --- 4. CHAT HANDLER (WITH MEMORY & SESSION ID) ---
async function handleChat() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const prompt = input.value.trim();
    
    if (!prompt) return;

    // User message screen pe dikhayein
    chatBox.innerHTML += `<p class="user"><b>Aap:</b> ${prompt}</p>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: prompt,
                userId: sessionID // Backend memory ke liye ID
            })
        });
        
        const data = await res.json();
        
        // Bharti ka reply screen pe aur aawaaz mein
        chatBox.innerHTML += `<p class="bot"><b>Bharti:</b> ${data.reply}</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        
        speak(data.reply);
        
    } catch (e) {
        console.error("Chat Error:", e);
        chatBox.innerHTML += `<p class="bot"><b>Bharti:</b> Connection lost! Server check karein.</p>`;
    }
}

// --- 5. MIC & CONTROLS ---
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
        handleChat(); // Auto send after speaking
        micBtn.classList.remove('recording');
    };

    recognition.onerror = () => micBtn.classList.remove('recording');
    recognition.onend = () => micBtn.classList.remove('recording');
}

// Voice Toggle Button
const voiceToggleBtn = document.getElementById('voice-toggle');
if (voiceToggleBtn) {
    voiceToggleBtn.onclick = function() {
        isVoiceOn = !isVoiceOn;
        this.innerText = isVoiceOn ? "Voice: ON" : "Voice: OFF";
        this.classList.toggle('off');
        if (!isVoiceOn) {
            synth.cancel();
            isTalking = false;
        }
    };
}

// Send button click and Enter key support
document.getElementById('send-btn').onclick = handleChat;
document.getElementById('user-input').addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleChat();
});

// Windows Load
window.onload = () => {
    init3D();
    loadVoices();
};
