<p align="center">
  <h1 align="center">🧵 CALIQUO</h1>
  <p align="center"><strong>B2B Apparel Stock Management — Weaving India Together!</strong></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Firebase-10.x-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Razorpay-Payments-0C2451?style=for-the-badge" alt="Razorpay" />
</p>

---

## 📖 About

**Caliquo** is a full-featured B2B apparel stock management platform designed for the Indian textile and garment industry. It connects suppliers and buyers on a single platform, streamlining stock discovery, order management, payments, logistics, and more — all with a beautiful, responsive UI.

---

## ✨ Features

### 🔐 Authentication & User Management
- Firebase-powered authentication with OTP support
- Role-based access control (Admin, Supplier, Buyer)
- User profile management

### 📦 Stock Management
- Publish & browse apparel stock listings with rich media
- Category-based filtering and smart search
- Camera integration for quick stock photography
- Virtual Try-On (VTON) capabilities

### 🛒 Cart & Orders
- Add-to-cart workflow for bulk B2B purchases
- Full order lifecycle management (create → confirm → ship → deliver)
- Order tracking and status updates
- Returns & exchange handling

### 💳 Payments & Financial
- Razorpay payment gateway integration
- Financial dashboards and transaction history
- Invoice generation

### 🚚 Logistics
- Shipment tracking and management
- Delivery status updates
- Logistics provider integration

### 📊 Dashboard & Analytics
- Admin dashboard with business insights
- Supplier performance metrics
- Order analytics and reporting via Recharts

### 🔔 Notifications
- Real-time notification system
- Banner announcements
- Push notification support (PWA)

### 🌐 Internationalization & Theming
- Multi-language support via LanguageProvider
- Light/Dark theme toggle
- Responsive mobile-first design

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript |
| **Build Tool** | Vite 6.3 |
| **Styling** | Tailwind CSS, Radix UI Primitives |
| **State Management** | React Context API |
| **Backend / BaaS** | Firebase (Auth, Firestore, Storage, Functions) |
| **Payments** | Razorpay |
| **Animations** | Framer Motion, tsParticles |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod validation |
| **UI Components** | Radix UI, shadcn/ui, Lucide Icons, cmdk |

---

## 📁 Project Structure

```
src/
├── App.tsx                  # Root app with providers & routing
├── main.tsx                 # Vite entry point
├── index.css                # Global styles & design tokens
├── components/
│   ├── admin/               # Admin panel & management
│   ├── auth/                # Authentication (Login, OTP, AuthProvider)
│   ├── builder/             # Page builder integration
│   ├── camera/              # Camera capture for stock photos
│   ├── cart/                # Shopping cart & CartProvider
│   ├── checkout/            # Checkout flow
│   ├── context/             # Global context providers
│   ├── dashboard/           # Analytics dashboards
│   ├── financial/           # Financial reports & invoices
│   ├── layout/              # App shell, sidebar, navigation
│   ├── logistics/           # Shipment & delivery tracking
│   ├── notifications/       # Real-time notification system
│   ├── orders/              # Order management & tracking
│   ├── payments/            # Payment processing (Razorpay)
│   ├── profile/             # User profile management
│   ├── purchase/            # Purchase workflows
│   ├── rating/              # Supplier & product ratings
│   ├── returns/             # Returns & exchanges
│   ├── stock/               # Stock listing, browsing, publishing
│   ├── suppliers/           # Supplier management
│   ├── ui/                  # Reusable UI primitives (shadcn/ui)
│   ├── utils/               # Utility components & helpers
│   ├── views/               # Page-level view components
│   └── vton/                # Virtual Try-On feature
├── config/                  # App configuration
├── functions/               # Firebase Cloud Functions
├── lib/                     # Shared libraries
├── types/                   # TypeScript type definitions
└── utils/                   # Utility functions & helpers
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Firebase** project with Firestore, Auth, and Storage enabled
- A **Razorpay** account (for payment features)

### Installation

```bash
# Clone the repository
git clone https://github.com/Jin-ix/Calquo.git
cd Calquo

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the project root with your Firebase and Razorpay credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

### Development

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Production Build

```bash
# Build for production
npm run build
```

The optimized bundle will be output to the `build/` directory.

---

## 🔧 Configuration

| File | Purpose |
|---|---|
| `vite.config.ts` | Vite build configuration & path aliases |
| `tsconfig.json` | TypeScript compiler options |
| `firebase.json` | Firebase project configuration |
| `firestore.rules` | Firestore security rules |
| `firestore.indexes.json` | Firestore composite indexes |
| `storage.rules` | Firebase Storage security rules |

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Create production build in `build/` |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

<p align="center">
  <strong>Caliquo</strong> — Weaving India Together! 🧵🇮🇳
</p>