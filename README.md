Lab Demo Signup System

A full-stack web application for managing lab demo scheduling, time-slot reservations, and user signups. Built with a clean separation between front-end and back-end components, this system demonstrates real-world skills in API design, data handling, and interactive UI development.

🚀 Features

User-friendly interface for selecting demo time slots

Dynamic schedule display with availability tracking

Real-time updates via REST API

Server-side data management using structured JSON

Modular architecture (clean separation of client/server)

Custom endpoints created using Node.js

Expandable front-end (vanilla JS or framework-based)

📁 Project Structure
lab-demo-signup-system/
│
├── client/                # Front-end (UI + JS + CSS + assets)
│   ├── index.html
│   ├── lab3.js
│   ├── css/
│   └── img/
│
├── server/                # Back-end (API logic)
│   ├── server.js
│   └── data/              # Server-side assets (ignored by Git)
│
└── ai-prompts.txt         # Logged prompts if AI assistance was used

🖥️ Front-End

All UI logic and visual components live in the client/ folder:

HTML structure (index.html)

CSS stylesheets

JavaScript logic (lab3.js)

Images & front-end assets

Any front-end framework components (Lab 4 additions)

🔌 Back-End (REST API)

All API routes and server functionality are implemented in:

server/server.js


The backend handles:

Signup data

GET/POST requests

Validation

Dynamic slot updates

Data persistence via JSON files (stored in server/data/)

🛠️ Running the Project
Install dependencies
npm install

Start the server
node server/server.js

Open the front-end

Open:

client/index.html

🤖 AI Usage Log

If AI tools were used during development, prompts are recorded in:

ai-prompts.txt


This file mirrors the commit history related to AI-assisted changes.

🌟 Why This Project Stands Out

This application showcases real software engineering capabilities:

Full-stack project structure

REST API creation and integration

Client–server communication

Front-end dynamic behavior

Data handling and validation

Clean architecture and organization

Deployment-ready file structure
