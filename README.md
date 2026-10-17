# 🌌 SYNTHETIX STUDIO — ElevenLabs Voice & D-ID AI Video Suite

> **Enterprise-Grade AI Media Synthesis**: Generate ultra-lifelike ElevenLabs voiceovers, animate photorealistic D-ID talking avatar presenters, and manage your production pipeline with Word `.doc` file import and export.

---

## 🌟 Key Features

### 🎙️ 1. ElevenLabs Voice Synthesizer
- **State-of-the-Art Engines**: Supports Eleven V4, Eleven Multilingual V2, and Eleven Turbo V2.5.
- **Acoustic Fine-Tuning**: Sliders for **Stability**, **Clarity & Similarity Boost**, and **Style Exaggeration**.
- **Real-Time Canvas Visualizer**: Multi-mode visualizer (Idle sine wave, Synthesizing cyber pulse, Live spectrum frequency equalizer).
- **Pro Audio Deck**: Timeline scrubber, playback speed buttons (`1x`, `1.25x`, `1.5x`), and instant `.mp3` download.
- **One-Click Handover**: Send generated speech directly into D-ID video avatars.

### 🎬 2. D-ID AI Talking Video Presenter
- **Photorealistic AI Presenters**: Pre-configured diverse studio hosts + support for any custom portrait image URL.
- **Facial Lip-Syncing**: Translates scripts into fluent facial expressions and natural head movement.
- **Direct Video Hub**: Inline high-res video preview player, direct CDN link copier, and `.mp4` video downloads.

### 📄 3. Doc Hub: Upload & Export Word `.doc` Files
- **Document Drag-and-Drop**: Upload `.docx`, `.doc`, `.txt`, `.rtf`, or `.pdf` files.
- **Automatic Link Extraction**: Instantly parses text scripts and identifies ElevenLabs audio links and D-ID video links.
- **Consolidated Assets Library**: Real-time table logging all generated voice tracks and talking videos.
- **Word Document (.doc) Export**: Downloads an enterprise-ready production brief containing scripts, platform credentials, and clickable asset links.

---

## 🚀 Live GitHub Pages Deployment Guide

This project is built using vanilla web standards (HTML5, modern CSS3, and JavaScript ES6+), making it 100% compatible with **GitHub Pages** (`https://<username>.github.io/<repo>/`).

### Step 1: Create a GitHub Repository
1. Log in to [GitHub](https://github.com).
2. Click **New Repository** (e.g. named `elevenlabs-narrator` or `synthetix-studio`).
3. Choose **Public** and leave "Initialize with README" unchecked.

### Step 2: Push Your Local Repository
Open your terminal in this directory and run:

```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** (tab at top) ➔ **Pages** (in left sidebar).
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch` (or choose `GitHub Actions`).
   - **Branch**: Select `main` and `/ (root)`.
4. Click **Save**.
5. Within 60 seconds, your site is live at:
   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```

*(Alternatively, the included `.github/workflows/deploy.yml` will automatically deploy your site using GitHub Actions!)*

---

## 🔑 API Keys Setup

| Service | Purpose | Where to get key |
| :--- | :--- | :--- |
| **ElevenLabs** | Voice Narration & Speech | [ElevenLabs Profile Settings](https://elevenlabs.io) |
| **D-ID** | AI Talking Head Videos | [D-ID Studio Settings](https://studio.d-id.com) |

*All API keys are securely stored solely within your local browser (`localStorage`) and are never transmitted to any third-party server.*

---

## 💻 Tech Stack
- **HTML5 & CSS3**: Glassmorphism, CSS Custom Properties, Responsive Grid.
- **Vanilla ES6+ JS**: Web Audio API (`AudioContext`, `AnalyserNode`), Canvas API.
- **Document Processing**: [Mammoth.js](https://github.com/mwilliamson/mammoth.js) for `.docx` extraction & Word HTML MIME blob generation.
- **APIs**: ElevenLabs Text-to-Speech REST API & D-ID Talks API.
