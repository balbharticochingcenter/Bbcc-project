let scene, camera, renderer, bodyGroup, leftArm, rightArm, head;
let isTalking = false;
let clock = new THREE.Clock();

// --- 1. 3D Humanoid Body Creation (No Files Needed) ---
function init3D() {
    const container = document.getElementById('canvas-container');
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

    // Torso (Body)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0x3498db }));
    torso.position.y = 0.8;
    bodyGroup.add(torso);

    // Head
    head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 1.35;
    bodyGroup.add(head);

    // Arms
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

    // Idle Movement (Breathe)
    bodyGroup.position.y = Math.sin(time) * 0.05;
    
    // Talking Movement
    if (isTalking) {
        head.scale.y = 1 + Math.sin(time * 10) * 0.1; // Mouth opening effect
        leftArm.rotation.z = Math.sin(time * 5) * 0.5;
        rightArm.rotation.z = -Math.sin(time * 5) * 0.5;
    } else {
        head.scale.y = 1;
        leftArm.rotation.z = 0;
        rightArm.rotation.z = 0;
    }

    renderer.render(scene, camera);
}

// --- 2. MULTI-VOICE HINDI LOGIC (6 Voices) ---
const voiceSelect = document.getElementById('voice-select');
const synth = window.speechSynthesis;
let isVoiceOn = true;

function loadVoices() {
    const allVoices = synth.getVoices();
    // 5-6 Hindi aur Indian accented voices filter karna
    const filtered = allVoices.filter(v => 
        v.lang.includes('hi') || 
        v.name.includes('India') || 
        v.name.includes('Google') ||
        v.name.includes('Microsoft')
    ).slice(0, 6);

    voiceSelect.innerHTML = filtered.map(v => `<option value="${v.name}">${v.name}</option>`).join('');
}

if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(text) {
    if (!isVoiceOn) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const selectedVoice = synth.getVoices().find(v => v.name === voiceSelect.value);
    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.onstart = () => { isTalking = true; };
    utterance.onend = () => { isTalking = false; };
    
    synth.speak(utterance);
}

// --- 3. CHAT HANDLER ---
async function handleChat() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const msg = input.value.trim();
    if(!msg) return;

    chatBox.innerHTML += `<p><b>Aap:</b> ${msg}</p>`;
    input.value = "";

    // Replace with your real API endpoint
    try {
        const res = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: msg })
        });
        const data = await res.json();
        chatBox.innerHTML += `<p style="color:blue"><b>Bharti:</b> ${data.reply}</p>`;
        speak(data.reply);
    } catch(e) {
        chatBox.innerHTML += `<p><b>Bharti:</b> Server connect nahi ho pa raha.</p>`;
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById('send-btn').onclick = handleChat;
document.getElementById('voice-toggle').onclick = function() {
    isVoiceOn = !isVoiceOn;
    this.innerText = isVoiceOn ? "Voice: ON" : "Voice: OFF";
    this.classList.toggle('off');
};

window.onload = init3D;
