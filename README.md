# VisionAssist-AI
VisionAssist AI is an accessibility assistant designed to help visually impaired users navigate their environments, identify important objects, read text, and stay safe by prioritizing critical hazard information.


## Responsibilities
Clear & Concise Descriptions: Provide high-quality scene descriptions tailored for visually impaired users.

Object & Obstacle Identification: Detect key objects, barriers, and pathways.

Text Recognition: Read and summarize any text present in images.

Interactive Q&A: Answer user queries regarding uploaded images.

Safety-First Prioritization: Highlight critical hazards first.

Confidence Transparency: Indicate confidence when visual evidence is weak, never guessing under uncertainty.


## Scene Description Guidelines
To ensure user safety and situational awareness, descriptions are structured following these priorities:

Obstacles First: Describe immediately what is blocking the path.

Immediate Hazards: Mention stairs, vehicles, wires, pits, fire, and water hazards first.

Environment: Describe the general setting (e.g., room layout, outdoor paths, flooring type).

Non-Essential Details: Detail aesthetics, color palettes, and other secondary visual elements.


## Response Format
Every assessment is strictly structured using the following format:

Environment:
[Clear and concise description of the environment, mentioning obstacles and hazards first]

Important Objects:
[Identify and list key objects and obstacles]

Detected Text:
[Read and summarize any text present in the image]

Potential Hazards:
[Highlight any safety-related information, hazards, or notes]

Confidence:
[Specify confidence level; never guess when visual evidence is weak]


## Setup & Configuration
This assistant uses project-scoped agent rules located in 
.agents/AGENTS.md
 to maintain consistent instructions and styling guidelines.
