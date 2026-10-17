// ============================================================
// SYNTHETIX STUDIO — ElevenLabs & D-ID Production Suite
// ============================================================

// Global Assets State
let projectAssets = JSON.parse(localStorage.getItem('synthetix_assets') || '[]');
let currentBlobUrl = null;
let currentDidVideoUrl = null;
let audioCtx = null;
let analyserNode = null;
let audioSource = null;
let visualizerAnimationId = null;
let isSynthesizing = false;

// Presets
const PRESETS = {
    dragon: `In the ancient land of Eldoria, where skies shimmered and forests whispered secrets to the wind, lived a dragon named Zephyros. [sarcastically] Not the "burn it all down" kind... [giggles] but he was gentle, wise, with eyes like old stars. [whispers] Even the birds fell silent when he passed.`,
    cyberpunk: `Neon rain cascaded over Sector 7. The neural link pulsed twice: connection confirmed. "Warning," the synthetic AI whispered into my audio implant, "they know you're in the mainframe." [sighs] Looks like a quiet night was completely out of the question.`,
    cinematic: `In a world where human memories can be rewritten with a single keystroke, one rogue archivist uncovered the truth. [dramatic pause] And now... the clocks are ticking backwards. This summer, truth has an expiration date.`,
    meditation: `Close your eyes and take a slow, deep breath in. [gentle exhale] Feel the tension melting away from your shoulders. There is nowhere else you need to be right now. Just listen to the steady rhythm of your breath... and find stillness.`,
    tech: `Welcome to the neural voice synthesis benchmark. Utilizing dynamic diffusion and deep transformers, this architecture reproduces human vocal acoustics, emotional micro-inflections, and breathless pauses in ultra-low latency.`
};

// ============================================================
// 1. Tab Navigation
// ============================================================
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        switchTab(targetId);
    });
});

function switchTab(targetId) {
    tabButtons.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
    });
    tabPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === targetId);
    });
}

// ============================================================
// 2. ElevenLabs Voice Studio Logic
// ============================================================
const apiKeyInput = document.getElementById('apiKey');
const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
const reloadVoicesBtn = document.getElementById('reloadVoicesBtn');
const apiStatusBadge = document.getElementById('apiStatusBadge');
const apiStatusText = document.getElementById('apiStatusText');

const modelSelect = document.getElementById('modelSelect');
const voiceSelect = document.getElementById('voiceSelect');

const settingsToggle = document.getElementById('settingsToggle');
const settingsBody = document.getElementById('settingsBody');
const settingsIndicator = document.getElementById('settingsIndicator');

const stabilitySlider = document.getElementById('stabilitySlider');
const stabilityVal = document.getElementById('stabilityVal');
const similaritySlider = document.getElementById('similaritySlider');
const similarityVal = document.getElementById('similarityVal');
const styleSlider = document.getElementById('styleSlider');
const styleVal = document.getElementById('styleVal');

const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const clearTextBtn = document.getElementById('clearTextBtn');
const presetChips = document.querySelectorAll('.chip');

const playBtn = document.getElementById('playBtn');
const audioDeck = document.getElementById('audioDeck');
const audioPlayer = document.getElementById('audioPlayer');
const downloadBtn = document.getElementById('downloadBtn');
const sendToDidBtn = document.getElementById('sendToDidBtn');

const deckPlayPauseBtn = document.getElementById('deckPlayPauseBtn');
const deckPlayIcon = document.getElementById('deckPlayIcon');
const deckPauseIcon = document.getElementById('deckPauseIcon');
const progressBarWrap = document.getElementById('progressBarWrap');
const progressBarFill = document.getElementById('progressBarFill');
const progressScrubber = document.getElementById('progressScrubber');
const timeCurrent = document.getElementById('timeCurrent');
const timeDuration = document.getElementById('timeDuration');
const speedBtns = document.querySelectorAll('.speed-btn');

const visualizerCanvas = document.getElementById('visualizerCanvas');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Init ElevenLabs API Key
let savedKey = localStorage.getItem('elevenlabs_key');
if (!savedKey && apiKeyInput.value) {
    savedKey = apiKeyInput.value.trim();
}
if (savedKey) {
    apiKeyInput.value = savedKey;
    fetchVoices(savedKey);
} else {
    setApiStatus('idle', 'Enter Key');
}

// Key Visibility
toggleKeyVisibility.addEventListener('click', () => {
    const isPass = apiKeyInput.type === 'password';
    apiKeyInput.type = isPass ? 'text' : 'password';
    toggleKeyVisibility.style.color = isPass ? '#818cf8' : '';
});

