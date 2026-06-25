# VisionAssist AI Web Application Plan

Create a premium, modern, and highly accessible web application for visually impaired users. The application will allow uploading images, typing or speaking questions, and getting a detailed scene analysis following the specific `AGENTS.md` guidelines. It will be ready for direct Gemini Vision integration while supporting a rich demo mode.

## User Review Required

> [!IMPORTANT]
> **Accessibility Features Included**: To create a truly premium experience tailored for accessibility, I am proposing to include:
> 1. **High Contrast Mode**: A dedicated high-contrast visual toggle (yellow/black) for users with low vision.
> 2. **Text-to-Speech (TTS)**: Built-in voice readout of the analysis results using the Web Speech API.
> 3. **Speech-to-Text (STT)**: A voice-input button for dictating questions, enhancing usability.
> 4. **Keyboard Navigation & ARIA**: Full keyboard accessibility (focus rings, semantic HTML, and ARIA landmarks).
> Please review and let me know if there are any other specific accessibility standards or features you'd like added.

> [!NOTE]
> **Gemini API Key Security**: The API key entered in the settings panel will be saved locally in the browser's `localStorage` for convenience and security. It is sent directly to Google's API endpoint from the client, with no backend intermediary.

## Open Questions
- None at this moment.

## Proposed Changes

We will create a clean, responsive single-page web app using native HTML5, CSS3, and JavaScript, located in the root of the workspace.

---

### Frontend Structure and Layout

#### [NEW] [index.html](file:///c:/Users/harsh/OneDrive/Dokumen/antigravity_assignment/VisionAssist_AI/index.html)
- Main single-page application structure.
- **Accessibility Header**: Skip to main content link, text sizing controls, theme toggle, and High Contrast mode toggle.
- **Gemini API Settings**: A toggleable settings gear button that reveals an API Key field and a Model Selector (e.g. `gemini-2.5-flash`, `gemini-2.5-pro`).
- **Main Workspace Grid**:
  - **Left Panel (Interaction)**:
    - Drag-and-drop file upload container with a modern visual placeholder.
    - Image preview element.
    - Ask Question section: Text area + Mic button for dictation + clear button.
    - Action buttons: "Analyze Image" and "Reset".
  - **Right Panel (Results & TTS)**:
    - TTS readout controller: Play, Pause, and Stop buttons, speed selector.
    - Structured Results Display: Styled cards for *Environment*, *Important Objects*, *Detected Text*, *Potential Hazards*, and *Confidence* as required by the `AGENTS.md` guidelines.
- Semantic HTML tags (`<header>`, `<main>`, `<section>`, `<nav>`, `<aside>`, `<footer>`) with appropriate `role` and `aria-*` tags.

---

### Styling and Design System

#### [NEW] [style.css](file:///c:/Users/harsh/OneDrive/Dokumen/antigravity_assignment/VisionAssist_AI/style.css)
- **Colors**: Rich, dark slate background (`#0f172a`), deep indigo accents (`#6366f1`), crisp white/gray text, amber/coral for safety/hazards (`#f59e0b` / `#ef4444`), emerald green for confidence metrics.
- **High-Contrast Theme**: Toggleable `.high-contrast` class overriding colors with high contrast values (e.g., background: `#000000`, text: `#ffff00`, borders: `#ffffff`).
- **Typography**: Google Fonts (e.g., `Outfit` or `Inter`) for clean, highly readable geometric shapes. Large default text sizes.
- **Responsiveness**: Flexbox/Grid systems adapting from mobile vertical viewports to desktop split-screen viewports.
- **Aesthetic Touches**: Glassmorphism (`backdrop-filter`), subtle glow transitions on focus/hover, micro-animations for uploading/analyzing states (pulsing shimmer effects).

---

### Application Logic & API Integration

#### [NEW] [gemini.js](file:///c:/Users/harsh/OneDrive/Dokumen/antigravity_assignment/VisionAssist_AI/gemini.js)
- A helper file containing functions to format prompts and execute Gemini Vision API calls.
- Enforces the system prompt following `AGENTS.md` response requirements.
- Converts uploaded files to base64 format for the Gemini inlineData API.
- Standard fetch requests to the Gemini API (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`).
- Rich, structured mock responses when no API Key is provided:
  - Specially parses the default workspace `images.jpg` (modern living room with floating stairs, coffee table, etc.) to give a detailed, guideline-compliant output.
  - Generates realistic, structured content for other uploaded files in demo mode.

#### [NEW] [app.js](file:///c:/Users/harsh/OneDrive/Dokumen/antigravity_assignment/VisionAssist_AI/app.js)
- Core JS file initializing the UI logic.
- File upload listener (validating image type and size, updating preview, caching raw data).
- Drag and drop listeners.
- TTS (Speech Synthesis) engine: reads out the parsed results in sequence with highlighted sections.
- STT (Speech Recognition) listener: connects the mic button to the browser's webkitSpeechRecognition API.
- Layout toggle states (High Contrast, text sizes, API Settings pane toggles).
- LocalStorage persistence for the API key.

---

## Verification Plan

### Automated Tests
- No automated testing framework is requested, but we will test JS syntax and browser functionality locally.

### Manual Verification
1. Open `index.html` in a web browser.
2. Verify visual appearance and layout responsiveness.
3. Test Drag & Drop image upload and visual image preview.
4. Test the Voice Input (mic) button to dictate a question.
5. Click "Analyze" with the default `images.jpg` in Demo Mode (no key entered) and verify the mock results exactly follow the structured guidelines of `AGENTS.md`.
6. Click the "Read Aloud" button to test Speech Synthesis.
7. Test the High Contrast toggle and font size adjustment.
8. Enter a valid Gemini API key (if available) and verify live responses.
