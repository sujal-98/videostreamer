# VideoStreamer: Modern Video Meeting, Watch Party & File Sharing Platform

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![React](https://img.shields.io/badge/React-18.x-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-brightgreen?logo=mongodb)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black?logo=socket.io)

---

## 🚀 Overview

**VideoStreamer** is a full-stack web application for real-time video meetings, collaborative YouTube watch parties, and secure file sharing. It features Google OAuth authentication, WebRTC-based video calls, live chat, and a modern, responsive UI.

---

## ✨ Features

- **Google OAuth Login**
- **Virtual Meetings** (WebRTC, video/audio, chat, screen share)
- **Watch Party** (synchronized YouTube viewing)
- **File Transfer** (peer-to-peer, chunked, secure)
- **Live Chat** (in meetings)
- **Responsive UI** (Material UI, Tailwind)
- **User Profiles**

---

## 🏗️ Architecture

### System Flow

```mermaid
flowchart TD
  A[User] -->|Login with Google| B(Frontend /login.jsx)
  B -->|Redirect| C[http://localhost:4000/api/auth/google]
  C -->|OAuth Flow| D[Backend /api/auth/google]
  D -->|Google OAuth| E[Google Servers]
  E -->|Callback| F[Backend /api/auth/google/callback]
  F -->|Set Session, Redirect| G[Frontend]
  A -.->|WebRTC, File, Chat| H[Socket.IO Server]
  H -->|Video/Audio| I[Other User]
  A -->|UI| J[Main Page]
  J -->|Navigate| K[Meeting, WatchParty, FileShare]
  subgraph Backend
    D
    F
    H
  end
  subgraph Frontend
    B
    G
    J
    K
  end
```

### Entity Relationship

```mermaid
erDiagram
  USER ||--o{ MEETING : participates
  USER ||--o{ WATCHPARTY : joins
  USER ||--o{ FILETRANSFER : sends
  USER ||--o{ FILETRANSFER : receives
  MEETING ||--o{ CHAT : has
  MEETING ||--o{ STREAM : has
  USER {
    string googleId
    string displayName
    string email
    string photo
  }
  MEETING {
    string roomId
    string hostId
    string[] participantIds
  }
  WATCHPARTY {
    string partyId
    string hostId
    string[] memberIds
    string videoUrl
  }
  FILETRANSFER {
    string transferId
    string senderId
    string receiverId
    string fileName
    int fileSize
  }
  CHAT {
    string messageId
    string senderId
    string text
    date sentAt
  }
  STREAM {
    string streamId
    string meetingId
    string type
  }
```

### Component/Service Overview

```mermaid
flowchart LR
  subgraph Frontend
    A[Login Page]
    B[Main Page]
    C[Meeting Page]
    D[Watch Party Page]
    E[File Share Page]
    F[Chat Panel]
  end
  subgraph Backend
    G[Express API]
    H[Auth Route]
    I[Stream Route]
    J[Socket.IO Server]
    K[MongoDB]
  end
  A-->|Google OAuth|H
  B-->|API Calls|G
  C-->|WebRTC/Socket|J
  D-->|Socket|J
  E-->|Socket|J
  F-->|Socket|J
  G-->|DB|K
  H-->|DB|K
  I-->|Socket|J
  J-->|DB|K
```

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis (for session store)

### 1. Clone the repository
```bash
git clone <repo-url>
cd videostreamer/streamer
```

### 2. Install dependencies
```bash
npm install
cd backend && npm install
```

### 3. Environment Variables
Create a `.env` file in `backend/`:
```
SESSION_SECRET=your_session_secret
uri=mongodb://localhost:27017/yourdbname
googleId=your_google_client_id
googleSecret=your_google_client_secret
```

### 4. Start the servers
- **Backend:**
  ```bash
  cd backend
  node index.js
  ```
- **Frontend:**
  ```bash
  cd ..
  npm start
  ```

---

## 🧑‍💻 Usage
- Visit [http://localhost:3000](http://localhost:3000)
- Login with Google
- Start or join a meeting, watch party, or file share

---

## 📚 API & Socket Endpoints

### Auth API
- `GET /api/auth/google` — Start Google OAuth
- `GET /api/auth/google/callback` — OAuth callback
- `GET /api/auth/logout` — Logout
- `GET /api/auth/current_user` — Get current user

### Socket Events
- `room-join`, `otheroom-join` — Join rooms
- `user-call`, `incoming-call`, `call-accepted` — WebRTC signaling
- `chat-message` — Send/receive chat
- `call-ended` — End call
- `send-chunk`, `receive-chunk` — File transfer

---

## 🖥️ Main Pages
- `/` — Main landing page
- `/login` — Google login
- `/meetinglobby` — Meeting lobby
- `/meeting` — Video meeting
- `/watchparty` — Watch party
- `/fileshare` — File sharing

---

## 🤝 Contributing
Pull requests welcome! For major changes, open an issue first to discuss what you would like to change.

---

## 📄 License
[MIT](LICENSE)