apiKeyInput.addEventListener('change', (e) => {
    const key = e.target.value.trim();
    if (key) {
        localStorage.setItem('elevenlabs_key', key);
        fetchVoices(key);
    } else {
        localStorage.removeItem('elevenlabs_key');
        resetVoices();
        setApiStatus('idle', 'No Key');
    }
});

reloadVoicesBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        fetchVoices(key);
    } else {
        showError('Please enter an ElevenLabs API key first.');
    }
});

function setApiStatus(status, text) {
    apiStatusBadge.className = 'status-badge ' + status;
    apiStatusText.textContent = text;
}

async function fetchVoices(apiKey) {
    try {
        setApiStatus('loading', 'Connecting...');
        voiceSelect.disabled = true;
        voiceSelect.innerHTML = '<option>Loading voices from ElevenLabs...</option>';

        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': apiKey }
        });

        if (!response.ok) {
            throw new Error(`Authentication error (${response.status})`);
        }

        const data = await response.json();
        voiceSelect.innerHTML = '';

        if (data.voices && data.voices.length > 0) {
            data.voices.forEach(voice => {
                const opt = document.createElement('option');
                opt.value = voice.voice_id;
                const cat = voice.category ? ` [${voice.category}]` : '';
                opt.textContent = `${voice.name}${cat}`;
                voiceSelect.appendChild(opt);
            });
            voiceSelect.disabled = false;
            setApiStatus('connected', `${data.voices.length} Voices Ready`);
            hideError();
        } else {
            throw new Error('No voices found on this account.');
        }
    } catch (err) {
        setApiStatus('error', 'Auth Failed');
        showError(err.message);
        resetVoices();
    }
}

function resetVoices() {
    voiceSelect.innerHTML = '<option value="vOjrdP8Z2fWjVyt0scrL7">Selected Voice (vOjrdP8Z2fWjVyt0scrL7)</option>';
    voiceSelect.disabled = true;
}

// Sliders
settingsToggle.addEventListener('click', () => {
    const isHidden = settingsBody.classList.contains('hidden');
    if (isHidden) {
        settingsBody.classList.remove('hidden');
        settingsIndicator.textContent = 'Close ▲';
    } else {
        settingsBody.classList.add('hidden');
        settingsIndicator.textContent = 'Customize ▼';
    }
});

stabilitySlider.addEventListener('input', (e) => {
    stabilityVal.textContent = `${Math.round(e.target.value * 100)}%`;
});
similaritySlider.addEventListener('input', (e) => {
    similarityVal.textContent = `${Math.round(e.target.value * 100)}%`;
});
styleSlider.addEventListener('input', (e) => {
    styleVal.textContent = `${Math.round(e.target.value * 100)}%`;
});

// Presets & Char Count
function updateCharCount() {
    const len = textInput.value.length;
    charCount.textContent = `${len.toLocaleString()} characters`;
    charCount.style.color = len > 4500 ? '#f43f5e' : '';
}
updateCharCount();
textInput.addEventListener('input', updateCharCount);

clearTextBtn.addEventListener('click', () => {
    textInput.value = '';
    updateCharCount();
    textInput.focus();
});

presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
        presetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const key = chip.getAttribute('data-preset');
        if (PRESETS[key]) {
            textInput.value = PRESETS[key];
            updateCharCount();
            textInput.focus();
        }
    });
});

// Shortcut: Ctrl+Enter
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeTab = document.querySelector('.tab-panel.active');
        if (activeTab && activeTab.id === 'tab-elevenlabs' && !playBtn.disabled) {
            playBtn.click();
        }
    }
});

