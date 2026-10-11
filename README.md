# Travelholic (Wanderly) 🌄
> **"Not just a trip. An adventure."**  
> AI-powered mystery itinerary planner, interactive travel quests, community budget corrections, public discovery, and live co-traveling companion app.

![Travelholic Banner](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 What makes Travelholic unique?

$$\text{PLAN WITH AI} \longrightarrow \text{MYSTERY UNLOCK} \longrightarrow \text{ITEMIZED BUDGET & EAT/SHOP} \longrightarrow \text{CORRECT & PUBLISH} \longrightarrow \text{CO-TRAVEL LIVE}$$

1. **AI Mystery Quest Generation**: Input starting city, budget, duration, transport preference, and travel vibe. Google Gemini constructs a multi-stop quest where future stops remain mystery surprises until current missions are completed.
2. **Itemized Budget & Eat/Shop Price Breakdown**: Real breakdowns of transport costs (Bus, Auto, Metro, Taxi), recommended local eateries & shops, and estimated vs. actual user spend.
3. **Agent + User Corrections**: AI itineraries can be inaccurate. Travelholic empowers travelers to correct budget estimates, transport modes, and local shop recommendations, then publish improved quests for the public!
4. **Public Quest Discovery & Social Connections**: Search public quests created by other travelers, send friend requests, view traveled itineraries, and join ongoing live co-travel quests.
5. **Premium Aesthetic & Modern Fonts**: Elegant UI with Playfair Display headings, Plus Jakarta Sans UI text, micro-animations, glassmorphism cards, and dark/light contrast styling.

---

## 📱 Core Features & Screen Flows

- **Home & Quick Start**: Modern hero landing with quest stats, live active quests preview, and fast plan creation.
- **Login & Authentic Portal**: Sleek authentication screen supporting email/password and guest sessions with custom fonts.
- **Plan Creating Wizard**: Intuitive budget control (₹ INR), travel vibe pills (Scenic, Foodie, Culture, Nature), transport mode selection, and Gemini AI itinerary generator.
- **Dashboard & Adventure Map**: Visual progression map with unlocked nodes, mystery locked pins, and trip stats card.
- **Destination Detail & Budget Breakdown**: Itemized price tags for transportation, dining, local markets, agent travel tips, and a full **User Correction & Transport Picker Panel**.
- **Explorer Social Hub**: Search travelers, view profiles, send/receive friend requests, and join live co-traveling quests.
- **Quest Publisher & Community Hub**: Publish corrected trips to the public discovery feed with custom titles, vibe tags, and community transport tips.
- **Travel Journal & Photo Lightbox**: Timeline memories, photo gallery, actual spend logs, and points summary.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Vanilla CSS, Tailwind CSS, Google Fonts (Plus Jakarta Sans, Playfair Display, Outfit)
- **AI Engine**: Google Gemini AI (`lib/ai/itinerary-planner.ts`)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) & transactional functions
- **Auth**: Supabase Auth & Local Guest Sessions fallback
- **Storage**: Supabase Storage (`journal-photos` bucket) & local storage fallback engine
- **Deployment**: Vercel ready

---

## 🗄️ Database Schema & Setup

The complete Supabase PostgreSQL schema is consolidated in [`supabase/schema.sql`](file:///supabase/schema.sql).

### Core Tables:
1. `profiles`: User details, bio, badges, coin rewards, and social stats.
2. `trips`: Private and public itineraries with budget, travel style, vibe, transport mode, and clone counts.
3. `destinations`: Individual stops with mystery unlock status, actual spend, preferred transport, and custom notes.
4. `missions`: Objectives, requirements, photo counts, and point rewards.
5. `journal_entries`: Timestamped traveler notes, actual spending, and completed stop photos.
6. `friendships`: Friend request states (`pending`, `accepted`, `rejected`).
7. `trip_companions`: Co-travelers joining live active quests.

---

## 🚀 Deployment & Local Setup Guide

For full Vercel hosting instructions and Supabase configuration, check the **[Deployment Guide](DEPLOYMENT_GUIDE.md)**.

### Quick Local Start:

```bash
# 1. Clone repository
git clone https://github.com/your-username/travelholic.git
cd TRAVELHOLIC

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional for local demo mode)
cp .env.example .env.local

# 4. Start local development server
cmd /c npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 📄 License
MIT © 2026 Travelholic
