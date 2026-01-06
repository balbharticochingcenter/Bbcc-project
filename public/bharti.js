// SESSION
const sessionID = Math.random().toString(36).slice(2);

// THREE.JS
let scene, camera, renderer, head, leftArm;
let isTalking = false;
let isVoiceOn = true;

const synth = window.speechSynthesis;

// INIT 3D
function init3D() {
    const container = document.getElementById("canvas-container");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
    camera.position.set(0,1.6,4);

    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0xffffff,1);
    light.position.set(0,5,5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040,2));

    const skin = new THREE.MeshStandardMaterial({ color:0xffdbac });
    const bodyMat = new THREE.MeshStandardMaterial({ color:0x3498db });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8,1.2,0.4), bodyMat);
    body.position.y = 0.6;
    scene.add(body);

    head = new THREE.Mesh(new THREE.SphereGeometry(0.3,32,32), skin);
    head.position.y = 1.6;
    scene.add(head);

    leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.8,0.2), skin);
    leftArm.position.set(-0.6,1,0);
    scene.add(leftArm);

    animate();
}

function animate(){
    requestAnimationFrame(animate);
    const t = Date.now()*0.002;

    head.position.y = 1.6 + Math.sin(t)*0.02;

    if(isTalking){
        head.scale.y = 1 + Math.sin(t*15)*0.05;
        leftArm.rotation.x = Math.sin(t*5)*0.3;
    } else {
        head.scale.y = 1;
        leftArm.rotation.x = 0;
    }

    renderer.render(scene,camera);
}

// VOICE
const voiceSelect = document.getElementById("voice-select");

function loadVoices(){
    const voices = synth.getVoices().filter(v=>v.lang.includes("hi")||v.lang.includes("IN"));
    voiceSelect.innerHTML = voices.map(v=>`<option value="${v.name}">${v.name}</option>`).join("");
}
speechSynthesis.onvoiceschanged = loadVoices;

function speak(text){
    if(!isVoiceOn) return;
    synth.cancel();

    const clean = text.replace(/[#*_~`>]/g,"");
    const u = new SpeechSynthesisUtterance(clean);

    u.voice = synth.getVoices().find(v=>v.name===voiceSelect.value);
    u.lang = "hi-IN";
    u.onstart = ()=>isTalking=true;
    u.onend = ()=>isTalking=false;

    synth.speak(u);
}

// CHAT
async function handleChat(){
    const input = document.getElementById("user-input");
    const box = document.getElementById("chat-box");
    const msg = input.value.trim();
    if(!msg) return;

    box.innerHTML += `<p class="user"><b>Aap:</b> ${msg}</p>`;
    input.value = "";

    const res = await fetch("/api/ai-chat",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ prompt:msg, userId:sessionID })
    });

    const data = await res.json();
    box.innerHTML += `<p class="bot"><b>Bharti:</b> ${data.reply}</p>`;
    box.scrollTop = box.scrollHeight;

    speak(data.reply);
}

// MIC
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if(SpeechRecognition){
    const rec = new SpeechRecognition();
    rec.lang = "hi-IN";

    document.getElementById("mic-btn").onclick = ()=>{
        rec.start();
    };

    rec.onresult = e=>{
        document.getElementById("user-input").value = e.results[0][0].transcript;
        handleChat();
    };
}

// TOGGLE
document.getElementById("voice-toggle").onclick = function(){
    isVoiceOn = !isVoiceOn;
    this.textContent = isVoiceOn ? "Voice: ON" : "Voice: OFF";
    this.classList.toggle("off");
    synth.cancel();
};

document.getElementById("send-btn").onclick = handleChat;
document.getElementById("user-input").addEventListener("keydown",e=>{
    if(e.key==="Enter") handleChat();
});

window.onload = ()=>{
    init3D();
    loadVoices();
};