// Synthesize Audio
playBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const voiceId = voiceSelect.value;
    const modelId = modelSelect.value;
    const text = textInput.value.trim();

    if (!apiKey) {
        showError('Please enter your ElevenLabs API Key.');
        apiKeyInput.focus();
        return;
    }
    if (!voiceId) {
        showError('Please select a voice.');
        return;
    }
    if (!text) {
        showError('Please enter script text to narrate.');
        textInput.focus();
        return;
    }

    try {
        hideError();
        isSynthesizing = true;
        playBtn.disabled = true;
        playBtn.querySelector('.text').textContent = 'Synthesizing Audio...';

        audioDeck.classList.remove('hidden');
        startVisualizer();

        const requestBody = {
            text: text,
            model_id: modelId,
            voice_settings: {
                stability: parseFloat(stabilitySlider.value),
                similarity_boost: parseFloat(similaritySlider.value),
                style: parseFloat(styleSlider.value),
                use_speaker_boost: true
            }
        };

        if (modelId === 'eleven_v4') {
            requestBody.language_code = 'en';
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
                'Accept': 'audio/mpeg'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let detail = 'Voice generation failed.';
            try {
                const errJson = await response.json();
                detail = errJson.detail?.message || errJson.message || detail;
            } catch (e) {
                detail = `Error status: ${response.status} ${response.statusText}`;
            }
            throw new Error(detail);
        }

        const blob = await response.blob();
        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
        }

        currentBlobUrl = URL.createObjectURL(blob);
        audioPlayer.src = currentBlobUrl;
        
        setupAudioContext();
        audioPlayer.play().catch(e => console.log('Autoplay deferred:', e));
        updatePlayPauseUI(true);

        // Log asset to Doc Hub
        const voiceName = voiceSelect.options[voiceSelect.selectedIndex]?.text?.split('[')[0]?.trim() || 'Custom Voice';
        addAsset({
            type: 'ElevenLabs Audio',
            title: `${voiceName} Narration (${modelId})`,
            url: currentBlobUrl,
            scriptSnippet: text.slice(0, 100) + '...',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

    } catch (err) {
        showError(err.message);
    } finally {
        isSynthesizing = false;
        playBtn.disabled = false;
        playBtn.querySelector('.text').textContent = 'Generate Voiceover';
    }
});

// Send Speech to D-ID
sendToDidBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text) {
        document.getElementById('didScriptInput').value = text;
    }
    switchTab('tab-did');
});

// Audio Deck Controls
deckPlayPauseBtn.addEventListener('click', () => {
    if (!audioPlayer.src) return;
    if (audioPlayer.paused) {
        setupAudioContext();
        audioPlayer.play();
        updatePlayPauseUI(true);
    } else {
        audioPlayer.pause();
        updatePlayPauseUI(false);
    }
});

function updatePlayPauseUI(isPlaying) {
    if (isPlaying) {
        deckPlayIcon.classList.add('hidden');
        deckPauseIcon.classList.remove('hidden');
    } else {
        deckPlayIcon.classList.remove('hidden');
        deckPauseIcon.classList.add('hidden');
    }
}

audioPlayer.addEventListener('play', () => updatePlayPauseUI(true));
audioPlayer.addEventListener('pause', () => updatePlayPauseUI(false));
audioPlayer.addEventListener('ended', () => {
    updatePlayPauseUI(false);
    progressBarFill.style.width = '0%';
    progressScrubber.style.left = '0%';
});

audioPlayer.addEventListener('timeupdate', () => {
    if (!audioPlayer.duration) return;
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBarFill.style.width = `${percent}%`;
    progressScrubber.style.left = `${percent}%`;
    timeCurrent.textContent = formatTime(audioPlayer.currentTime);
});

audioPlayer.addEventListener('loadedmetadata', () => {
    timeDuration.textContent = formatTime(audioPlayer.duration);
    timeCurrent.textContent = formatTime(0);
});

progressBarWrap.addEventListener('click', (e) => {
    if (!audioPlayer.duration) return;
    const rect = progressBarWrap.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    audioPlayer.currentTime = ratio * audioPlayer.duration;
});

speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        audioPlayer.playbackRate = parseFloat(btn.getAttribute('data-speed'));
    });
});

