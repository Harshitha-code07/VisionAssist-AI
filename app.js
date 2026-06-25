/**
 * Core Application Logic for VisionAssist AI
 */

// Global State
let currentFile = null;
let currentAnalysis = null;
let speechUtterance = null;
let activeSpeechCardIndex = -1;
let recognition = null;
let isListening = false;
let fontScale = 1.0;

// DOM Elements
const body = document.body;
const btnContrast = document.getElementById("toggle-contrast");
const btnDecreaseFont = document.getElementById("decrease-font");
const btnIncreaseFont = document.getElementById("increase-font");
const btnResetFont = document.getElementById("reset-font");
const btnToggleSettings = document.getElementById("toggle-settings");
const settingsDrawer = document.getElementById("settings-drawer");
const btnSaveSettings = document.getElementById("save-settings");
const apiKeyInput = document.getElementById("api-key");
const modelSelect = document.getElementById("model-select");

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadPrompt = document.getElementById("upload-prompt");
const previewWrapper = document.getElementById("preview-wrapper");
const imagePreview = document.getElementById("image-preview");
const btnRemoveImage = document.getElementById("remove-image");

const questionInput = document.getElementById("question-input");
const btnMic = document.getElementById("mic-btn");
const btnReset = document.getElementById("reset-btn");
const btnAnalyze = document.getElementById("analyze-btn");

const resultsEmpty = document.getElementById("results-empty");
const loadingOverlay = document.getElementById("loading-overlay");
const resultsContent = document.getElementById("results-content");
const demoIndicator = document.getElementById("demo-indicator");
const btnLoadSample = document.getElementById("load-sample-btn");

// Result Card fields
const riskCard = document.getElementById("risk-card");
const riskBadge = document.getElementById("risk-level-badge");
const riskReason = document.getElementById("risk-level-reason");
const valSafety = document.getElementById("val-safety");
const valNavigation = document.getElementById("val-navigation");
const valObjects = document.getElementById("val-objects");
const valText = document.getElementById("val-text");
const valEnvironment = document.getElementById("val-environment");
const valConfidence = document.getElementById("val-confidence");

const cards = [
  { id: "card-safety", element: document.getElementById("card-safety"), key: "safetyAlert", label: "Safety Alert" },
  { id: "card-navigation", element: document.getElementById("card-navigation"), key: "navigationGuidance", label: "Navigation Guidance" },
  { id: "card-objects", element: document.getElementById("card-objects"), key: "importantObjects", label: "Important Objects" },
  { id: "card-text", element: document.getElementById("card-text"), key: "detectedText", label: "Detected Text" },
  { id: "card-environment", element: document.getElementById("card-environment"), key: "environmentDescription", label: "Environment Description" },
  { id: "card-confidence", element: document.getElementById("card-confidence"), key: "confidence", label: "Confidence Rating" }
];

// TTS UI Elements
const btnPlay = document.getElementById("tts-play");
const btnPause = document.getElementById("tts-pause");
const btnStop = document.getElementById("tts-stop");
const selectSpeed = document.getElementById("tts-speed");

// Quick Action Elements
const btnQuickReadAloud = document.getElementById("action-read-aloud");
const btnQuickSummarize = document.getElementById("action-summarize");
const btnQuickFront = document.getElementById("action-front");
const btnQuickHazards = document.getElementById("action-hazards");
const btnQuickReadText = document.getElementById("action-read-text");

/**
 * Initialize Application
 */
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  setupAccessibility();
  setupFileTransfer();
  setupSpeechRecognition();
  setupSpeechSynthesis();
  setupEventListeners();
  
  // Announce load to screen readers
  announceA11y("VisionAssist A.I. Accessibility Assistant loaded. Please upload an image to begin.");
});

/**
 * Settings Persistence
 */
function loadSettings() {
  const savedKey = localStorage.getItem("visionassist_api_key") || "";
  const savedModel = localStorage.getItem("visionassist_model") || "gemini-2.5-flash";
  const savedContrast = localStorage.getItem("visionassist_high_contrast") === "true";
  const savedScale = parseFloat(localStorage.getItem("visionassist_font_scale")) || 1.0;

  apiKeyInput.value = savedKey;
  modelSelect.value = savedModel;
  
  if (savedContrast) {
    body.classList.add("high-contrast");
    btnContrast.setAttribute("aria-pressed", "true");
    btnContrast.classList.add("active");
  }
  
  fontScale = savedScale;
  updateFontScale();
  updateDemoIndicator();
}

