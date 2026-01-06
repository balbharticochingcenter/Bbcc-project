let scene, camera, renderer, model, mixer, idleAction, talkingAction;
const clock = new THREE.Clock();

// --- 1. 3D INITIALIZATION ---
function init3D() {
    const container = document.getElementById('threejs-canvas-container');
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.4, 2.5); // Face and chest focus

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const dLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dLight.position.set(0, 1, 1);
    scene.add(dLight);

    // Load 3D Body
    const loader = new THREE.GLTFLoader();
    loader.load('./assets/humanoid.glb', (gltf) => {
        model = gltf.scene;
        model.position.y = -1; 
        scene.add(model);
        mixer = new THREE.AnimationMixer(model);
        loadAnimations();
        animate();
    });
}

function loadAnimations() {
    const fbxLoader = new THREE.FBXLoader();
    // Idle Animation
    fbxLoader.load('./assets/idle.fbx', (anim) => {
        idleAction = mixer.clipAction(anim.animations[0]);
        idleAction.play();
    });
    // Talking Animation
    fbxLoader.load('./assets/talking.fbx', (anim) => {
        talkingAction = mixer.clipAction(anim.animations[0]);
    });
}

function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(clock.getDelta());
    renderer.render(scene, camera);
}

// --- 2. VOICE & CHAT LOGIC ---
const synth = window.speechSynthesis;
let isVoiceOn = true;

function speak(text) {
    if (!isVoiceOn) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';

    utterance.onstart = () => {
        if(talkingAction) { idleAction.stop(); talkingAction.play(); }
    };
    utterance.onend = () => {
        if(talkingAction) { talkingAction.stop(); idleAction.play(); }
    };
    synth.speak(utterance);
}

async function handleChat() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const msg = input.value.trim();
    if(!msg) return;

    chatBox.innerHTML += `<p><b>Aap:</b> ${msg}</p>`;
    input.value = "";

    const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: msg })
    });
    const data = await res.json();

    chatBox.innerHTML += `<p style="color:blue"><b>Bharti:</b> ${data.reply}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    speak(data.reply);
}

document.getElementById('send-btn').onclick = handleChat;
window.onload = init3D;