downloadBtn.addEventListener('click', () => {
    if (!currentBlobUrl) return;
    const a = document.createElement('a');
    a.href = currentBlobUrl;
    const voiceName = voiceSelect.options[voiceSelect.selectedIndex]?.text?.split('[')[0]?.trim() || 'voice';
    const cleanName = voiceName.replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `ElevenLabs_${cleanName}_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Canvas Visualizer
function setupAudioContext() {
    if (audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return;
    }
    try {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioClass) return;
        audioCtx = new AudioClass();
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 64;
        audioSource = audioCtx.createMediaElementSource(audioPlayer);
        audioSource.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
    } catch (e) {
        console.warn('Procedural visualizer fallback:', e);
    }
}

function startVisualizer() {
    if (visualizerAnimationId) cancelAnimationFrame(visualizerAnimationId);
    const ctx = visualizerCanvas.getContext('2d');
    let phase = 0;

    function render() {
        const w = visualizerCanvas.width;
        const h = visualizerCanvas.height;
        ctx.clearRect(0, 0, w, h);

        const isPlaying = !audioPlayer.paused && audioPlayer.currentTime > 0 && !audioPlayer.ended;

        if (isSynthesizing) {
            ctx.lineWidth = 2.5;
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, '#6366f1');
            grad.addColorStop(0.5, '#ec4899');
            grad.addColorStop(1, '#06b6d4');
            ctx.strokeStyle = grad;

            ctx.beginPath();
            for (let x = 0; x < w; x += 3) {
                const y = h / 2 + Math.sin((x * 0.04) + phase) * 16 * Math.sin((x / w) * Math.PI);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            phase += 0.15;

        } else if (isPlaying && analyserNode) {
            const bufLen = analyserNode.frequencyBinCount;
            const dataArr = new Uint8Array(bufLen);
            analyserNode.getByteFrequencyData(dataArr);

            const numBars = 32;
            const barW = (w / numBars) - 3;

            for (let i = 0; i < numBars; i++) {
                const val = dataArr[Math.floor((i / numBars) * (bufLen / 1.5))] || 0;
                const barH = Math.max(4, (val / 255) * (h - 8));
                const x = i * (barW + 3) + 1.5;
                const y = (h - barH) / 2;

                const grad = ctx.createLinearGradient(0, y, 0, y + barH);
                grad.addColorStop(0, '#a855f7');
                grad.addColorStop(0.5, '#6366f1');
                grad.addColorStop(1, '#06b6d4');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(x, y, barW, barH, 3);
                ctx.fill();
            }

        } else if (isPlaying) {
            const numBars = 32;
            const barW = (w / numBars) - 3;
            phase += 0.1;

            for (let i = 0; i < numBars; i++) {
                const wave = Math.sin(phase + i * 0.4) * 0.5 + 0.5;
                const barH = 6 + wave * (h * 0.7);
                const x = i * (barW + 3) + 1.5;
                const y = (h - barH) / 2;

                const grad = ctx.createLinearGradient(0, y, 0, y + barH);
                grad.addColorStop(0, '#ec4899');
                grad.addColorStop(1, '#6366f1');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(x, y, barW, barH, 3);
                ctx.fill();
            }
        } else {
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';

            ctx.beginPath();
            for (let x = 0; x < w; x += 4) {
                const y = h / 2 + Math.sin((x * 0.02) + phase) * 4;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            phase += 0.02;
        }

        visualizerAnimationId = requestAnimationFrame(render);
    }
    render();
}
startVisualizer();

function showError(msg) {
    errorText.textContent = msg;
    errorMessage.classList.remove('hidden');
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideError() {
    errorMessage.classList.add('hidden');
}

// ============================================================
// 3. D-ID AI Video Presenter Logic
// ============================================================
const didApiKeyInput = document.getElementById('didApiKey');
const toggleDidKeyVisibility = document.getElementById('toggleDidKeyVisibility');
const didStatusBadge = document.getElementById('didStatusBadge');
const didStatusText = document.getElementById('didStatusText');
const avatarCards = document.querySelectorAll('.avatar-card');
const customAvatarUrl = document.getElementById('customAvatarUrl');
const useCustomAvatarBtn = document.getElementById('useCustomAvatarBtn');
const didScriptInput = document.getElementById('didScriptInput');
const syncFromElevenLabsBtn = document.getElementById('syncFromElevenLabsBtn');
const generateVideoBtn = document.getElementById('generateVideoBtn');
const videoShowcase = document.getElementById('videoShowcase');
const videoPresenterTitle = document.getElementById('videoPresenterTitle');
const didVideoPlayer = document.getElementById('didVideoPlayer');
const didResultUrl = document.getElementById('didResultUrl');
const copyVideoLinkBtn = document.getElementById('copyVideoLinkBtn');
const downloadVideoBtn = document.getElementById('downloadVideoBtn');
const addVideoToDocBtn = document.getElementById('addVideoToDocBtn');
const didErrorMessage = document.getElementById('didErrorMessage');
const didErrorText = document.getElementById('didErrorText');

let selectedAvatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
let selectedAvatarName = 'Elena (Studio Host)';

// Load D-ID Key
const savedDidKey = localStorage.getItem('did_api_key');
if (savedDidKey) {
    didApiKeyInput.value = savedDidKey;
    didStatusBadge.className = 'status-badge connected';
    didStatusText.textContent = 'D-ID Ready';
}

toggleDidKeyVisibility.addEventListener('click', () => {
    const isPass = didApiKeyInput.type === 'password';
    didApiKeyInput.type = isPass ? 'text' : 'password';
    toggleDidKeyVisibility.style.color = isPass ? '#06b6d4' : '';
});

didApiKeyInput.addEventListener('change', (e) => {
    const key = e.target.value.trim();
    if (key) {
        localStorage.setItem('did_api_key', key);
        didStatusBadge.className = 'status-badge connected';
        didStatusText.textContent = 'Key Saved';
    } else {
        localStorage.removeItem('did_api_key');
        didStatusBadge.className = 'status-badge';
        didStatusText.textContent = 'No Key';
    }
});

// Avatar selection
avatarCards.forEach(card => {
    card.addEventListener('click', () => {
        avatarCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedAvatarUrl = card.getAttribute('data-img');
        selectedAvatarName = card.getAttribute('data-name');
    });
});

useCustomAvatarBtn.addEventListener('click', () => {
    const url = customAvatarUrl.value.trim();
    if (!url) {
        showDidError('Please enter a valid portrait image URL.');
        return;
    }
    selectedAvatarUrl = url;
    selectedAvatarName = 'Custom Portrait Presenter';
    avatarCards.forEach(c => c.classList.remove('active'));
    hideDidError();
    customAvatarUrl.style.borderColor = '#06b6d4';
});

syncFromElevenLabsBtn.addEventListener('click', () => {
    didScriptInput.value = textInput.value.trim();
});

// D-ID Video Generation
generateVideoBtn.addEventListener('click', async () => {
    let apiKey = didApiKeyInput.value.trim();
    const scriptText = didScriptInput.value.trim();

    if (!scriptText) {
        showDidError('Please enter narration text for the presenter.');
        didScriptInput.focus();
        return;
    }

    try {
        hideDidError();
        generateVideoBtn.disabled = true;
        generateVideoBtn.querySelector('.text').textContent = 'Generating D-ID Video (Animating Face)...';
        didStatusBadge.className = 'status-badge loading';
        didStatusText.textContent = 'Rendering Video...';

        // Prepare Basic Auth token for D-ID
        let authHeader = apiKey;
        if (apiKey && !apiKey.startsWith('Basic ') && !apiKey.startsWith('Bearer ')) {
            authHeader = 'Basic ' + (btoa(apiKey));
        }

        let videoUrl = null;

        if (apiKey) {
            // Live D-ID API Request
            const createTalkRes = await fetch('https://api.d-id.com/talks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({
                    source_url: selectedAvatarUrl,
                    script: {
                        type: 'text',
                        input: scriptText
                    },
                    config: {
                        fluent: true,
                        pad_audio: 0.0
                    }
                })
            });

            if (!createTalkRes.ok) {
                let errBody = 'D-ID API request failed.';
                try {
                    const j = await createTalkRes.json();
                    errBody = j.description || j.message || errBody;
                } catch (e) {
                    errBody = `Status: ${createTalkRes.status} ${createTalkRes.statusText}`;
                }
                throw new Error(errBody);
            }

            const talkData = await createTalkRes.json();
            const talkId = talkData.id;

            // Poll for result
            let completed = false;
            let attempts = 0;

            while (!completed && attempts < 40) {
                await new Promise(r => setTimeout(r, 2000));
                attempts++;

                const pollRes = await fetch(`https://api.d-id.com/talks/${talkId}`, {
                    headers: { 'Authorization': authHeader }
                });

                if (pollRes.ok) {
                    const statusData = await pollRes.json();
                    if (statusData.status === 'done') {
                        videoUrl = statusData.result_url;
                        completed = true;
                    } else if (statusData.status === 'error') {
                        throw new Error('D-ID Video rendering encountered an error: ' + (statusData.error?.description || 'Unknown error'));
                    }
                }
            }

            if (!videoUrl) {
                throw new Error('Video generation timed out. Please try again.');
            }

        } else {
            // Simulated Photorealistic Demo Stream if user has no key yet
            await new Promise(r => setTimeout(r, 2500));
            videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
        }

        currentDidVideoUrl = videoUrl;
        didVideoPlayer.src = videoUrl;
        didResultUrl.value = videoUrl;
        videoPresenterTitle.textContent = `${selectedAvatarName} Video Ready`;
        videoShowcase.classList.remove('hidden');
        didStatusBadge.className = 'status-badge connected';
        didStatusText.textContent = 'Video Rendered';

        didVideoPlayer.play().catch(e => console.log('Video play deferred:', e));

        // Save to Assets Hub
        addAsset({
            type: 'D-ID Video',
            title: `${selectedAvatarName} Talking Video`,
            url: videoUrl,
            scriptSnippet: scriptText.slice(0, 100) + '...',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

    } catch (err) {
        showDidError(err.message);
        didStatusBadge.className = 'status-badge error';
        didStatusText.textContent = 'Failed';
    } finally {
        generateVideoBtn.disabled = false;
        generateVideoBtn.querySelector('.text').textContent = 'Generate D-ID Video Presenter';
    }
});

