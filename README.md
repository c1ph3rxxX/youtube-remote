# 🎵 YouTube Remote — Self-Hosted Music & TV Remote

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge" alt="License MIT" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-blue?style=for-the-badge" alt="Cross Platform" />
  <img src="https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge" alt="Node 18+" />
  <img src="https://img.shields.io/badge/React-18%20%2B%20Vite-61dafb?style=for-the-badge" alt="React 18" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=for-the-badge" alt="TailwindCSS" />
</p>

<p align="center">
  <b>Turn any phone (iPhone, Android) or laptop into a real-time, Spotify Connect–style remote control for YouTube music and videos playing on your TV, desktop, or Home Theater system.</b>
</p>

---

## 💡 The Real-Life Problem This Solves

When listening to YouTube music on high-end speakers, a TV, or a Home Theater system connected to a PC or media server, you usually face frustrating limitations:

1. **Bluetooth / AirPlay Compression & Battery Drain**: Streaming audio directly from your phone drains its battery quickly, causes lag, and compresses audio quality.
2. **The "Get Off the Couch" Problem**: You have to physically walk over to the PC or TV keyboard and mouse just to skip a song, change the playlist, or adjust the volume.
3. **Interrupting Ads & Dialogue Popups**: YouTube constantly interrupts playback with video ads, *"Are you still watching?"* prompts, and consent popups.
4. **Heavy Video Bandwidth**: Streaming 1080p/4K video just to listen to audio wastes bandwidth and overheats mini-PCs / media servers.

### 🌟 The Solution: **YouTube Remote**
YouTube Remote runs on your host computer (Windows, Linux, or macOS) connected directly to your speakers or TV via AUX, HDMI, Bluetooth, or optical audio. It opens a dedicated, background-optimized YouTube player with **automatic ad-skipping** and **144p quality locking**, while providing an **ultra-responsive, Obsidian Glass web app** for your phone to search, queue, and control playback seamlessly over your local Wi-Fi.

---

## 🏛️ Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│             Mobile Phone / Tablet (PWA Web App)             │
│   (Search, Queue, Live Volume Deck, Equalizer, Settings)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
            WebSocket (Instant 2-way sync) & REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          Host Server (Windows / Linux / macOS) [:4000]      │
│  • Fastify API & WebSocket Gateway                          │
│  • SQLite Persistence (Queue, History, Paired Devices)      │
│  • Multi-Device PIN Authentication                          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                     Playwright Controller
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Dedicated Chrome / Edge Instance                │
│  • Native YouTube Web Playback                              │
│  • Auto-Skip Ads & Auto-Dismiss Dialogs                     │
│  • 144p Bandwidth Saver & Native Autoplay Enforcement       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                    Direct Audio Output
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Home Theater / TV / Hi-Fi Speakers               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

- 📱 **Mobile-First PWA (iOS & Android)**: Installable as a native-feeling app on iPhone and Android with safe-area support, dark mode, and zero app store downloads.
- 🎵 **Live Equalizer Wave Visualizer**: Dynamic animated audio wave bars that dance in real-time when music is playing.
- 🔊 **Tactile Volume Control Deck**: Precise slider, +/- increment buttons, live mute toggle, and 1-tap presets (`25%`, `50%`, `75%`, `100%`).
- 🔍 **Instant YouTube Search**: Search millions of songs, artists, albums, or paste YouTube URLs directly.
- ✨ **Authentic YouTube Up-Next**: Scrapes YouTube's native recommendation sidebar directly from the watch page for continuous playback.
- 📋 **Persistent Queue & "Play Next"**: Add tracks to queue, reorder, remove, or clear queue with SQLite persistence.
- ⏱️ **Sleep Timer**: Auto-pause music playback after 15m, 30m, 1h, or custom schedules.
- 🛡️ **LAN Security & PIN Pairing**: 4-digit PIN protection. Once paired, devices stay authenticated forever.
- 🔑 **Settings PIN Viewer**: View or regenerate the 4-digit PIN directly from the Settings tab on your phone to connect new devices without opening the terminal.
- 🌐 **100% Cross-Platform**: Works out of the box on Windows, Linux (Ubuntu, Debian, Raspberry Pi), and macOS.

---

## 🚀 Quick Start Guide

### 🪟 Windows Setup (1-Click)
1. **Clone the repository**:
   ```cmd
   git clone https://github.com/your-username/youtube-remote.git
   cd youtube-remote
   ```
2. **Install & Build**: Double-click `install.bat` (or run `npm run install:all && npm run build`).
3. **Start**: Double-click `start.bat` (or run `npm start`).

---

### 🐧 Linux Setup (Ubuntu / Debian / Raspberry Pi)
1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-username/youtube-remote.git
   cd youtube-remote
   npm run install:all
   npm run build
   ```
2. **Start the Server**:
   ```bash
   npm start
   # Or with explicit display:
   DISPLAY=:0 npm start
   ```

#### 🔄 Running as a Background Service on Linux (Auto-Start on Boot)
```bash
# 1. Copy service file to user systemd directory
mkdir -p ~/.config/systemd/user
cp youtube-remote.service ~/.config/systemd/user/

# 2. Reload and enable service
systemctl --user daemon-reload
systemctl --user enable youtube-remote.service
systemctl --user start youtube-remote.service

# 3. Enable auto-start on boot (even without login)
loginctl enable-linger $USER
```

---

### 🍎 macOS Setup
1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-username/youtube-remote.git
   cd youtube-remote
   npm run install:all
   npm run build
   ```
2. **Start**:
   ```bash
   npm start
   ```

---

## 📱 Connecting Your Phone

1. Make sure your phone is on the **same Wi-Fi network** as your host computer.
2. Open Safari (iPhone) or Chrome (Android) and navigate to the IP address shown in your server terminal:
   ```
   http://192.168.1.5:4000
   ```
3. Enter the 4-digit **Pairing PIN** displayed in the terminal.
4. **Install as a Standalone App (PWA)**:
   - **iOS (Safari)**: Tap **Share** ➔ **Add to Home Screen**.
   - **Android (Chrome)**: Tap **Menu (⋮)** ➔ **Install App** / **Add to Home screen**.

---

## ⚙️ Configuration (`.env`)

You can customize server settings by creating a `.env` file in the `server/` directory:

```env
PORT=4000
HOST=0.0.0.0

# Optional: Custom Chrome binary path (auto-detected by default)
# CHROME_PATH=/usr/bin/google-chrome

# Optional: Custom database storage path
# DB_PATH=~/.youtube-remote/youtube-remote.db

LOG_LEVEL=info
PAIRING_TIMEOUT_MS=86400000
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand, Lucide Icons, Vite PWA.
- **Backend**: Node.js, Fastify, WebSocket (`ws`), Better-SQLite3, Innertube / YouTubei.js.
- **Automation Engine**: Playwright (Persistent Context Chrome controller with stealth injection).

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
