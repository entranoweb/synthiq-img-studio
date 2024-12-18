---
name: Synthiq Image Studio
slug: synthiq-img-studio
description: A modern web application for AI image generation and management. Built with Next.js, featuring a sleek UI and powerful image generation capabilities.
framework: Next.js
useCase: Web Application
css: Tailwind
database: Vercel Postgres
deployUrl: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fsynthiq-img-studio&project-name=synthiq-img-studio&repository-name=synthiq-img-studio&demo-title=Synthiq%20Image%20Studio&demo-description=A%20modern%20web%20application%20for%20AI%20image%20generation%20and%20management.&demo-url=https%3A%2F%2Fsynthiq-img-studio.vercel.app%2F&demo-image=https%3A%2F%2Fsynthiq-img-studio.vercel.app%2Fopengraph-image.png&stores=%5B%7B"type"%3A"postgres"%7D%5D
demoUrl: https://synthiq-img-studio.vercel.app/
relatedTemplates:
  - postgres-starter
  - postgres-prisma
  - postgres-kysely
---

# Synthiq Image Studio

A modern web application for AI image generation and management. Built with Next.js, featuring a sleek UI and powerful image generation capabilities.

## Features

- AI-powered image generation
- Modern, responsive UI with image gallery
- Full-screen image viewer with navigation
- Image download functionality
- User authentication
- Secure image storage

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Database**: Vercel Postgres
- **ORM**: Drizzle
- **Authentication**: NextAuth.js
- **UI Components**: Custom components with Framer Motion

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/entranoweb/synthiq-img-studio.git
cd synthiq-img-studio
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the example environment file:
```bash
cp .env.example .env
```

4. Update the environment variables in `.env` with your credentials

5. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

The following environment variables are required:

- `DATABASE_URL`: Your Postgres database URL
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `NEXTAUTH_URL`: Your application URL
- `OPENAI_API_KEY`: Your OpenAI API key for image generation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
