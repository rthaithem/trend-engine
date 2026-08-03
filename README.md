# Trend Engine — OSINT & Digital Intelligence Analysis Dashboard

> **Trend Engine** is an open-source intelligence (OSINT) forensic platform designed to monitor digital trends, detect artificial manipulation (bot networks, astroturfing campaigns), map key actors, and empower collaborative investigations in real time.

---

## 🌟 Overview & Purpose

Modern digital trends are often manufactured or manipulated by coordinated botnets, astroturfing campaigns, or political interest groups. **Trend Engine** acts as a forensic investigation suite that dissects viral topics, uncovers who benefits and who suffers, and maps the hidden connections behind viral movements.

### Key Capabilities

- 🤖 **Fabrication & Bot Detection:** Analyzes viral sentiment and account patterns to compute an **Astroturfing Index (0–100%)** and **Bot Involvement Probability**.
- 🕸️ **Knowledge Graph Network:** Interactive Cytoscape visualization mapping Core Issues, Key Players, Beneficiaries, and Victims.
- 📡 **Live RSS Grounding:** Automatically ingests live news headlines to ground AI analysis in real-time verified context.
- 👥 **Real-Time Collaborative Rooms:** Enables multiple investigators to join a shared room via unique URLs (`?room=<roomId>`), submit evidence, and chat in real time.
- 🧠 **Embedded Room AI Agent (`@ai`):** Investigators can tag `@ai` in collaborative room chats to prompt an OSINT Assistant that reviews all room evidence and chat history.
- 🌐 **Responsive & Bilingual (RTL/LTR):** Designed for global operations with full support for Arabic (RTL) and English (LTR).

---

## 🚀 How It Works (Step-by-Step Workflow)

```
[ Input Query / Hashtag ] ──► [ Live RSS Fetch ] ──► [ Gemini AI Analysis Engine ]
                                                             │
   ┌─────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────┐
   ▼                                                         ▼                                                        ▼
[ Bot & Manipulation Score ]               [ Knowledge Graph Entities ]                             [ Actionable Summary & Risk ]
```

1. **Configuration:** Click the Settings gear icon to input your **Gemini API Key** (or OpenRouter Key) and select your preferred language.
2. **Search & Analysis:** Enter any hashtag, keyword, or trend topic into the command interface and click **ANALYZE**.
3. **Live News Grounding:** The system fetches live search & news streams via server-side RSS to ensure accurate, up-to-date analysis.
4. **Forensic Report:** View the computed Risk Index, Bot activity estimate, and an entity breakdown of Key Players, Beneficiaries, and Victims.
5. **Network Graph:** Explore the interactive Cytoscape graph to see how actors relate to the core issue.
6. **Collaborative Investigation:** Open the **Collaborative Room** tab to generate a dedicated room link and collaborate with other team members.

---

## 🔗 Link Sharing & Remote Collaboration

Trend Engine features a built-in multi-user collaboration engine powered by **WebSockets (`socket.io`)** and **SQLite (`better-sqlite3`)**.

### How Sharing Links Works:

1. **Room Creation:** Clicking **"Create New Room"** generates a unique cryptographically secure Room ID (e.g., `room-8f3a9d2c`).
2. **Shareable Link Generation:** The system formats an invite link:
   ```
   https://your-domain.com/?room=room-8f3a9d2c
   ```
3. **Remote Joining:** When an investigator opens the link, the application automatically detects the `?room=` URL query parameter, prompts for the operative's alias, and connects directly to the server's WebSocket room.
4. **Environment Flexibility:**
   - In web deployments, the socket connects to `window.location.origin`.
   - When compiled for **Desktop (Electron/Tauri)** or **Mobile (Capacitor/React Native)**, set `VITE_BACKEND_URL=https://your-server-domain.com` in your environment, and the client app will route socket connections and API requests to your hosted backend server seamlessly.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **Data Viz** | Cytoscape.js & React Cytoscapejs |
| **Backend** | Node.js, Express, Socket.io, RSS Parser |
| **Database** | SQLite (`better-sqlite3`) for persistent collaborative rooms & evidence |
| **AI Engine** | Google Gemini API (`@google/genai` SDK) |

---

## 💻 Local Setup & Development

### Prerequisites
- **Node.js**: v18 or higher
- **Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/trend-engine.git
   cd trend-engine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm run dev
   ```
   *The dev server boots the Express backend on port `3000` with integrated Vite middleware.*

4. Access the dashboard at `http://localhost:3000`.

---

## 📱 Converting to Mobile or Desktop App

To wrap Trend Engine into a native mobile or desktop application:

### 📱 Mobile App (via Capacitor)
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Trend Engine" "com.trendengine.app" --web-dir dist
npm run build
npx cap add android
npx cap add ios
npx cap open android
```
*Note: Set `VITE_BACKEND_URL=https://your-hosted-server.com` during build so the mobile app communicates with your live backend.*

### 🖥️ Desktop App (via Electron)
Add Electron builder to `package.json` pointing `main` to a main process file, or build with Tauri for a lightweight desktop binary.

---

## 📜 License & Usage

This project is licensed under the **MIT License**.

*Built for digital transparency and field intelligence operations.*
