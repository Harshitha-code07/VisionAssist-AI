/**
 * Gemini Vision API Service for VisionAssist AI
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// System instructions for Gemini Vision
const SYSTEM_INSTRUCTION = `You are VisionAssist AI, an accessibility assistant for visually impaired users.
Your job is to analyze the image provided and optionally answer user questions.
You MUST analyze the scene and return a JSON object with the exact keys listed below:

{
  "riskLevel": "Low" | "Medium" | "High",
  "riskReason": "Explanation of the risk level assessment",
  "safetyAlert": "Describe any hazards, stairs, vehicles, wires, pits, fire, water, or general obstacles first. If none, state: 'No hazards detected.'",
  "navigationGuidance": "Provide clear step-by-step or orientation advice for moving through the scene (e.g. 'Keep left to avoid the table')",
  "importantObjects": "List key objects, furniture, or structures detected",
  "detectedText": "Transcribe any text found on signs, screens, or labels. If none, state: 'No visible text detected.'",
  "environmentDescription": "General overview of the environment (e.g., indoor living room, outdoor busy street)",
  "confidence": "Mention confidence level and note any visual elements that are blurry or hard to verify. Never guess."
}

Ensure you strictly follow the scene description guidelines:
1. Prioritize safety: identify threats or hazards immediately.
2. Focus on physical navigation (stairs, thresholds, drop-offs).
3. Do not make up objects. If uncertain, mention it in the confidence section.`;

/**
 * Encodes a File object to base64 format required by Gemini API
 * @param {File} file 
 * @returns {Promise<{mimeType: string, data: string}>}
 */
function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Performs analysis of the image using Gemini Vision API or Demo Mode
 * @param {Object} params
 * @param {File|string} params.image - File object or 'sample' string
 * @param {string} params.question - Optional user question
 * @param {string} params.apiKey - Gemini API key
 * @param {string} params.model - Selected model name
 * @param {string} params.actionType - Quick action override if applicable
 * @returns {Promise<Object>} The structured JSON analysis response
 */
async function analyzeImage({ image, question, apiKey, model = "gemini-2.5-flash", actionType = "" }) {
  // Determine query based on quick action or standard input
  let userPrompt = question ? question.trim() : "";
  if (!userPrompt) {
    userPrompt = "Analyze this image and describe the scene.";
  }

  if (actionType) {
    switch (actionType) {
      case "summarize":
        userPrompt = "Provide a very brief summary of the scene in one or two sentences.";
        break;
      case "front":
        userPrompt = "What is directly in front of the viewer? Focus on immediate navigation objects.";
        break;
      case "hazards":
        userPrompt = "Are there any hazards, obstacles, or dangers in this scene? Highlight them clearly.";
        break;
      case "read-text":
        userPrompt = "Read all visible text in this image. Do not summarize, transcribe exactly what is visible.";
        break;
    }
  }

  // Format and log the final prompt in the browser console
  const finalPrompt = `${SYSTEM_INSTRUCTION}\n\nUser Question/Directive: ${userPrompt}`;
  console.log("Final prompt sent to Gemini:\n" + finalPrompt);

  // If no API Key is provided, use Demo Mode
  if (!apiKey || apiKey.trim() === "") {
    return runDemoMode(image, question, actionType);
  }

  try {
    let imagePart;
    if (image === 'sample') {
      // Fetch sample image from local folder and convert to base64
      const response = await fetch('images.jpg');
      const blob = await response.blob();
      const mockFile = new File([blob], 'images.jpg', { type: blob.type });
      imagePart = await fileToGenerativePart(mockFile);
    } else if (image instanceof File) {
      imagePart = await fileToGenerativePart(image);
    } else {
      throw new Error("Invalid image format provided.");
    }

    // Prepare payload
    const payload = {
      contents: [
        {
          parts: [
            { text: finalPrompt },
            imagePart
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            riskLevel: { type: "STRING", enum: ["Low", "Medium", "High"] },
            riskReason: { type: "STRING" },
            safetyAlert: { type: "STRING" },
            navigationGuidance: { type: "STRING" },
            importantObjects: { type: "STRING" },
            detectedText: { type: "STRING" },
            environmentDescription: { type: "STRING" },
            confidence: { type: "STRING" }
          },
          required: ["riskLevel", "riskReason", "safetyAlert", "navigationGuidance", "importantObjects", "detectedText", "environmentDescription", "confidence"]
        }
      }
    };

    const endpoint = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;
    const apiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errData = await apiResponse.json();
      throw new Error(errData.error?.message || "Failed to communicate with Gemini API.");
    }

    const data = await apiResponse.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error("Empty response received from the model.");
    }

    return JSON.parse(rawText);

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

/**
 * Simulates analysis in Demo Mode
 */
