const voiceSelect = document.getElementById('voice-select');
const voiceToggle = document.getElementById('voice-toggle');
const chatDisplay = document.getElementById('chat-display');
const bhartiBody = document.getElementById('bharti-body');
const userInput = document.getElementById('user-input');

let isVoiceOn = true;
let synth = window.speechSynthesis;
let voices = [];

// 1. Voice Load Karna (Hindi Filters)
function loadVoices() {
    voices = synth.getVoices();
    // Sirf Hindi ya acchi sounding female voices filter karein
    const hindiVoices = voices.filter(v => v.lang.includes('hi') || v.name.includes('Google'));
    
    voiceSelect.innerHTML = hindiVoices.map(v => 
        `<option value="${v.name}">${v.name} (${v.lang})</option>`
    ).join('');
}

if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

// 2. Bharti ka Bolna
function speak(text) {
    if (!isVoiceOn) return;

    synth.cancel(); // Purani aawaaz band karein
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Selected voice set karein
    const selectedVoice = voices.find(v => v.name === voiceSelect.value);
    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.pitch = 1.2; // Thodi ladki jaisi aawaaz ke liye
    utterance.rate = 1.0;

    utterance.onstart = () => bhartiBody.classList.add('is-talking');
    utterance.onend = () => bhartiBody.classList.remove('is-talking');

    synth.speak(utterance);
}

// 3. Voice ON/OFF Toggle
voiceToggle.onclick = () => {
    isVoiceOn = !isVoiceOn;
    voiceToggle.innerText = isVoiceOn ? "Voice: ON" : "Voice: OFF";
    voiceToggle.className = isVoiceOn ? "on" : "off";
    if (!isVoiceOn) synth.cancel();
};

// 4. API se Connect Karna
async function handleChat() {
    const msg = userInput.value.trim();
    if (!msg) return;

    chatDisplay.innerHTML += `<p><b>Aap:</b> ${msg}</p>`;
    userInput.value = "";

    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: msg })
        });
        const data = await response.json();
        
        chatDisplay.innerHTML += `<p style="color:blue"><b>Bharti:</b> ${data.reply}</p>`;
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        
        speak(data.reply);
    } catch (e) {
        console.error("Error:", e);
    }
}

document.getElementById('send-btn').onclick = handleChat;

// Speech to Text (Mic)
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {
    const rec = new Recognition();
    rec.lang = 'hi-IN';
    document.getElementById('mic-btn').onclick = () => rec.start();
    rec.onresult = (e) => {
        userInput.value = e.results[0][0].transcript;
        handleChat();
    };
}
