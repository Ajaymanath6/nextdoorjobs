# NextDoorJobs

A Next.js application built with the latest stable versions of Next.js and Tailwind CSS, ready for deployment on Vercel.

## Tech Stack

- **Next.js** 16.1.1 (Latest stable version)
- **React** 19.2.3
- **Tailwind CSS** 4.1.18 (Latest stable version)
- **JavaScript** (ES6+)
- **App Router** (Next.js 13+ routing)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ajaymanath6/nextdoorjobs.git
cd nextdoorjobs
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

## Project Structure

```
nextdoorjobs/
├── app/                # App Router directory
│   ├── layout.js      # Root layout component
│   ├── page.js        # Home page
│   └── globals.css    # Global styles with Tailwind CSS
├── public/            # Static assets
├── next.config.mjs    # Next.js configuration
├── postcss.config.mjs # PostCSS configuration
└── package.json       # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment to Vercel

This project is configured for seamless deployment on Vercel.

### Quick Deploy

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

2. Import your repository on Vercel:
   - Go to [Vercel](https://vercel.com/)
   - Sign up or log in with your GitHub account
   - Click "New Project"
   - Import the `nextdoorjobs` repository
   - Vercel will automatically detect Next.js and configure the project
   - Click "Deploy"

### Automatic Deployments

Once connected to Vercel:
- Every push to the `main` branch will trigger a production deployment
- Pull requests will create preview deployments
- Vercel automatically optimizes your Next.js application

### Environment Variables

If you need to add environment variables:
1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add your variables
4. Redeploy your application

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Next.js App Router](https://nextjs.org/docs/app) - Learn about the App Router
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Learn about Tailwind CSS
- [Vercel Deployment Guide](https://vercel.com/docs) - Learn about deploying on Vercel

## License

This project is private and proprietary.
