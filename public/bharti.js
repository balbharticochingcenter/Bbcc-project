// SESSION
const sessionID = Math.random().toString(36).slice(2);

// THREE.JS
let scene, camera, renderer, core, ring;
let isTalking = false;
let isVoiceOn = true;

const synth = window.speechSynthesis;

// INIT 3D
function init3D() {
    const container = document.getElementById("canvas-container");

    scene = new THREE.Scene();
    scene.background = null; // CSS handles BG

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 4);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x00ffff, 1.2));
    const pLight = new THREE.PointLight(0x7b2cff, 2, 10);
    pLight.position.set(2, 2, 3);
    scene.add(pLight);

    // AI CORE (Orb)
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.85
    });

    core = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 64, 64),
        coreMat
    );
    scene.add(core);

    // Energy Ring
    ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.03, 16, 100),
        new THREE.MeshBasicMaterial({ color: 0xff2fd6 })
    );
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const t = Date.now() * 0.002;

    core.rotation.y += 0.003;
    ring.rotation.z -= 0.01;

    if (isTalking) {
        core.scale.setScalar(1 + Math.sin(t * 10) * 0.08);
        core.material.emissiveIntensity = 1;
    } else {
        core.scale.setScalar(1);
        core.material.emissiveIntensity = 0.5;
    }

    renderer.render(scene, camera);
}

// VOICE
const voiceSelect = document.getElementById("voice-select");

function loadVoices() {
    const voices = synth.getVoices().filter(v => v.lang.includes("hi") || v.lang.includes("IN"));
    voiceSelect.innerHTML = voices.map(v =>
        `<option value="${v.name}">${v.name}</option>`
    ).join("");
}
speechSynthesis.onvoiceschanged = loadVoices;

function speak(text) {
    if (!isVoiceOn) return;
    synth.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.voice = synth.getVoices().find(v => v.name === voiceSelect.value);
    u.lang = "hi-IN";
    u.onstart = () => isTalking = true;
    u.onend = () => isTalking = false;

    synth.speak(u);
}

// CHAT
async function handleChat() {
    const input = document.getElementById("user-input");
    const box = document.getElementById("chat-box");
    const msg = input.value.trim();
    if (!msg) return;

    box.innerHTML += `<p class="user"><b>Aap:</b> ${msg}</p>`;
    input.value = "";

    const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: msg, userId: sessionID })
    });

    const data = await res.json();
    box.innerHTML += `<p class="bot"><b>Bharti:</b> ${data.reply}</p>`;
    box.scrollTop = box.scrollHeight;

    speak(data.reply);
}

// MIC
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const rec = new SpeechRecognition();
    rec.lang = "hi-IN";

    document.getElementById("mic-btn").onclick = () => rec.start();
    rec.onresult = e => {
        document.getElementById("user-input").value = e.results[0][0].transcript;
        handleChat();
    };
}

// TOGGLE
document.getElementById("voice-toggle").onclick = function () {
    isVoiceOn = !isVoiceOn;
    this.textContent = isVoiceOn ? "Voice: ON" : "Voice: OFF";
    this.classList.toggle("off");
    synth.cancel();
};

document.getElementById("send-btn").onclick = handleChat;
document.getElementById("user-input").addEventListener("keydown", e => {
    if (e.key === "Enter") handleChat();
});

window.onload = () => {
    init3D();
    loadVoices();
};
