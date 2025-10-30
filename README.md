# 🛡️ Warranty Tracker

> **Never lose a warranty again.** Track all your product warranties in one beautiful dashboard with AI-powered features, smart reminders, and emergency access.

[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-powered-green)](https://supabase.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ Features

### 🎯 Core Features
- **Add Warranties:** Manually, via barcode scan, or AI receipt OCR
- **Edit & Delete:** Full CRUD operations with confirmations
- **Smart Dashboard:** Color-coded status cards and statistics
- **Search & Filter:** Advanced filters by status, category, price, and more
- **Bulk Actions:** Multi-select, bulk delete, and export

### 🚨 Emergency & Alerts
- **Emergency Mode:** Quick access to warranties when you need them most
- **Smart Notifications:** Browser notifications at 30, 14, 7, and 1 days before expiry
- **Visual Timeline:** See upcoming expirations grouped by urgency
- **Urgent Indicators:** Pulsing borders and alerts for warranties expiring soon

### 🤖 AI-Powered
- **Receipt OCR:** Snap a photo, AI extracts all details (OpenAI Vision)
- **Barcode Lookup:** AI web search for product information (GPT-4)
- **Smart Insights:** AI analyzes your data and provides personalized recommendations

### 📋 Claims Management
- **Claim Wizard:** 4-step guided process to file claims
- **Progress Tracking:** Monitor claim status and history
- **Evidence Upload:** Attach photos and videos
- **Export Options:** Download as PDF or email to support

### 💰 Financial Insights
- **Value Dashboard:** Track total protected value and savings
- **Category Analytics:** See where you're investing most
- **High-Value Alerts:** Special attention for expensive items
- **Spending Trends:** Recent purchase pattern analysis

### ⚡ Power User Features
- **Keyboard Shortcuts:** `Ctrl+N` (Add), `/` (Search), `Shift+E` (Emergency), `?` (Help)
- **CSV Export:** Export all or selected warranties
- **PDF Generation:** Download individual warranty certificates
- **Recent Activity:** Feed of all your actions

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([Install with nvm](https://github.com/nvm-sh/nvm))
- **npm** or **yarn**
- **Supabase Account** (free tier works)
- **OpenAI API Key** (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/warranty-tracker.git
cd warranty-tracker

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your credentials to .env.local
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_OPENAI_API_KEY=your_openai_key

# Start development server
npm run dev
```

Visit `http://localhost:8080` (or the port shown in terminal)

---

## 🗄️ Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for setup to complete (~2 minutes)

### 2. Run Migration
1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy contents from `/supabase/COPY_PASTE_THIS_TO_SUPABASE.sql`
4. Paste and click **Run**

This creates:
- All necessary tables
- Row Level Security policies
- Storage buckets for receipts/photos
- Helper functions

### 3. (Optional) Add Test Data
Run `ADD_TEST_WARRANTIES.sql` to add 15 sample warranties with various expiry dates for testing.

---

## 🎨 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **TanStack Query** - Data fetching & caching
- **React Router** - Client-side routing

### Backend & Services
- **Supabase** - Authentication, database, and storage
- **PostgreSQL** - Relational database
- **Row Level Security** - Data protection
- **OpenAI GPT-4** - AI barcode lookup
- **OpenAI Vision** - Receipt OCR

### Libraries
- **html5-qrcode** - Barcode scanning
- **jsPDF** - PDF generation
- **date-fns** - Date manipulation
- **Lucide React** - Icons

---

## 📁 Project Structure

```
warranty-bot-main/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── AddWarrantyDialog.tsx
│   │   ├── EditWarrantyDialog.tsx
│   │   ├── WarrantyCard.tsx
│   │   ├── EmergencyModal.tsx
│   │   ├── SmartInsights.tsx
│   │   └── ...
│   ├── pages/               # Route pages
│   │   ├── Index.tsx        # Landing page
│   │   ├── Dashboard.tsx    # Main app
│   │   ├── Settings.tsx     # User settings
│   │   └── Auth.tsx         # Login/Signup
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities & services
│   │   ├── ai-barcode-lookup.ts
│   │   ├── receipt-ocr.ts
│   │   ├── notifications.ts
│   │   └── pdf-generator.ts
│   └── integrations/
│       └── supabase/        # Supabase client
├── supabase/
│   └── migrations/          # SQL migration files
├── public/                  # Static assets
└── docs/                    # Documentation
```

---

## 🔐 Environment Variables

Create `.env.local` in project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI (for AI features)
VITE_OPENAI_API_KEY=sk-your-openai-key-here
```

⚠️ **Never commit `.env.local` to Git!** It's already in `.gitignore`.

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Sign up and login
- [ ] Add warranty manually
- [ ] Scan barcode (requires camera)
- [ ] Upload receipt for OCR
- [ ] Edit warranty
- [ ] Delete warranty
- [ ] Test search and filters
- [ ] Export to CSV
- [ ] Download PDF
- [ ] File a claim
- [ ] Test emergency mode
- [ ] Check notifications work
- [ ] Try keyboard shortcuts

### Test on Mobile
```bash
# Get your local network IP
npm run dev

# Open on phone using Network URL
# Example: http://192.168.1.100:8080
```

---

## 📦 Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

Output in `dist/` folder.

---

## 🚀 Deployment

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for detailed instructions.

### Quick Deploy

**Vercel (Recommended):**
```bash
npm i -g vercel
vercel
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy
```

Don't forget to add environment variables in your hosting platform!

---

## 📊 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Check TypeScript types |

---

## 🎯 Roadmap

### Phase 1 ✅ (Complete - MVP)
- [x] Core warranty CRUD
- [x] Barcode scanning
- [x] AI receipt OCR
- [x] Smart notifications
- [x] Emergency mode
- [x] Claims management
- [x] Value dashboard
- [x] Smart insights
- [x] Search & filters
- [x] Export & PDF
- [x] Settings page

### Phase 2 (Planned)
- [ ] Dark mode
- [ ] Email notifications
- [ ] Family sharing
- [ ] Mobile app (React Native)
- [ ] Retailer integrations
- [ ] AI chatbot
- [ ] Extended analytics
- [ ] Bulk CSV import

### Phase 3 (Future)
- [ ] Business accounts
- [ ] White-label solution
- [ ] API for developers
- [ ] Browser extension

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation:** See `/docs` folder
- **Deployment Help:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Feature List:** [FEATURES_COMPLETE.md](./FEATURES_COMPLETE.md)
- **Issues:** Open a GitHub issue

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful components
- [Supabase](https://supabase.com) - Backend infrastructure
- [OpenAI](https://openai.com) - AI capabilities
- [Lucide](https://lucide.dev) - Icons
- [Vercel](https://vercel.com) - Deployment platform

---

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Emergency Mode
![Emergency Mode](docs/screenshots/emergency.png)

### Smart Insights
![Smart Insights](docs/screenshots/insights.png)

---

## 💡 Tips

### Camera not working?
- Grant camera permissions in browser settings
- Use HTTPS (localhost works)
- Test on mobile Safari for best results

### AI features not working?
- Verify OpenAI API key is valid
- Check API key has credits
- Ensure key is properly set in environment variables

### Slow database queries?
- Add indexes to frequently queried columns
- Use `select()` to fetch only needed fields
- Enable query caching

---

**Built with ❤️ to help you never lose warranty coverage again.**

[⭐ Star this repo](https://github.com/yourusername/warranty-tracker) if you find it useful!
