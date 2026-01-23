# Runner - Running Club & Marathon Events Website

A modern Next.js website for a running club and marathon sports events, inspired by sports-themed designs.

## Features

- 🏃 Modern hero section with background image
- 🎨 Beautiful header with logo and navigation
- 📱 Fully responsive design
- ⚡ Built with Next.js 14 and TypeScript
- 🎨 Styled with Tailwind CSS

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Landing page
│   └── globals.css     # Global styles
├── components/
│   ├── Header.tsx      # Header component with logo and navigation
│   └── Hero.tsx        # Hero section component
└── public/             # Static assets
```

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Next/Image** - Optimized images

## Customization

- Update the logo in `components/Header.tsx`
- Change the hero image URL in `components/Hero.tsx`
- Modify colors in `tailwind.config.ts`
- Edit content in the respective component files

## Build for Production

```bash
npm run build
npm start
```

