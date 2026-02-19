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
│   ├── globals.css    # Global styles with Tailwind CSS
│   ├── theme-guide.json        # Brand/theme color usage
│   ├── theme-utility-classes.json # Theme utility class reference
│   ├── onboarding/    # Onboarding flow
│   ├── api/           # API routes (profile, gigs, etc.)
│   └── components/    # Map, Sidebar, SettingsModal, etc.
├── prisma/            # Schema and migrations
├── public/            # Static assets (including uploads/resumes)
├── next.config.mjs    # Next.js configuration
├── postcss.config.mjs # PostCSS configuration
└── package.json       # Dependencies and scripts
```

## Features & architecture

- **Theme:** All UI uses theme variables and utility classes from `app/theme-guide.json` and `app/theme-utility-classes.json`. No hex codes or inline styles in components; map popups use CSS classes in `app/globals.css` (e.g. `.gig-popup .map-popup-content`).
- **Map:** Company view shows job pindrops with “X positions open” badge; person view shows gig workers or (for Company accounts) **Candidates** with resume popovers. Cluster tooltips describe companies/gigs in the cluster. “Locate me on map” in profile dropdowns zooms to user location with a themed marker.
- **Resume & candidates:** Individual/Job seeker accounts can add a **Resume** in Settings (sidebar → Settings → Resume): upload file and/or fill form (name, email, position, experience, work, education, salary, visibility to recruiter). Company accounts see candidates on the map (person view) with resume popovers. Resume data is exposed via `GET /api/gigs` for Company viewers.
- **APIs:**  
  - `GET` / `PATCH` `app/api/profile/resume` — fetch/update resume for current user (Individual only).  
  - `POST` `app/api/profile/resume/upload` — upload resume file (Individual only; stored under `public/uploads/resumes/{userId}/`).  
  - `GET` `app/api/gigs` — for Company, includes job seekers’ resume (and email) for candidate map view.

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
