# Draw2StoryPlay

## 👥 Team Members

- Aashir Mallik – aashir.mallik@mail.utoronto.ca (utorid: mallika9)
- Mealad Ebadi – mealad.ebadi@mail.utoronto.ca (utorid: ebadimea)
- Ji Sung Han – jishan.han@mail.utoronto.ca (utorid: hanji11)

---

## 📌 Project Overview

**Draw2StoryPlay** is a creative web application that allows children to draw simple sketches and generate fully animated **storybooks** or interactive **2D games** from their creations using AI.

Users draw directly on a canvas and input a prompt (e.g., "This stickman goes on a space adventure"). Our system then generates:
- an illustrated storybook with text-to-speech and pronunciation highlighting, and/or
- a simple interactive animation/game where the drawn character can walk, jump, and interact.

**Main Features**:
- ✏️ Real-time collaborative drawing canvas
- 📖 AI-generated stories with voice support and letter highlighting for learning
- 🕹️ Basic animations (walking, jumping, attacking) for stick figure characters
- 🧸 Export as storybook or playable 2D experience
- 🛒 Shareable marketplace (with review, feedback, and reusability features)

---

## 💻 Tech Stack

| Component        | Technology |
|------------------|------------|
| Frontend         | Vue 3 (SPA with Composition API) |
| Backend          | Express.js (REST API) |
| Main Database    | PostgreSQL |
| Realtime Feature | Socket.IO |
| Task Queue       | BullMQ with Redis |
| Authentication   | OAuth 2.0 (Google login) |
| Payments         | Stripe Checkout (Sandbox mode, subscription required) |
| Deployment       | Google Cloud VM + Docker + Docker Compose |
| CI/CD            | GitHub Actions |

---

## ✅ Additional Requirements Fulfilled

1. **Real-Time Functionality**  
Collaborative drawing board that reflects changes across users without refreshing (via Socket.IO)

2. **Task Queue Functionality**  
Story and animation generation is handled asynchronously through task queues (BullMQ + Redis)

---

## 📆 Milestones

| Version | Goals |
|---------|-------|
| 🔹 Alpha | Set up drawing board, basic OAuth login, REST API scaffold |
| 🔹 Beta  | Implement real-time collaboration, AI story/game generation with task queue, Stripe integration |
| 🔹 Final | Full animation system, storybook/game export, GCP deployment, CI/CD setup |

---

## 🌐 Deployment Details

The application will be deployed on a **Google Cloud Virtual Machine** using **Docker** and **Docker Compose**. All Docker and CI/CD configuration files will be included in the repository. The deployed application will be **publicly accessible** without needing whitelisting or extra credentials.

---

## 🔐 Security and Payment Compliance

- OAuth 2.0 (Google) authentication
- Stripe Checkout in sandbox mode (subscription required to access app)
- Subscription status determines login behavior:
  - No subscription → redirect to payment page
  - Cancelled/failure → block access
- User data securely stored (hashed passwords, encrypted sensitive fields)

---



## ✨ Impact

This app promotes **creative storytelling, reading, and digital literacy** among children by turning their imagination into stories and simple games.  
It combines **education and entertainment**, while fostering **collaboration** and **sharing** through a marketplace system.

---
