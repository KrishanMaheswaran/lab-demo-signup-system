# Lab Demo Signup System

A full-stack scheduling application for managing lab demo signups and time-slot reservations.  
Designed with clean client–server separation and RESTful APIs to simulate a real-world booking system.

---

## Overview

This application allows users to view available demo time slots, reserve a slot, and receive immediate feedback on availability.  
It emphasizes **API design, server-side validation, and reliable state management**.

The system mirrors common scheduling and reservation workflows used in production applications.

---

## Key Features

- Interactive time-slot selection
- Dynamic availability tracking
- RESTful API communication
- Server-side validation to prevent double booking
- JSON-based data persistence
- Modular client–server architecture
- Easily extensible frontend

---

## Tech Stack

- **Backend:** Node.js
- **Frontend:** HTML, CSS, JavaScript
- **API Style:** REST (GET / POST)
- **Data Storage:** Structured JSON files
- **Tooling:** Git

---

## Project Structure

```

lab-demo-signup-system/
├── client/
│   ├── index.html        # Frontend UI
│   ├── lab3.js           # Client-side logic
│   ├── css/              # Stylesheets
│   └── img/              # Assets
│
├── server/
│   ├── server.js         # REST API and business logic
│   └── data/             # Server-side data storage
│
└── ai-prompts.txt        # Optional AI usage log

````

---

## Frontend

The frontend is located in the `client/` directory and handles:
- Time-slot selection and UI updates
- Displaying availability in real time
- Communicating with the backend API

The structure allows easy migration to frameworks such as React or Angular if needed.

---

## Backend (REST API)

The backend is implemented in `server/server.js` and is responsible for:
- Managing available demo slots
- Handling signup requests
- Validating input and preventing duplicate reservations
- Persisting state using structured JSON data

---

## Running the Application

### Install Dependencies
```bash
npm install
````

### Start the Server

```bash
node server/server.js
```

### Open the Frontend

Open the following file in your browser:

```
client/index.html
```

---

## Validation & Reliability

* Server-side validation for all signup requests
* Protection against double booking
* Consistent API responses
* Clear separation between UI and business logic

---

## AI Usage Log

If AI assistance was used during development, related prompts are recorded in:

```
ai-prompts.txt
```

This file mirrors the commit history of AI-assisted changes.

---

## Why This Project Stands Out

* Demonstrates full-stack system design
* Clean REST API implementation
* Real-time client–server interaction
* Validation and state management
* Readable, maintainable code structure
* Reflects production-style application patterns
