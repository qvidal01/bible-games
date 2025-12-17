# Bible Games

Real-time multiplayer Bible trivia games built with Next.js 16, featuring **Bible Jeopardy** and **Bible Family Feud**. Perfect for family worship, congregation events, or solo Bible study.

**Live Demo:** [games.aiqso.io](https://games.aiqso.io)

---

## Features

- **Real-time Multiplayer** - Play with friends and family using room codes or QR codes
- **Two Game Modes** - Bible Jeopardy and Bible Family Feud
- **Projector/TV Mode** - Special display for screen sharing on Zoom or casting to TV
- **Host-Only Answer Viewing** - Hosts can check answers privately without revealing to players
- **Study Mode** - Solo practice mode for individual Bible study
- **Mobile Friendly** - Responsive design works on phones, tablets, and desktops
- **No Account Required** - Just enter your name and start playing

---

## Games

### Bible Jeopardy

The classic quiz show format with Bible-themed categories and questions.

#### How to Play

1. **Create or Join a Game**
   - **Host**: Click "Create Game", enter your name, and share the room code
   - **Players**: Click "Join with Code" and enter the 6-character room code

2. **Select Categories** (Host only)
   - Choose 5 categories from 20 available Bible topics
   - Or use the "Random" button for a surprise selection

3. **Gameplay**
   - Host clicks a dollar value to reveal a question
   - Players tap the **BUZZ** button when they know the answer
   - First player to buzz has 15 seconds to answer verbally
   - Host judges the answer: **Correct** (+points) or **Wrong** (-points)

4. **Special Features**
   - **Daily Double**: Hidden on the board - wager points before answering
   - **Double Jeopardy**: Round 2 with double point values
   - **Final Jeopardy**: All players wager and write their final answer

#### Host Controls

| Button | Description |
|--------|-------------|
| View Answer (Host Only) | See the answer privately - players won't see it |
| Correct / Wrong | Award or deduct points |
| Show Answer to All | Optional - reveal answer to everyone |
| Pass the Baton | Transfer host role to another player |
| End Game | Finish the current game session |

### Bible Family Feud

Team-based gameplay where families compete to guess the most popular survey answers.

#### How to Play

1. **Create a Game** - Host creates the room and sets up two teams
2. **Join Teams** - Players join either the Red or Blue team
3. **Face-Off** - One player from each team buzzes in first
4. **Play or Pass** - Winning team decides to play the round or pass to opponents
5. **Guess Answers** - Try to reveal all survey answers without getting 3 strikes
6. **Steal** - If a team strikes out, the other team can steal with one guess

---

## Projector Mode

Perfect for Zoom calls, TV displays, or projector setups.

**What it shows:**
- Game board with categories and point values
- Current question
- Player/team scores
- Who buzzed in

**What it hides:**
- Host control buttons
- Answer (unless explicitly shared)

**How to use:**
1. Click the purple **Projector View** button (monitor icon)
2. A new browser tab opens with the clean display
3. Share this tab on Zoom or drag to your TV
4. Control the game from your phone or another window

**URL format:** `games.aiqso.io/jeopardy/spectate/[ROOMCODE]`

---

## Installation

### Prerequisites

- Node.js 18 or higher
- npm 10 or higher
- Pusher account (for real-time features)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/qvidal01/bible-games.git
cd bible-games

# Install dependencies
npm install

# Set up environment variables (see below)
cp apps/web/.env.example apps/web/.env.local

# Start development server
npm run dev

# Open http://localhost:3060
```

### Environment Variables

Create `apps/web/.env.local` with:

```env
# Pusher (Required for multiplayer)
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=us2
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_pusher_secret

# Upstash Redis (Optional - for rate limiting)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# PostHog Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Inactivity Check Token (Optional)
INACTIVITY_CHECK_TOKEN=your_secret_token
```

#### Getting Pusher Credentials

1. Sign up at [pusher.com](https://pusher.com)
2. Create a new Channels app
3. Go to App Keys and copy the credentials
4. Enable client events in App Settings

### Available Scripts

```bash
# Development
npm run dev                    # Start dev server (port 3060)

# Building
npm run build                  # Build for production
npm run start                  # Start production server

# Linting
npm run lint                   # Run ESLint

# Clean
npm run clean                  # Remove build artifacts and node_modules
```

---

## Project Structure

```
bible-games/
├── apps/
│   └── web/                   # Next.js 16 application
│       ├── public/
│       │   └── videos/        # Tutorial video and thumbnail
│       └── src/
│           ├── app/
│           │   ├── api/       # API routes (rooms, broadcast, pusher auth)
│           │   ├── jeopardy/  # Jeopardy game pages
│           │   ├── family-feud/ # Family Feud game pages
│           │   └── page.tsx   # Home page
│           └── shared/
│               ├── components/ # Shared React components
│               ├── lib/       # Utilities (pusher, roomStore, sounds)
│               └── types/     # TypeScript types
├── packages/                  # Shared packages (reserved)
├── deploy/                    # Deployment scripts
└── How to Play Bible Jeopardy/ # Documentation
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org) | React framework with App Router |
| [React 19](https://react.dev) | UI library |
| [TypeScript](https://typescriptlang.org) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com) | Styling |
| [Pusher](https://pusher.com) | Real-time WebSocket communication |
| [Zustand](https://zustand-demo.pmnd.rs) | State management |
| [Turbo](https://turbo.build) | Monorepo build system |
| [Upstash Redis](https://upstash.com) | Rate limiting (optional) |
| [PostHog](https://posthog.com) | Analytics (optional) |

---

## Deployment

### Docker

```bash
# Build the image
docker build -t bible-games .

# Run the container
docker run -p 3060:3060 --env-file .env bible-games
```

### PM2

```bash
# Install PM2
npm install -g pm2

# Build the app
npm run build

# Start with PM2
pm2 start npm --name "bible-games" -- start

# Or use the ecosystem file
pm2 start deploy/ecosystem.config.js
```

### Vercel / Cloudflare

The app is compatible with edge deployments. Set environment variables in your platform's dashboard.

---

## Session Management

- **Room TTL**: 90 minutes maximum session length
- **Inactivity Warnings**: Players are warned at 10 and 20 minutes of inactivity
- **Auto-End**: Games automatically end after 30 minutes of inactivity
- **Room Cleanup**: Rooms are deleted when all players leave

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

- **Tutorial Video**: Available in-app via "Watch Tutorial" button
- **Feedback**: Use the feedback widget in the app
- **Issues**: [GitHub Issues](https://github.com/qvidal01/bible-games/issues)

---

## License

This project is private and proprietary.

---

## Acknowledgments

- Bible questions sourced from various Bible study resources
- Inspired by the classic TV game shows Jeopardy! and Family Feud
- Built for JW family worship and congregation events
