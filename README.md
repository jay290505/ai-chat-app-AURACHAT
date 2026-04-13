# 🌌 AuraChat — AI-Powered Messenger

<div align="center">

![AuraChat Banner](https://img.shields.io/badge/AuraChat-AI%20Messenger-6C63FF?style=for-the-badge&logo=chatbot&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss)

**A modern, real-time AI-powered chat application with built-in AI assistant, smart replies, and seamless user messaging.**

</div>

---

## ✨ Features

### 💬 Real-Time Messaging
- Instant message delivery using Supabase Realtime
- Message read receipts & typing indicators
- Group chat creation and management
- Contact discovery and friend requests

### 🤖 AI Assistant (Aura AI)
- Dedicated AI chat interface powered by **Google Gemini** & **Groq**
- **Smart Reply** suggestions based on conversation context
- **Message Rewriting** — improve tone and clarity
- **Summarization** — get quick summaries of long conversations
- **Translation** — translate messages across languages

### 🔐 Authentication
- Email/password sign-up & sign-in
- Google OAuth integration
- Supabase Auth with secure session management
- Protected routes via Next.js middleware

### 👤 User Profiles
- Customizable profile with avatar upload
- Online/offline status
- Account settings management

### 🛡️ Admin Dashboard
- User management and statistics
- Chat monitoring and moderation tools
- Activity analytics with Recharts

### 🎨 UI/UX
- Dark/Light mode toggle with system preference sync
- Smooth animations via **Framer Motion**
- Beautiful, responsive design
- Push notification support (PWA-ready with service worker)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Backend/DB** | Supabase (PostgreSQL + Realtime) |
| **Auth** | Supabase Auth + Google OAuth |
| **AI - Chat** | Google Gemini (`@google/generative-ai`) |
| **AI - LLM** | Groq SDK |
| **State Management** | Zustand |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Testing** | Jest + Testing Library |

---

## 📁 Project Structure

```
chat-app/
├── frontend/
│   ├── public/              # Static assets & PWA manifest
│   ├── scripts/             # Dev/admin utility scripts
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/       # Admin dashboard page
│   │   │   ├── ai/          # Aura AI assistant page
│   │   │   ├── api/         # API route handlers
│   │   │   │   └── ai/      # AI endpoints (chat, smart-reply, summarize, translate, rewrite)
│   │   │   ├── auth/        # Auth callback handler
│   │   │   ├── chat/        # Main chat interface
│   │   │   ├── profile/     # User profile page
│   │   │   ├── signin/      # Sign-in page
│   │   │   ├── signup/      # Sign-up page
│   │   │   └── page.tsx     # Landing/home page
│   │   ├── components/
│   │   │   ├── chat/        # Chat UI components
│   │   │   └── profile/     # Profile UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/
│   │   │   ├── ai/          # AI provider integrations
│   │   │   └── supabase/    # Supabase client setup
│   │   ├── store/           # Zustand state stores
│   │   └── types/           # TypeScript type definitions
│   └── package.json
├── supabase/
│   ├── schema.sql           # Full database schema
│   ├── admin_dashboard_setup.sql
│   └── contact_requests_migration.sql
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- Google Gemini API key (from [Google AI Studio](https://aistudio.google.com))
- Groq API key (from [Groq Console](https://console.groq.com))

### 1. Clone the Repository

```bash
git clone https://github.com/jay290505/ai-chat-app-AURACHAT.git
cd ai-chat-app-AURACHAT/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file inside the `frontend/` directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI APIs
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up the Database

Run the SQL files in your Supabase SQL editor in this order:
1. `supabase/schema.sql`
2. `supabase/contact_requests_migration.sql`
3. `supabase/admin_dashboard_setup.sql`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run seed-login   # Seed a dev login user
```

---

## 📸 Pages Overview

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signup` | Create a new account |
| `/signin` | Sign in to your account |
| `/chat` | Main real-time chat interface |
| `/ai` | Aura AI assistant chat |
| `/profile` | User profile settings |
| `/admin` | Admin dashboard (restricted) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is for educational and personal use.

---

<div align="center">

Made with ❤️ by [jay290505](https://github.com/jay290505)

⭐ **Star this repo if you found it useful!**

</div>