function runDemoMode(image, question, actionType) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const isSample = (image === 'sample') || (image instanceof File && image.name === 'images.jpg');
      
      // 1. If it is the default sample image (images.jpg)
      if (isSample) {
        resolve(getSampleImageMockResponse(question, actionType));
      } else {
        // 2. Generic Mock Response for other uploaded files
        const fileName = (image instanceof File) ? image.name.toLowerCase() : "uploaded_image.jpg";
        resolve(getGenericMockResponse(fileName, question, actionType));
      }
    }, 1500);
  });
}

/**
 * Pre-programmed response for images.jpg (Living room with stairs)
 */
function getSampleImageMockResponse(question, actionType) {
  // If asking a specific question
  let userQuery = question ? question.toLowerCase().trim() : "";
  
  // Default outputs
  let riskLevel = "Medium";
  let riskReason = "An open floating staircase with glass railings and low-profile coffee table present physical obstacles.";
  let safetyAlert = "Caution! A floating wooden staircase with glass railings is located on the right. The open space beneath the stairs poses a head-clearance collision hazard. Additionally, a low coffee table is in the center walkway.";
  let navigationGuidance = "Walk straight and stay to the left side of the room to avoid the floating staircase on the right. Be mindful of the coffee table in the center of the living area.";
  let importantObjects = "Beige sectional sofa, low glass-top coffee table on a patterned rug, floating staircase with glass railings on the right, dining area on the left with chairs and a chandelier, kitchen counter in the background.";
  let detectedText = "No readable text detected on the walls or surfaces.";
  let environmentDescription = "A brightly lit, modern open-concept living room, kitchen, and dining area. A large window is on the far left, letting in natural light.";
  let confidence = "High confidence. Lighting is excellent, and all structures are clearly defined.";

  // Quick Action modifications
  if (actionType === "summarize" || userQuery.includes("summarize") || userQuery.includes("summary")) {
    riskReason = "Low-profile furniture and a floating staircase require careful navigation.";
    safetyAlert = "Be aware of a floating staircase on the right and a coffee table in the center.";
    navigationGuidance = "Maintain path on the left of the living space.";
    environmentDescription = "Brief Summary: A modern, bright open-plan living room with a sectional sofa and a floating staircase on the right.";
  } else if (actionType === "front" || userQuery.includes("in front of") || userQuery.includes("what is in front")) {
    safetyAlert = "Directly ahead is a seating area with a low coffee table.";
    navigationGuidance = "A beige sectional sofa is about 3 meters in front of you. A glass coffee table is between you and the sofa.";
    importantObjects = "Sectional sofa, coffee table, circular patterned rug.";
  } else if (actionType === "hazards" || userQuery.includes("hazard") || userQuery.includes("danger") || userQuery.includes("obstacle")) {
    riskLevel = "High";
    riskReason = "Floating staircase has no floor-level barrier under the first few steps, presenting a major collision hazard.";
    safetyAlert = "Critical Hazard: Floating staircase on the right with glass railings. An individual could walk directly under it and strike their head. Tripping Hazard: A circular rug and metal-legged coffee table are in the path of travel.";
    navigationGuidance = "Do not walk to the right side of the room. Keep left toward the dining area.";
  } else if (actionType === "read-text" || userQuery.includes("read") || userQuery.includes("text") || userQuery.includes("write")) {
    detectedText = "No visible text detected. There is a circular analog clock on the left wall, but the digits are not legible enough to read precisely.";
  } else if (userQuery.includes("stairs") || userQuery.includes("staircase")) {
    safetyAlert = "Staircase Hazard: A floating wood staircase is on the right, rising to the upper level. It has glass side panels.";
    navigationGuidance = "To ascend the stairs, move to the right and locate the base of the staircase, taking care not to bump into the open underside.";
  } else if (userQuery.includes("table") || userQuery.includes("sofa") || userQuery.includes("couch")) {
    importantObjects = "A large L-shaped beige sectional sofa is in the foreground. A round glass coffee table with black wire frame rests on a brown patterned rug directly in front of the sofa.";
    navigationGuidance = "The coffee table is low to the ground; steer left to walk around it.";
  } else if (userQuery.includes("color")) {
    if (userQuery.includes("sofa") || userQuery.includes("couch")) {
      importantObjects = "Beige sectional sofa.";
      environmentDescription = "You asked about the sofa color: The L-shaped sectional sofa is beige (light tan).";
      confidence = "High confidence. The color is clearly visible under the warm ambient lights.";
    } else if (userQuery.includes("stairs") || userQuery.includes("staircase")) {
      importantObjects = "Light brown wooden floating staircase.";
      environmentDescription = "You asked about the stairs: The steps are natural light brown wood, paired with clear glass panels.";
    } else if (userQuery.includes("table")) {
      importantObjects = "Coffee table with dark tinted glass top.";
      environmentDescription = "You asked about the table: The low round coffee table in the center has a dark tinted amber glass top.";
    }
  } else if (userQuery.includes("clock")) {
    importantObjects = "Analog clock mounted on the wall above the dining table.";
    detectedText = "A circular clock face is visible, but the digits are not clear enough to read.";
    environmentDescription = "There is a wall clock on the left wall, but its digits are not legible.";
  } else if (userQuery) {
    // Custom answer simulation
    environmentDescription = `Regarding your question "${question}": The scene shows a modern living room. The sofa and coffee table are in the foreground, dining table on the left, kitchen in back, and staircase on the right.`;
    navigationGuidance = `Regarding your query about "${question}": Proceed with caution. Keep left to avoid the floating staircase on the right.`;
  }

  return {
    riskLevel,
    riskReason,
    safetyAlert,
    navigationGuidance,
    importantObjects,
    detectedText,
    environmentDescription,
    confidence
  };
}