function saveSettings() {
  localStorage.setItem("visionassist_api_key", apiKeyInput.value.trim());
  localStorage.setItem("visionassist_model", modelSelect.value);
  updateDemoIndicator();
  
  // Close drawer
  settingsDrawer.classList.remove("open");
  btnToggleSettings.setAttribute("aria-expanded", "false");
  
  announceA11y("Gemini API configurations saved successfully.");
}

function updateDemoIndicator() {
  const key = apiKeyInput.value.trim();
  if (key) {
    demoIndicator.textContent = "API Mode Active";
    demoIndicator.style.backgroundColor = "rgba(16, 185, 129, 0.12)";
    demoIndicator.style.borderColor = "var(--color-low)";
    demoIndicator.style.color = "var(--color-low)";
  } else {
    demoIndicator.textContent = "Demo Mode";
    demoIndicator.style.backgroundColor = "var(--primary-glow)";
    demoIndicator.style.borderColor = "var(--primary)";
    demoIndicator.style.color = "var(--text-main)";
  }
}

/**
 * Accessibility Helpers
 */
function setupAccessibility() {
  // Toggle High Contrast
  btnContrast.addEventListener("click", () => {
    const isHC = body.classList.toggle("high-contrast");
    localStorage.setItem("visionassist_high_contrast", isHC);
    btnContrast.setAttribute("aria-pressed", isHC);
    btnContrast.classList.toggle("active", isHC);
    announceA11y(isHC ? "High contrast mode enabled." : "High contrast mode disabled.");
  });

  // Font Scaling Buttons
  btnIncreaseFont.addEventListener("click", () => {
    if (fontScale < 2.0) {
      fontScale = Math.min(2.0, fontScale + 0.1);
      updateFontScale();
      announceA11y(`Font size increased to ${Math.round(fontScale * 100)} percent.`);
    }
  });

  btnDecreaseFont.addEventListener("click", () => {
    if (fontScale > 0.8) {
      fontScale = Math.max(0.8, fontScale - 0.1);
      updateFontScale();
      announceA11y(`Font size decreased to ${Math.round(fontScale * 100)} percent.`);
    }
  });

  btnResetFont.addEventListener("click", () => {
    fontScale = 1.0;
    updateFontScale();
    announceA11y("Font size reset to normal.");
  });

  // keyboard interactions on drag-and-drop container
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
}

function updateFontScale() {
  document.documentElement.style.setProperty("--font-scale", fontScale);
  localStorage.setItem("visionassist_font_scale", fontScale);
}

/**
 * Screen Reader Announcement (Polite ARIA live region injection)
 */
function announceA11y(message) {
  const announcer = document.createElement("div");
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("style", "position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0;");
  body.appendChild(announcer);
  
  // Triggers immediate read out by screen reader
  setTimeout(() => {
    announcer.textContent = message;
    // Remove after announcement
    setTimeout(() => body.removeChild(announcer), 2000);
  }, 100);
}

/**
 * Image Upload / File Transfer
 */
function setupFileTransfer() {
  // Drop Zone dragover effects
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  });

  btnRemoveImage.addEventListener("click", (e) => {
    e.stopPropagation(); // Avoid triggering open file explorer dialog
    clearImage();
  });
}

function handleImageFile(file) {
  if (!file.type.startsWith("image/")) {
    announceA11y("Error: Selected file is not an image.");
    alert("Please upload a valid image file (PNG, JPG, WEBP).");
    return;
  }

  currentFile = file;
  
  // Set preview src
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    uploadPrompt.style.display = "none";
    previewWrapper.style.display = "block";
    announceA11y(`Image ${file.name} uploaded successfully. Preview available.`);
  };
  reader.readAsDataURL(file);
}

function loadSampleImage() {
  currentFile = "sample";
  imagePreview.src = "images.jpg";
  uploadPrompt.style.display = "none";
  previewWrapper.style.display = "block";
  announceA11y("Sample image loaded. Open-plan living room with stairs. Click Analyze Scene to proceed.");
}

