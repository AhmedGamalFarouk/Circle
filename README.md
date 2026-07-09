# Circle Web Portal - Social Circles Dashboard

A modern React-based web dashboard and user portal for the location-based social platform **Circle**. The web portal allows users to discover and join local social circles, participate in event scheduling, upload and view memories, chat in real-time, and purchase premium subscription features using Stripe.

---

## 🚀 Key Features

### 🗺️ Circle Discovery & Interactive Map
- Discover active public and private social circles.
- **Interactive Leaflet Map**: Built with `Leaflet` and `react-leaflet` to display circle locations geographically.
- Join request system for private circles, managed through a dedicated Requests panel.

### 💬 Real-Time Group Chats & Moderation
- Instant messaging inside circles powered by Firebase Realtime Database.
- Dynamic message rendering with media grids (collages) for multiple photos or video attachments.
- Emojis picker integration (`emoji-picker-react`).
- Voice notes recording and playback capabilities.
- Context menus for deleting or reacting to messages.
- Real-time online presence indicators.
- Automatic redirect to a Blocked Screen if a user is flagged or blocked by moderators.

### 📅 Event Management & Scheduler
- Create and organize events within circles.
- **Interactive Calendar Schedulers**: Integrated with `@fullcalendar/react` and `@schedule-x/react` supporting calendar view layouts (day, week, month, list) and smooth drag-and-drop actions.

### 📸 Memory Sharing & Gallery
- Dedicated media timelines ("Memories") for each circle.
- Upload photos and videos from local devices.
- Secure, client-side direct uploads utilizing **Cloudinary** media storage services.

### 💳 Stripe Integration
- Integrated premium tier subscription plans (Circle+).
- Secure credit card processing using `@stripe/stripe-js` and `@stripe/react-stripe-js` with custom redirects to Success/Cancel landing pages.

### 🌐 Localization & Design
- Full multi-language support (English & Arabic) powered by `i18next`.
- Complete Right-to-Left (RTL) layout switching for Arabic speakers.
- Dynamic light/dark mode system with modern CSS glassmorphism, GSAP, and Framer Motion micro-animations.

---

## 🛠 Tech Stack

### Frontend
- **React** (v19) - Core Library
- **Vite** - Build Tool and Dev Server
- **Tailwind CSS** (v4) - Styling and Utility Classes
- **Material UI (MUI)** - Components & Icon Library
- **Redux Toolkit & Redux Persist** - State management and local storage persistence
- **React Router** (v7) - Client-side Routing
- **Framer Motion & GSAP** - Premium animations and layout transitions

### Core Integrations & Services
- **Firebase** - Backend services
  - Firebase Authentication (Email/Password & Google Sign-in)
  - Cloud Firestore (Users, Circles, and Events metadata)
  - Realtime Database (Chat messages)
- **Cloudinary** - Media storage & hosting for memories, avatars, and cover photos
- **Stripe** - Payment gateway processing subscriptions
- **Leaflet & React-Leaflet** - Interactive location maps

---

## 💻 Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd WEB/Circle
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root of the `WEB/Circle` project directory:
   ```env
   VITE_STRIPE_KEY=your_stripe_publishable_key
   ```
   > ⚠️ **Note**: Firebase configuration is maintained in `src/firebase-config.js` and Cloudinary configuration is in `src/config/cloudinary.js`. Update those files with your credentials directly or refactor them to use `import.meta.env` keys if desired.

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

---

## 🏗 Directory Structure

```
WEB/Circle/
├── src/
│   ├── app/                # Redux Store configurations
│   ├── assets/             # Images, videos, and theme assets
│   ├── components/         # Reusable UI Components
│   │   ├── Chat/           # Chat input, messages, context menus
│   │   ├── Voting/         # Poll voting interfaces
│   │   └── ui/             # Modals, inputs, buttons, and steppers
│   ├── config/             # Cloudinary configuration
│   ├── constants/          # Styles and constant settings
│   ├── contexts/           # Pending requests, online presence, theme contexts
│   ├── features/           # Redux state slices (circles, notifications, user, profile)
│   ├── hooks/              # Custom hooks (media, voice, message management)
│   ├── layouts/            # Page layouts (RootLayout, Sidebar)
│   ├── locales/            # Translation dictionary JSONs (en, ar)
│   ├── pages/              # Page view components (Landing, Explore, Payments, Profile)
│   ├── routes/             # App routing configuration
│   ├── services/           # Cloudinary upload service
│   ├── utils/              # Chat formatting and general helpers
│   ├── App.jsx             # Main App entrypoint
│   └── main.jsx            # DOM mounting and provider wrapping
├── public/                 # Static assets
├── vite.config.js          # Vite build config
├── vercel.json             # Vercel deployment configuration
└── package.json            # Scripts and dependencies
```

---

## 🚀 Available Scripts

In the project root, you can run:

```bash
# Start development server on local dev network
npm run dev

# Run ESLint to analyze static code quality
npm run lint

# Build production-ready assets under the dist/ directory
npm run build

# Preview the local production build
npm run preview
```

---

## 🌐 Deployment

The repository includes a `vercel.json` file, allowing easy deployments to **Vercel**:
1. Install the Vercel CLI (`npm install -g vercel`) or link the GitHub repository to your Vercel Dashboard.
2. Ensure you add the `VITE_STRIPE_KEY` environment variable in the Vercel project settings.
3. Deploy!

---

Built with ❤️ for the Circle Community