/**
 * Generic mock response based on file name triggers
 */
function getGenericMockResponse(fileName, question, actionType) {
  let userQuery = question ? question.toLowerCase() : "";
  
  // Detect scene type based on name
  let sceneType = "indoor room";
  let isStreet = fileName.includes("street") || fileName.includes("road") || fileName.includes("car") || fileName.includes("outdoor") || userQuery.includes("street") || userQuery.includes("car");
  let isKitchen = fileName.includes("kitchen") || fileName.includes("food") || fileName.includes("cook") || userQuery.includes("kitchen") || userQuery.includes("eat");
  
  let riskLevel = "Low";
  let riskReason = "The environment is stable with typical indoor elements.";
  let safetyAlert = "No immediate physical hazards detected in the pathway.";
  let navigationGuidance = "Path directly forward is clear. Walk slowly and maintain awareness of your surroundings.";
  let importantObjects = "Table, chairs, doorway on the far side, electrical outlets on the wall.";
  let detectedText = "No visible text detected.";
  let environmentDescription = "An indoor office or residential room with neutral lighting.";
  let confidence = "Medium confidence. Response is simulated in Demo Mode for your uploaded file.";

  if (isStreet) {
    sceneType = "outdoor street";
    riskLevel = "High";
    riskReason = "Active traffic environment and curb level changes require high vigilance.";
    safetyAlert = "Caution: Traffic detected! Vehicles are parked along the side, and a moving bicycle is approaching. Curb drop-off is approximately 2 meters ahead.";
    navigationGuidance = "Stop at the tactile paving. Wait for audible crossing signals before moving forward across the street.";
    importantObjects = "Sidewalk, crossing lights, cars, bicycle, waste bin on the left.";
    detectedText = "A street sign reads 'MAIN ST'. A store sign in the background reads 'CAFE'.";
    environmentDescription = "An outdoor urban street sidewalk during daylight hours. Moderate pedestrian presence.";
  } else if (isKitchen) {
    sceneType = "kitchen";
    riskLevel = "Medium";
    riskReason = "Hot surfaces, appliances, and knives present moderate risks.";
    safetyAlert = "Caution: Countertop has a knife resting near the edge. A coffee maker is plugged in and steam is visible, indicating hot liquid.";
    navigationGuidance = "Move carefully along the counter. Keep hands clear of the stove top area on the right.";
    importantObjects = "Kitchen counter, sink, microwave, knife on a cutting board, electric stove.";
    detectedText = "Microwave timer reads '12:00'. A mug reads 'COFFEE'.";
    environmentDescription = "A clean domestic kitchen with tile flooring and bright under-cabinet lighting.";
  }

  // Question overrides
  if (actionType === "summarize" || userQuery.includes("summarize") || userQuery.includes("summary")) {
    environmentDescription = `Brief Summary: An image showing a ${sceneType} environment. Demo Mode simulation.`;
  } else if (actionType === "front" || userQuery.includes("in front")) {
    navigationGuidance = isStreet ? "Directly in front is the paved sidewalk leading to a curb." : "Directly in front is a clear floor space leading to a table.";
  } else if (actionType === "hazards" || userQuery.includes("hazard") || userQuery.includes("danger")) {
    if (isStreet) {
      safetyAlert = "Alert: Approaching bicycle, curb edge, and vehicle traffic.";
    } else if (isKitchen) {
      safetyAlert = "Alert: Knife on counter edge and hot stove top.";
    } else {
      safetyAlert = "Alert: Standard indoor furniture legs. Watch your step.";
    }
  } else if (actionType === "read-text" || userQuery.includes("read") || userQuery.includes("text")) {
    if (isStreet) {
      detectedText = "Visible text: 'MAIN ST' (street sign) and 'CAFE' (business sign).";
    } else if (isKitchen) {
      detectedText = "Visible text: 'COFFEE' on a mug, '12:00' on the microwave display.";
    } else {
      detectedText = "Demo Mode: No readable text detected in this general room image.";
    }
  } else if (userQuery) {
    environmentDescription = `Answer: Analyzing the ${sceneType} image. Regarding your query "${question}": The environment appears to be a standard ${sceneType}.`;
    navigationGuidance = `Regarding your query about "${question}": Standard awareness advised. Walk slowly.`;
  }

  return {
    riskLevel,
    riskReason,
    safetyAlert,
    navigationGuidance,
    importantObjects,
    detectedText,
    environmentDescription,
    confidence
  };
}