function clearImage() {
  currentFile = null;
  fileInput.value = "";
  imagePreview.src = "#";
  previewWrapper.style.display = "none";
  uploadPrompt.style.display = "flex";
  
  // Clear analysis output
  stopSpeaking();
  resultsContent.style.display = "none";
  resultsEmpty.style.display = "flex";
  
  announceA11y("Image cleared. System reset.");
}

/**
 * Web Speech API: Speech-to-Text (STT)
 */
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    btnMic.style.display = "none";
    console.log("Web Speech API recognition is not supported in this browser.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    btnMic.classList.add("listening");
    btnMic.setAttribute("aria-label", "Listening. Speak your question now.");
    announceA11y("Microphone active. Speak your question.");
  };

  recognition.onerror = (e) => {
    console.error("Speech Recognition error", e);
    stopListening();
    announceA11y("Speech recognition error. Please try typing your question.");
  };

  recognition.onend = () => {
    stopListening();
  };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    questionInput.value = transcript;
    announceA11y(`Transcribed question: ${transcript}`);
  };

  btnMic.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    } else {
      stopSpeaking(); // stop any voice outputs before listening
      recognition.start();
    }
  });
}

function stopListening() {
  isListening = false;
  btnMic.classList.remove("listening");
  btnMic.setAttribute("aria-label", "Speak your question");
}

/**
 * Web Speech API: Text-to-Speech (TTS)
 */
function setupSpeechSynthesis() {
  if (!window.speechSynthesis) {
    console.log("Text-to-speech not supported in this browser.");
    document.querySelector(".tts-controls").style.display = "none";
    btnQuickReadAloud.style.display = "none";
    return;
  }

  speechUtterance = new SpeechSynthesisUtterance();
  speechUtterance.lang = "en-US";

  // When synthesis finishes reading a section
  speechUtterance.onend = () => {
    clearCardHighlighting();
    if (activeSpeechCardIndex >= 0 && activeSpeechCardIndex < cards.length - 1) {
      // Continue to next card if in full readout
      activeSpeechCardIndex++;
      readActiveCard();
    } else {
      activeSpeechCardIndex = -1;
      setSpeechButtonsActive(false);
      announceA11y("Voice readout finished.");
    }
  };

  speechUtterance.onerror = (e) => {
    console.error("SpeechSynthesis error:", e);
    clearCardHighlighting();
    activeSpeechCardIndex = -1;
    setSpeechButtonsActive(false);
  };
}

function setSpeechButtonsActive(isPlaying) {
  if (isPlaying) {
    btnPlay.classList.add("active");
    btnPause.classList.remove("active");
  } else {
    btnPlay.classList.remove("active");
    btnPause.classList.remove("active");
  }
}

/**
 * Play, Pause, Stop Speech operations
 */
function playSpeakingSequence(startIndex = 0) {
  if (!currentAnalysis) return;
  
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    setSpeechButtonsActive(true);
    return;
  }

  window.speechSynthesis.cancel();
  activeSpeechCardIndex = startIndex;
  
  if (activeSpeechCardIndex === -1) {
    // Read the risk level first
    const rate = parseFloat(selectSpeed.value) || 1.0;
    speechUtterance.rate = rate;
    
    const riskText = `Safety Risk Level is ${currentAnalysis.riskLevel}. Reason: ${currentAnalysis.riskReason}.`;
    speechUtterance.text = riskText;
    
    // Highlight the risk level card
    clearCardHighlighting();
    riskCard.classList.add("card-safety-active");
    
    window.speechSynthesis.speak(speechUtterance);
    setSpeechButtonsActive(true);
    
    // Set next up to be card 0 (Safety alert card)
    activeSpeechCardIndex = 0;
    
    // Listen to end event specifically for starting card readouts
    speechUtterance.onend = () => {
      clearCardHighlighting();
      activeSpeechCardIndex = 0;
      readActiveCard();
    };
  } else {
    readActiveCard();
  }
}

