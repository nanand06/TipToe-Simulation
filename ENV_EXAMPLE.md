# Environment Variables

## Frontend (.env.local or Vercel Environment Variables)

Create a `.env.local` file in the `my-app/` directory (this file is gitignored):

```bash
# Backend API URL
# For local development: http://localhost:8000
# For production: https://your-backend-url.com
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**For Vercel deployment:**
- Go to your Vercel project settings
- Navigate to "Environment Variables"
- Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-url.com`
- Make sure to set it for Production, Preview, and Development environments

## Backend (Environment Variables)

The backend can optionally use:

```bash
# Frontend URL for CORS (optional - defaults to localhost)
FRONTEND_URL=https://your-frontend.vercel.app
```

**For Railway/Render/etc:**
- Add this in your platform's environment variables section
- This allows your deployed frontend to access the backend

## Quick Setup

### Local Development
1. Frontend: Create `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`
2. Backend: No env vars needed (uses defaults)

### Production
1. Frontend (Vercel): Set `NEXT_PUBLIC_API_URL` to your backend URL
2. Backend: Set `FRONTEND_URL` to your Vercel URL (for CORS)