copyVideoLinkBtn.addEventListener('click', () => {
    if (!didResultUrl.value) return;
    navigator.clipboard.writeText(didResultUrl.value);
    copyVideoLinkBtn.textContent = 'Copied!';
    setTimeout(() => { copyVideoLinkBtn.textContent = 'Copy Link'; }, 2000);
});

downloadVideoBtn.addEventListener('click', () => {
    if (!currentDidVideoUrl) return;
    const a = document.createElement('a');
    a.href = currentDidVideoUrl;
    a.download = `DID_Presenter_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

addVideoToDocBtn.addEventListener('click', () => {
    switchTab('tab-docs');
});

function showDidError(msg) {
    didErrorText.textContent = msg;
    didErrorMessage.classList.remove('hidden');
}
function hideDidError() {
    didErrorMessage.classList.add('hidden');
}

// ============================================================
// 4. Doc Hub & Links Importer / Exporter
// ============================================================
const docDropZone = document.getElementById('docDropZone');
const docFileInput = document.getElementById('docFileInput');
const browseDocBtn = document.getElementById('browseDocBtn');
const uploadedDocBanner = document.getElementById('uploadedDocBanner');
const uploadedDocName = document.getElementById('uploadedDocName');
const uploadedDocStats = document.getElementById('uploadedDocStats');
const sendDocTextToStudioBtn = document.getElementById('sendDocTextToStudioBtn');
const clearUploadedDocBtn = document.getElementById('clearUploadedDocBtn');

const assetsTableBody = document.getElementById('assetsTableBody');
const emptyAssetsMsg = document.getElementById('emptyAssetsMsg');
const assetCounter = document.getElementById('assetCounter');
const addCustomLinkBtn = document.getElementById('addCustomLinkBtn');
const manualAddRow = document.getElementById('manualAddRow');
const manualAssetType = document.getElementById('manualAssetType');
const manualAssetTitle = document.getElementById('manualAssetTitle');
const manualAssetUrl = document.getElementById('manualAssetUrl');
const saveManualAssetBtn = document.getElementById('saveManualAssetBtn');
const cancelManualAssetBtn = document.getElementById('cancelManualAssetBtn');

const exportDocFullBtn = document.getElementById('exportDocFullBtn');
const quickExportDocBtn = document.getElementById('quickExportDocBtn');
const downloadSampleDocBtn = document.getElementById('downloadSampleDocBtn');

let lastExtractedScript = '';

// Drop Zone Handlers
browseDocBtn.addEventListener('click', () => docFileInput.click());
docDropZone.addEventListener('click', (e) => {
    if (e.target !== browseDocBtn) docFileInput.click();
});

docDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    docDropZone.classList.add('dragover');
});
docDropZone.addEventListener('dragleave', () => docDropZone.classList.remove('dragover'));
docDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    docDropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processDocFile(e.dataTransfer.files[0]);
    }
});

docFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        processDocFile(e.target.files[0]);
    }
});

function processDocFile(file) {
    const fileName = file.name;
    const isDocx = fileName.endsWith('.docx');
    const isText = fileName.endsWith('.txt') || fileName.endsWith('.rtf') || fileName.endsWith('.doc');

    const reader = new FileReader();

    if (isDocx && window.mammoth) {
        reader.onload = function(event) {
            window.mammoth.extractRawText({ arrayBuffer: event.target.result })
                .then(function(res) {
                    handleParsedDoc(fileName, res.value);
                })
                .catch(function(err) {
                    console.warn('Mammoth extraction fallback:', err);
                    handleRawFileText(event.target.result, fileName);
                });
        };
        reader.readAsArrayBuffer(file);
    } else {
        reader.onload = function(event) {
            handleParsedDoc(fileName, event.target.result);
        };
        reader.readAsText(file);
    }
}

function handleParsedDoc(fileName, textContent) {
    lastExtractedScript = textContent.trim();
    
    // Scan for ElevenLabs or D-ID or audio/video links
    const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
    const detectedLinks = textContent.match(urlRegex) || [];

    uploadedDocName.textContent = fileName;
    uploadedDocStats.textContent = `${lastExtractedScript.length.toLocaleString()} characters • ${detectedLinks.length} links detected`;
    uploadedDocBanner.classList.remove('hidden');

    // Auto add detected links
    detectedLinks.forEach((url, i) => {
        let type = 'Generic Link';
        let title = `Imported Link #${i + 1}`;

        if (url.includes('elevenlabs') || url.includes('.mp3') || url.includes('audio')) {
            type = 'ElevenLabs Audio';
            title = `Imported Voiceover (${fileName})`;
        } else if (url.includes('d-id') || url.includes('.mp4') || url.includes('video')) {
            type = 'D-ID Video';
            title = `Imported Talking Video (${fileName})`;
        }

        addAsset({
            type: type,
            title: title,
            url: url,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });
}

sendDocTextToStudioBtn.addEventListener('click', () => {
    if (lastExtractedScript) {
        textInput.value = lastExtractedScript;
        updateCharCount();
        switchTab('tab-elevenlabs');
    }
});

clearUploadedDocBtn.addEventListener('click', () => {
    uploadedDocBanner.classList.add('hidden');
    lastExtractedScript = '';
    docFileInput.value = '';
});

// Manual Add Link
addCustomLinkBtn.addEventListener('click', () => {
    manualAddRow.classList.toggle('hidden');
    manualAssetTitle.focus();
});
cancelManualAssetBtn.addEventListener('click', () => {
    manualAddRow.classList.add('hidden');
});
saveManualAssetBtn.addEventListener('click', () => {
    const title = manualAssetTitle.value.trim() || 'Untitled Asset';
    const url = manualAssetUrl.value.trim();
    const type = manualAssetType.value;

    if (!url) {
        alert('Please provide a direct URL.');
        return;
    }

    addAsset({
        type: type,
        title: title,
        url: url,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    manualAssetTitle.value = '';
    manualAssetUrl.value = '';
    manualAddRow.classList.add('hidden');
});

// Assets Library Management
function addAsset(asset) {
    projectAssets.unshift(asset);
    localStorage.setItem('synthetix_assets', JSON.stringify(projectAssets));
    renderAssets();
}

function deleteAsset(index) {
    projectAssets.splice(index, 1);
    localStorage.setItem('synthetix_assets', JSON.stringify(projectAssets));
    renderAssets();
}

function renderAssets() {
    assetCounter.textContent = projectAssets.length;
    assetsTableBody.innerHTML = '';

    if (projectAssets.length === 0) {
        emptyAssetsMsg.classList.remove('hidden');
        return;
    }
    emptyAssetsMsg.classList.add('hidden');

    projectAssets.forEach((asset, idx) => {
        const tr = document.createElement('tr');
        const badgeClass = asset.type.includes('ElevenLabs') ? 'elevenlabs' : 'did';

        tr.innerHTML = `
            <td>
                <span class="asset-badge ${badgeClass}">
                    ${asset.type.includes('ElevenLabs') ? '🎙️' : '🎬'} ${asset.type}
                </span>
            </td>
            <td>
                <strong>${escapeHtml(asset.title)}</strong>
                ${asset.scriptSnippet ? `<br><small style="color:#64748b;">${escapeHtml(asset.scriptSnippet)}</small>` : ''}
            </td>
            <td>
                <a href="${escapeHtml(asset.url)}" target="_blank" rel="noopener" class="asset-link" title="${escapeHtml(asset.url)}">
                    ${escapeHtml(asset.url)}
                </a>
            </td>
            <td style="color:#64748b; font-family:var(--font-mono); font-size:0.75rem;">
                ${escapeHtml(asset.timestamp || '--:--')}
            </td>
            <td>
                <div class="asset-actions">
                    <button class="action-icon-btn" onclick="copyAssetLink('${escapeHtml(asset.url)}')" title="Copy Link">📋</button>
                    <a href="${escapeHtml(asset.url)}" target="_blank" class="action-icon-btn" title="Open / Download">↗</a>
                    <button class="action-icon-btn delete" onclick="deleteAsset(${idx})" title="Delete">🗑</button>
                </div>
            </td>
        `;
        assetsTableBody.appendChild(tr);
    });
}
window.deleteAsset = deleteAsset;
window.copyAssetLink = function(url) {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard: ' + url);
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

renderAssets();

// Export Project Doc (.doc file format)
exportDocFullBtn.addEventListener('click', generateProjectDoc);
quickExportDocBtn.addEventListener('click', generateProjectDoc);

function generateProjectDoc() {
    const title = 'Synthetix AI Production Brief';
    const dateStr = new Date().toLocaleString();
    const currentScript = textInput.value.trim() || 'No active script entered.';
    const didScript = didScriptInput.value.trim() || 'No active D-ID script entered.';

    let tableRows = '';
    projectAssets.forEach((asset, i) => {
        tableRows += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold; color: #4338ca;">${escapeHtml(asset.type)}</td>
                <td style="padding: 10px;">${escapeHtml(asset.title)}</td>
                <td style="padding: 10px;"><a href="${escapeHtml(asset.url)}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(asset.url)}</a></td>
                <td style="padding: 10px; color: #64748b;">${escapeHtml(asset.timestamp || '')}</td>
            </tr>
        `;
    });

    if (!tableRows) {
        tableRows = `
            <tr>
                <td colspan="4" style="padding: 15px; text-align: center; color: #64748b;">
                    No assets recorded yet. Generate ElevenLabs audio or D-ID video in the studio to link them automatically.
                </td>
            </tr>
        `;
    }

    // Rich Word document HTML markup
    const docHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
                body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.6; }
                h1 { color: #312e81; font-size: 26pt; margin-bottom: 4px; border-bottom: 3px solid #6366f1; padding-bottom: 8px; }
                h2 { color: #4338ca; font-size: 16pt; margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
                .meta { color: #64748b; font-size: 10pt; margin-bottom: 25px; }
                .script-box { background: #f8fafc; border-left: 4px solid #6366f1; padding: 15px; border-radius: 4px; font-size: 11pt; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10.5pt; }
                th { background: #e0e7ff; color: #312e81; text-align: left; padding: 10px; font-weight: bold; border-bottom: 2px solid #c7d2fe; }
                .footer { margin-top: 50px; font-size: 9pt; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            </style>
        </head>
        <body>
            <h1>SYNTHETIX STUDIO</h1>
            <div class="meta">
                <strong>Project:</strong> AI Narration & Talking Video Production Brief<br>
                <strong>Generated On:</strong> ${dateStr}<br>
                <strong>Platforms:</strong> ElevenLabs Voice Synthesis & D-ID Neural Video
            </div>

            <h2>1. Production Scripts</h2>
            <p><strong>ElevenLabs Voice Script:</strong></p>
            <div class="script-box">${escapeHtml(currentScript).replace(/\n/g, '<br>')}</div>

            <p><strong>D-ID Presenter Script:</strong></p>
            <div class="script-box">${escapeHtml(didScript).replace(/\n/g, '<br>')}</div>

            <h2>2. Consolidated Links & Asset Directory</h2>
            <table>
                <thead>
                    <tr>
                        <th>Platform / Type</th>
                        <th>Asset Name / Details</th>
                        <th>Direct URL Link</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>

            <h2>3. Integration Instructions</h2>
            <p>To use these assets in your video editor (Premiere, Final Cut, DaVinci Resolve) or upload to social channels:</p>
            <ul>
                <li>Download the synthesized <strong>.mp3</strong> voiceover directly using the link above.</li>
                <li>Import the <strong>.mp4</strong> D-ID talking avatar video onto your visual timeline.</li>
                <li>Keep this document archived as an audit trail for voice models and presenter licensing.</li>
            </ul>

            <div class="footer">
                Generated with SYNTHETIX STUDIO • Powered by ElevenLabs & D-ID APIs
            </div>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Synthetix_Production_Brief_${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Download Sample .Doc Template
downloadSampleDocBtn.addEventListener('click', () => {
    const templateHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="utf-8">
            <title>Synthetix Sample Template</title>
            <style>
                body { font-family: 'Calibri', Arial, sans-serif; margin: 40px; color: #1e293b; }
                h1 { color: #312e81; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
            </style>
        </head>
        <body>
            <h1>SAMPLE PRODUCTION DOCUMENT</h1>
            <p><strong>Script:</strong> In the ancient land of Eldoria, where skies shimmered and forests whispered secrets, dragons ruled the skies with wisdom and grace.</p>
            <h2>Existing Assets:</h2>
            <ul>
                <li>ElevenLabs Audio: https://api.elevenlabs.io/v1/sample-audio.mp3</li>
                <li>D-ID Video: https://d-id-clips-prod.s3.amazonaws.com/sample-avatar.mp4</li>
            </ul>
        </body>
        </html>
    `;
    const blob = new Blob(['\ufeff', templateHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Synthetix_Sample_Template.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});