function readActiveCard() {
  if (!currentAnalysis || activeSpeechCardIndex < 0 || activeSpeechCardIndex >= cards.length) {
    activeSpeechCardIndex = -1;
    setSpeechButtonsActive(false);
    return;
  }

  const card = cards[activeSpeechCardIndex];
  const valueText = currentAnalysis[card.key];
  
  // Set speech details
  const rate = parseFloat(selectSpeed.value) || 1.0;
  speechUtterance.rate = rate;
  speechUtterance.text = `${card.label}. ${valueText}`;

  // Highlight active visual element
  clearCardHighlighting();
  card.element.classList.add("highlight");
  card.element.scrollIntoView({ behavior: "smooth", block: "nearest" });

  // Bind next step sequence on end
  speechUtterance.onend = () => {
    clearCardHighlighting();
    if (activeSpeechCardIndex < cards.length - 1) {
      activeSpeechCardIndex++;
      readActiveCard();
    } else {
      activeSpeechCardIndex = -1;
      setSpeechButtonsActive(false);
      announceA11y("Voice readout finished.");
    }
  };

  window.speechSynthesis.speak(speechUtterance);
  setSpeechButtonsActive(true);
}

function pauseSpeaking() {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    btnPause.classList.add("active");
    btnPlay.classList.remove("active");
    announceA11y("Voice readout paused.");
  }
}

function stopSpeaking() {
  window.speechSynthesis.cancel();
  clearCardHighlighting();
  activeSpeechCardIndex = -1;
  setSpeechButtonsActive(false);
  announceA11y("Voice readout stopped.");
}

function clearCardHighlighting() {
  riskCard.classList.remove("card-safety-active");
  cards.forEach(c => c.element.classList.remove("highlight"));
}

/**
 * Handle Scene Analysis Execution
 */
async function performSceneAnalysis(actionType = "") {
  if (!currentFile) {
    announceA11y("Error: Please upload an image first.");
    alert("Please select or upload an image before initiating scene analysis.");
    return;
  }

  // Stop any active readouts
  stopSpeaking();

  // Update UI to loading state
  resultsEmpty.style.display = "none";
  resultsContent.style.display = "none";
  loadingOverlay.style.display = "flex";
  
  const question = questionInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const model = modelSelect.value;

  announceA11y("Analyzing image content. Please hold.");

  try {
    const analysis = await analyzeImage({
      image: currentFile,
      question,
      apiKey,
      model,
      actionType
    });

    currentAnalysis = analysis;
    displayResults(analysis);

  } catch (error) {
    console.error(error);
    loadingOverlay.style.display = "none";
    resultsEmpty.style.display = "flex";
    
    announceA11y(`Analysis failed. ${error.message}`);
    alert(`Analysis failed: ${error.message}\n\nPlease check your internet connection or Gemini API key settings.`);
  }
}

/**
 * Render Analysis Results to DOM
 */
function displayResults(data) {
  // Hide loading, show results panel
  loadingOverlay.style.display = "none";
  resultsContent.style.display = "flex";

  // 1. Render Risk Card styling and content
  riskCard.className = "risk-card"; // Reset classes
  const risk = data.riskLevel ? data.riskLevel.toUpperCase() : "LOW";
  
  if (risk === "HIGH") {
    riskCard.classList.add("risk-risk-high", "risk-high");
    riskBadge.textContent = "HIGH RISK";
  } else if (risk === "MEDIUM") {
    riskCard.classList.add("risk-risk-medium", "risk-medium");
    riskBadge.textContent = "MEDIUM RISK";
  } else {
    riskCard.classList.add("risk-risk-low", "risk-low");
    riskBadge.textContent = "LOW RISK";
  }
  
  riskReason.textContent = data.riskReason || "No obstacles detected.";

  // 2. Render Cards contents
  valSafety.textContent = data.safetyAlert || "No immediate hazards detected.";
  valNavigation.textContent = data.navigationGuidance || "Proceed forward.";
  valObjects.textContent = data.importantObjects || "None identified.";
  valText.textContent = data.detectedText || "No text detected.";
  valEnvironment.textContent = data.environmentDescription || "N/A";
  valConfidence.textContent = data.confidence || "Low certainty.";

  // Add individual hazard pulse to safety card if hazards are present and high risk
  const safetyCard = document.getElementById("card-safety");
  if (risk === "HIGH" || (data.safetyAlert && data.safetyAlert.toLowerCase().includes("caution") || data.safetyAlert.toLowerCase().includes("danger"))) {
    safetyCard.classList.add("card-safety-active");
  } else {
    safetyCard.classList.remove("card-safety-active");
  }

  // 3. Screen Reader Announcement of Results Summary
  const accessibilityOverview = `Analysis complete. Environment detected as: ${data.environmentDescription}. Safety Alert states: ${data.safetyAlert}. Risk Level is ${risk}.`;
  announceA11y(accessibilityOverview);

  // Focus the risk card as the entry point of output reading
  setTimeout(() => {
    riskCard.focus();
  }, 300);
}

