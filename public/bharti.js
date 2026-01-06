const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const avatar = document.getElementById('bharti-visual');

// --- BHARTI KI AAWAZ (Speech Synthesis) ---
function bhartiSpeak(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'hi-IN';
    speech.rate = 1;
    
    // Animation Start
    speech.onstart = () => avatar.classList.add('speaking');
    // Animation End
    speech.onend = () => avatar.classList.remove('speaking');
    
    window.speechSynthesis.speak(speech);
}

// --- VOICE RECOGNITION (STT) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';

    micBtn.onclick = () => {
        recognition.start();
        micBtn.innerText = "🛑";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        micBtn.innerText = "🎤";
        sendMessage();
    };
}

// --- SEND MESSAGE TO BACKEND ---
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Append User Message
    chatBox.innerHTML += `<div class="msg user">${message}</div>`;
    userInput.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: message })
        });

        const data = await response.json();
        const reply = data.reply;

        // Append Bot Message
        chatBox.innerHTML += `<div class="msg bot">${reply}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Bharti Bolegi
        bhartiSpeak(reply);

    } catch (error) {
        chatBox.innerHTML += `<div class="msg bot">Maaf kijiye, kuch error aa gaya hai.</div>`;
    }
}

sendBtn.onclick = sendMessage;

// Enter key support
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});
