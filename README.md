# Subscription Tracker (MVP)

A single-page full-stack web application built with Next.js, TypeScript, and TailwindCSS that helps you track and manage your recurring subscription costs to mitigate "subscription creep."

## Features

- ✅ Add and manage subscriptions with name, cost, renewal date, cycle, and status
- ✅ View all subscriptions in a clean, organized table
- ✅ Calculate total monthly cost (including annualized costs)
- ✅ Get alerts for upcoming renewals within the next 5 days
- ✅ Local storage persistence (data saved in browser)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Storage**: LocalStorage (browser)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd VarunSubTracker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Deployment

This app can be easily deployed on [Vercel](https://vercel.com) (recommended for Next.js apps):

1. Push your code to GitHub
2. Import your repository on Vercel
3. Deploy automatically

## License

MIT

