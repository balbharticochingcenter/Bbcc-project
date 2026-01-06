let scene, camera, renderer, bodyGroup, leftArm, rightArm, head;
let isTalking = false;
let clock = new THREE.Clock();

// --- 1. 3D Body (Pehle wala same logic) ---
function init3D() {
    const container = document.getElementById('canvas-container');
    if(!container) return;
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 3);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    bodyGroup = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x3498db }));
    torso.position.y = 0.8;
    bodyGroup.add(torso);

    head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 1.35;
    bodyGroup.add(head);

    const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.4, 0.8, 0);
    bodyGroup.add(leftArm);

    rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.4, 0.8, 0);
    bodyGroup.add(rightArm);

    scene.add(bodyGroup);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    let time = Date.now() * 0.002;
    bodyGroup.position.y = Math.sin(time) * 0.05;
    if (isTalking) {
        head.scale.y = 1 + Math.sin(time * 10) * 0.1;
        leftArm.rotation.z = Math.sin(time * 5) * 0.5;
        rightArm.rotation.z = -Math.sin(time * 5) * 0.5;
    } else {
        head.scale.y = 1; leftArm.rotation.z = 0; rightArm.rotation.z = 0;
    }
    renderer.render(scene, camera);
}

// --- 2. ADVANCED VOICE LOGIC ---
const voiceSelect = document.getElementById('voice-select');
const voiceToggle = document.getElementById('voice-toggle');
const synth = window.speechSynthesis;
let isVoiceOn = true; 

function loadVoices() {
    // Duniya ki saari available voices fetch karein
    const allVoices = synth.getVoices();
    
    // Filter: Hindi (hi), India (IN), aur Female sounding names
    const bhartiVoices = allVoices.filter(v => 
        v.lang.includes('hi') || 
        v.lang.includes('IN') || 
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('google') ||
        v.name.toLowerCase().includes('microsoft')
    );

    // Dropdown update karein (Sirf "Bharti 1, Bharti 2..." dikhega)
    voiceSelect.innerHTML = bhartiVoices.map((v, index) => 
        `<option value="${v.name}">Bharti ${index + 1}</option>`
    ).join('');
}

// Chrome aur mobile browsers ke liye zaroori event
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(text) {
    // Sabse pehle purani aawaaz kaato
    synth.cancel();

    // Check: Agar voice off hai toh return ho jao
    if (!isVoiceOn) {
        console.log("Voice is OFF, only text displayed.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Dropdown se selected voice set karein
    const selectedVoiceName = voiceSelect.value;
    const voices = synth.getVoices();
    const actualVoice = voices.find(v => v.name === selectedVoiceName);
    
    if (actualVoice) {
        utterance.voice = actualVoice;
    }

    // Voice Settings
    utterance.lang = 'hi-IN';
    utterance.pitch = 1.1; 
    utterance.rate = 1.0;

    // Animations sync
    utterance.onstart = () => { isTalking = true; };
    utterance.onend = () => { isTalking = false; };
    utterance.onerror = () => { isTalking = false; };

    synth.speak(utterance);
}

// --- 3. VOICE TOGGLE FIX ---
voiceToggle.onclick = function() {
    isVoiceOn = !isVoiceOn; // Variable change karein
    
    if (isVoiceOn) {
        this.innerText = "Voice: ON";
        this.style.background = "#4caf50"; // Green for ON
        this.classList.remove('off');
    } else {
        this.innerText = "Voice: OFF";
        this.style.background = "#6c757d"; // Gray for OFF
        this.classList.add('off');
        synth.cancel(); // Turant bolna band karein
        isTalking = false; // Animation bhi band karein
    }
};

// --- 4. CHAT HANDLER ---
async function handleChat() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const msg = input.value.trim();
    if(!msg) return;

    chatBox.innerHTML += `<div class="user-msg"><b>Aap:</b> ${msg}</div>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: msg })
        });
        const data = await res.json();
        
        chatBox.innerHTML += `<div class="bot-msg" style="color:blue"><b>Bharti:</b> ${data.reply}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Bharti bolegi
        speak(data.reply);
    } catch(e) {
        chatBox.innerHTML += `<p><b>Bharti:</b> Connection error.</p>`;
    }
}

// Enter key support
document.getElementById('user-input').addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleChat();
});

document.getElementById('send-btn').onclick = handleChat;

// Initialize
window.onload = () => {
    init3D();
    loadVoices();
};
