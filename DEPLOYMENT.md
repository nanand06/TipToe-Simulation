# Deployment Guide

This guide explains how to deploy the Tiptoe Private Search System.

## Architecture

The system consists of two parts:
1. **Frontend (Next.js)** - Deploy on Vercel
2. **Backend (FastAPI)** - Deploy on Railway, Render, Fly.io, or similar

## Frontend Deployment (Vercel)

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Backend deployed and accessible via HTTPS

### Steps

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-url.com`
   - Make sure to set it for Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - Your app will be live at `https://your-project.vercel.app`

### Vercel Configuration

The project is configured for Vercel by default. No additional configuration needed.

## Backend Deployment

The backend needs to be deployed separately. Here are recommended options:

### Option 1: Railway (Recommended - Easy)

1. **Create Railway account** at [railway.app](https://railway.app)
2. **Create new project** → "Deploy from GitHub repo"
3. **Select your repository** and set root directory to `backend/`
4. **Configure build settings**:
   - Build command: `pip install -r requirements.txt`
   - Start command: `python main.py`
5. **Set environment variables** (if needed)
6. **Deploy** - Railway will provide a URL like `https://your-app.railway.app`
7. **Update CORS** in `backend/main.py` to include your Vercel URL:
   ```python
   allow_origins=["http://localhost:3000", "https://your-project.vercel.app"]
   ```

### Option 2: Render

1. **Create Render account** at [render.com](https://render.com)
2. **Create new Web Service**
3. **Connect GitHub repository**
4. **Configure**:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python main.py`
5. **Deploy** and get your URL
6. **Update CORS** in backend

### Option 3: Fly.io

1. **Install Fly CLI**: `curl -L https://fly.io/install.sh | sh`
2. **In backend directory**, run: `fly launch`
3. **Follow prompts** to create app
4. **Deploy**: `fly deploy`
5. **Get URL** and update CORS

### Option 4: PythonAnywhere

1. **Create account** at [pythonanywhere.com](https://www.pythonanywhere.com)
2. **Upload backend files** via Files tab
3. **Create Web App** → Manual configuration
4. **Set WSGI file** to point to your FastAPI app
5. **Reload** and get your URL

## Post-Deployment Checklist

### Frontend (Vercel)
- [ ] Environment variable `NEXT_PUBLIC_API_URL` is set
- [ ] App builds successfully
- [ ] Can access frontend URL

### Backend
- [ ] Backend is accessible via HTTPS
- [ ] CORS is configured to allow your Vercel domain
- [ ] Data folder is persisted (check if platform supports persistent storage)
- [ ] Backend logs show successful startup

### Testing
- [ ] Frontend can connect to backend
- [ ] Search functionality works
- [ ] Clusters load correctly
- [ ] PIR requests complete successfully

## Environment Variables Summary

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Backend (Railway/Render/etc)
No required environment variables for basic setup. The backend will:
- Create `data/` folder automatically
- Use default settings for clustering

## Troubleshooting

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend URL is accessible (try in browser)
- Check CORS settings in backend

### Backend errors
- Check logs in your hosting platform
- Verify all dependencies are in `requirements.txt`
- Ensure Python version is compatible (3.8+)

### Data not persisting
- Some platforms (like Railway) have ephemeral storage
- Consider using external storage (S3, database) for production
- For demo, data will regenerate on restart

## Production Considerations

For a production deployment:

1. **Database**: Replace pickle files with a real database (PostgreSQL, MongoDB)
2. **Storage**: Use cloud storage (S3, GCS) for embeddings
3. **Caching**: Add Redis for caching
4. **Monitoring**: Add logging and monitoring (Sentry, DataDog)
5. **Security**: 
   - Add authentication
   - Rate limiting
   - Input validation
   - HTTPS only
6. **Scaling**: 
   - Use load balancers
   - Horizontal scaling
   - CDN for static assets

## Quick Deploy Commands

### Vercel (via CLI)
```bash
npm i -g vercel
cd my-app
vercel
```

### Railway (via CLI)
```bash
npm i -g @railway/cli
cd backend
railway login
railway init
railway up
```

