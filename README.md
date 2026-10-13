# WireBrain — Wireframing & Diagram Studio

> A calm, local-first desktop application for creating website and mobile wireframes, flowcharts, and distributed system architecture diagrams with interactive simulation and prototype preview modes.

Built with **Electron**, **React 18**, **TypeScript**, and **Vite**.

Existing Wirecraft projects remain compatible. The app retains its legacy local storage keys and can import earlier `.wirecraft.json` project exports.

---

## ✦ What's New in This Version

### 1. True Black Dark Theme
- **Near-Black Palette**: Replaced washed-out grays with a true black (`#000000` / `#050506`) base ground, `#08090c` panel chrome, and `#0e1015` surface cards.
- **Restrained Blue Accent**: `#3b82f6` for selection rings, active tools, and primary CTAs.
- **Theme Switcher**: Easily toggle between **Pure Black (OLED)** and **Midnight (Obsidian Navy)** from the Navigation Rail or Properties Inspector. Preferences persist in `localStorage`.
- **Artboard Contrast**: Wireframe artboards retain their independent visual design (e.g. white or tinted browser pages on a dark canvas).

### 2. First-Launch Introduction Flow
- **Automatic Welcome**: App opens with a 4-step sequence on first launch introducing Wireframing, Architecture diagrams, and Simulation/Preview modes.
- **Real Canvas Element Previews**: Uses authentic rendered wireframe elements (mini browser frame, microservice-to-database links, animated token hops).
- **Navigation Controls**: Back, Next, Skip, progress dots, and a direct action to launch a starter board.
- **Replay Anytime**: Reopen the introduction at any point via the **Tutorial** tab.

### 3. Dedicated Tutorial & Learn Area
- **Persistent Destination**: Accessible from the left navigation rail (`GraduationCap` icon).
- **Getting Started Workflow**: 5 sequential steps (Choose board → Add element → Connect with arrows → Inspect properties → Simulate & export).
- **Comprehensive Beginner Guides**:
  - Website Wireframing (Desktop frames, typography, CTA buttons, prototype links).
  - Mobile App Wireframing (375×760 iPhone frames, dynamic island, bottom tab bars).
  - Flowcharts & Logic (Decision diamonds, branching paths, condition outcomes).
  - Architecture Diagrams (Microservices, Kafka event queues, caches, S3 storage).
- **Interactive Guided Tour**: High-contrast highlight overlay walking through real controls (Rail, Sidebar, Toolbar, Canvas, Inspector) with Back, Next, Skip, and Finish buttons.
- **Hands-On Exercises**: Generates isolated practice sandboxes (`[Tutorial] Architecture Practice`, `[Tutorial] Wireframe Practice`) so experimenting never touches your real work.

### 4. Interactive Simulation & Prototype Preview Modes
- **Data Flow Simulation (Flowcharts & System Maps)**:
  - Select **"Simulate"** in the top toolbar to trace logical data movement along real connectors.
  - Controls: Play, Pause, Step Forward, Restart, and Speed controls (0.5x, 1x, 2x).
  - Animated token pulse travels along connectors with glowing halos around active source and target nodes.
  - Live details panel displaying Component Hops, Protocol (HTTPS, gRPC, Kafka, SQL), Outbound Payload, and Returned Responses.
  - Built-in scenarios:
    1. *User Authentication & JWT Validation*
    2. *Event Telemetry & Storage Ingestion*
    3. *Read-Through Cache & PostgreSQL Fallback*
    4. *Dynamic auto-generated route for custom canvas diagrams!*
- **Prototype Preview (Website & Mobile Wireframes)**:
  - Select **"Preview"** in the top toolbar to enter an interactive prototype mode.
  - Buttons and elements execute prototype actions assigned in the inspector:
    - `navigate`: Transitions to target board/screen.
    - `modal`: Displays interactive sheet/dialog overlay.
    - `back`: Returns to previous view in history stack.
    - `alert`: Displays mock action toast notification.
  - Prominent **"Exit Prototype"** button to return to editing mode.

---

## ✦ Getting Started

### Installation
From the project folder:
```bash
npm install
```

### Development Mode (with hot reloading)
```bash
npm run dev
```

### Production Build & Run
```bash
# Build Vite bundle and Electron main process
npm run build

# Start the desktop application
npm start
```
Or directly:
```bash
npx electron .
```

---

## ✦ How to Access Key Features

| Feature | How to Start |
|---|---|
| **Replay Welcome Intro** | Click **Tutorial** tab on left rail → Click **"Replay Welcome Introduction"** |
| **Start Guided UI Tour** | Click **Tutorial** tab on left rail → Click **"Start Interactive UI Tour"** |
| **Try Practice Exercises** | Click **Tutorial** tab on left rail → Switch to **Exercises** tab → Click **"Load Practice Board"** |
| **Run Data Flow Simulation** | Open "System Map" board → Click **"Simulate"** in top toolbar → Press Play or Spacebar |
| **Test Wireframe Prototype** | Open "Website" or "Mobile" board → Click **"Preview"** in top toolbar → Click interactive buttons |
| **Toggle Dark Theme** | Click Moon icon on left rail, or toggle in Properties Inspector when canvas is deselected |

---

## ✦ Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| **Select / Move** | `V` |
| **Pan Canvas** | `H` or `Space + Drag` or `Middle Click` |
| **Connector Tool** | `C` |
| **Website Desktop Frame** | `W` |
| **Mobile Phone Frame** | `M` |
| **Rectangle / Box** | `R` |
| **Decision Diamond** | `D` |
| **Database Cylinder** | `B` |
| **Cloud Resource** | `S` |
| **Text Box** | `T` |
| **Undo** | `Ctrl + Z` / `Cmd + Z` |
| **Redo** | `Ctrl + Y` / `Ctrl + Shift + Z` |
| **Duplicate Item** | `Ctrl + D` |
| **Delete Selected** | `Delete` / `Backspace` |
| **Select All** | `Ctrl + A` |
| **Toggle Simulation Play/Pause** | `Spacebar` (while in Simulate mode) |
| **Exit Mode / Deselect** | `Escape` |