/**
 * Event Binding & Interaction Wiring
 */
function setupEventListeners() {
  // Toggle Settings Drawer
  btnToggleSettings.addEventListener("click", () => {
    const isOpen = settingsDrawer.classList.toggle("open");
    btnToggleSettings.setAttribute("aria-expanded", isOpen);
    announceA11y(isOpen ? "Gemini Key panel expanded." : "Gemini Key panel collapsed.");
  });

  // Save Settings Click
  btnSaveSettings.addEventListener("click", saveSettings);

  // Sample Load Button
  btnLoadSample.addEventListener("click", loadSampleImage);

  // Reset Application
  btnReset.addEventListener("click", () => {
    questionInput.value = "";
    clearImage();
  });

  // Run Scene Analysis
  btnAnalyze.addEventListener("click", () => performSceneAnalysis());

  // Text-To-Speech Controls
  btnPlay.addEventListener("click", () => {
    // If not analyzed, explain and exit
    if (!currentAnalysis) {
      announceA11y("No analysis results available to read aloud. Please analyze an image first.");
      return;
    }
    playSpeakingSequence(-1); // start from risk level (-1)
  });

  btnPause.addEventListener("click", pauseSpeaking);
  btnStop.addEventListener("click", stopSpeaking);

  // Speed Selector Rate Change
  selectSpeed.addEventListener("change", () => {
    if (window.speechSynthesis.speaking) {
      // Restart speaking with new speed rate from current card index
      const currentIndex = activeSpeechCardIndex;
      window.speechSynthesis.cancel();
      setTimeout(() => {
        playSpeakingSequence(currentIndex);
      }, 100);
    }
  });

  // Quick Action Buttons
  btnQuickReadAloud.addEventListener("click", () => {
    if (!currentAnalysis) return;
    playSpeakingSequence(-1);
  });

  btnQuickSummarize.addEventListener("click", () => {
    performSceneAnalysis("summarize");
  });

  btnQuickFront.addEventListener("click", () => {
    performSceneAnalysis("front");
  });

  btnQuickHazards.addEventListener("click", () => {
    performSceneAnalysis("hazards");
  });

  btnQuickReadText.addEventListener("click", () => {
    performSceneAnalysis("read-text");
  });

  // Allow result cards to read themselves individually when clicked
  cards.forEach((card, index) => {
    card.element.addEventListener("click", () => {
      if (!currentAnalysis) return;
      window.speechSynthesis.cancel();
      activeSpeechCardIndex = index;
      readActiveCard();
      // Disable sequential reading so it only reads this single card
      speechUtterance.onend = () => {
        clearCardHighlighting();
        activeSpeechCardIndex = -1;
        setSpeechButtonsActive(false);
      };
    });
    
    // Add keyboard trigger for focused cards
    card.element.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.element.click();
      }
    });
  });

  // Risk card click reads the risk level
  riskCard.addEventListener("click", () => {
    if (!currentAnalysis) return;
    window.speechSynthesis.cancel();
    clearCardHighlighting();
    riskCard.classList.add("card-safety-active");
    
    const rate = parseFloat(selectSpeed.value) || 1.0;
    speechUtterance.rate = rate;
    speechUtterance.text = `Safety Risk Level is ${currentAnalysis.riskLevel}. Reason: ${currentAnalysis.riskReason}`;
    
    speechUtterance.onend = () => {
      riskCard.classList.remove("card-safety-active");
      activeSpeechCardIndex = -1;
      setSpeechButtonsActive(false);
    };
    
    window.speechSynthesis.speak(speechUtterance);
    setSpeechButtonsActive(true);
  });

  riskCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      riskCard.click();
    }
  });
}
