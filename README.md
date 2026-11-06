# Pomer

A modern React-based poker tournament manager with customizable blind structures, countdown timers, multilingual support, and responsive design.

## 🎯 Features

- **Smart Countdown Timer**: Automatic level control with pause/resume functionality
- **Predefined Structures**: Small, medium, large, and turbo tournament formats
- **Full Customization**: Thematic colors, level duration, and break intervals
- **Detailed History**: Complete tracking of played levels with timestamps
- **Multilingual**: Support for Portuguese, Spanish, and English
- **Responsive Design**: Modern interface with light/dark mode
- **Local Persistence**: Automatic configuration saving

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **UI Framework**: HeroUI v3
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/guiferpa/pomer.git

# Navigate to the project directory
cd pomer

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

## 📱 Usage

1. **Configure Tournament**: Set up tournament name, level duration, break intervals, and blind structure
2. **Customize Theme**: Choose from 8 color themes and light/dark mode
3. **Start Tournament**: Begin the countdown with automatic level progression
4. **Manage Controls**: Pause, resume, skip levels, or reset as needed
5. **Track History**: Monitor completed levels and tournament progress

## 🎨 Customization

### Tournament Structures
- **Small**: 25/50 - 15 levels
- **Medium**: 50/100 - 20 levels  
- **Large**: 100/200 - 25 levels
- **Turbo**: 25/50 - 12 levels, 10min duration

### Color Themes
- Blue, Red, Green, Orange
- Purple, Turquoise, Pink, Yellow

### Configuration Options
- Level duration: 1-60 minutes
- Break intervals: 1-10 levels
- Break duration: 1-30 minutes

## 🌍 Internationalization

Full support for:
- 🇧🇷 Portuguese (Brazil)
- 🇪🇸 Spanish
- 🇺🇸 English

## 📦 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint with auto-fix
npm test         # Run the test suite
```

## 📊 Viewing Metrics

Usage metrics are collected with Google Analytics 4 (measurement ID `G-PMN8PV506L`). To view them, open [Google Analytics](https://analytics.google.com/) with an account that has access to the property, then go to:

- **Reports > Realtime**: visitors and events happening now.
- **Reports > Engagement > Events**: totals for each event over time. New data can take 24-48 hours to appear.
- **Admin > DebugView**: events from a browser in debug mode, useful for testing new events.

| Event | Sent when | `event_label` |
| --- | --- | --- |
| `tournament_started` | A tournament starts | Tournament name |
| `tournament_paused` | The clock is paused | - |
| `tournament_resumed` | The clock is resumed | - |
| `level_skipped` | A level is skipped manually | Skipped level |
| `tournament_reset` | A tournament is reset | - |

Events also send `event_category`. To break reports down by `event_category` or `event_label`, first register each one as an event-scoped custom dimension in **Admin > Custom definitions**. Values become available only after registration, and can take up to 48 hours to appear.

Keep in mind when reading the numbers:

- Page views drop starting AAAA-MM-DD. That drop is a counting fix, not a loss of usage: before that date, each component that sent events also sent an extra page view when it mounted. Now only `index.html` registers the page view.
- Local development sessions are counted too, because tracking is not limited to production.

To set up a new property, see [ANALYTICS_SETUP.md](ANALYTICS_SETUP.md).

## 🎯 Target Audience

Perfect for:
- Poker tournament organizers
- Poker rooms and casinos
- Casual player groups
- Corporate poker events
- Home tournaments

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Pomer** - Simplifying poker tournament organization with modern technology and intuitive design.