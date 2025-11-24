# Quick Deployment Checklist

## Step 1: Deploy Backend on Railway First

### Railway Setup
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Click **"Add Service"** → **"GitHub Repo"** (if not already added)
5. In the service settings, click **"Settings"** tab:

   **Root Directory:**
   ```
   backend
   ```

   **Build Command:**
   ```
   pip install -r requirements.txt
   ```

   **Start Command:**
   ```
   python main.py
   ```

6. Go to **"Variables"** tab and add:
   ```
   Name: FRONTEND_URL
   Value: (leave empty for now, add after Vercel deployment)
   ```

7. Click **"Deploy"** - Railway will build and deploy
8. Once deployed, go to **"Settings"** → **"Networking"** → Copy the **"Public Domain"** URL
   - It will look like: `https://your-app-production.up.railway.app`
   - **Save this URL** - you'll need it for Vercel!

---

## Step 2: Deploy Frontend on Vercel

### Vercel Setup
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js - **don't change any build settings**
5. Go to **"Environment Variables"** section and add:

   **Variable Name:**
   ```
   NEXT_PUBLIC_API_URL
   ```

   **Value:**
   ```
   https://your-app-production.up.railway.app
   ```
   (Use the Railway URL you copied in Step 1)

   **Environments:** Check all three:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

6. Click **"Deploy"**
7. Once deployed, copy your Vercel URL
   - It will look like: `https://your-project.vercel.app`
   - **Save this URL** - you'll need it for Railway!

---

## Step 3: Update Railway CORS

1. Go back to Railway
2. Go to your service → **"Variables"** tab
3. Update the `FRONTEND_URL` variable:
   ```
   Name: FRONTEND_URL
   Value: https://your-project.vercel.app
   ```
   (Use the Vercel URL you copied in Step 2)

4. Railway will automatically redeploy with the new variable

---

## Step 4: Test Your Deployment

1. Open your Vercel URL: `https://your-project.vercel.app`
2. Try searching for something
3. Check browser console for any errors
4. If you see CORS errors, double-check:
   - Railway has `FRONTEND_URL` set correctly
   - Vercel has `NEXT_PUBLIC_API_URL` set correctly

---

## Summary of URLs You Need

**Railway Backend URL:**
```
https://your-app-production.up.railway.app
```
→ Put this in Vercel as `NEXT_PUBLIC_API_URL`

**Vercel Frontend URL:**
```
https://your-project.vercel.app
```
→ Put this in Railway as `FRONTEND_URL`

---

## Troubleshooting

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` in Vercel matches your Railway URL
- Make sure Railway service is running (check "Deployments" tab)

### CORS errors
- Check `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Make sure Railway redeployed after adding the variable

### Backend not starting
- Check Railway logs in "Deployments" tab
- Verify `requirements.txt` has all dependencies
- Check that `main.py` is in the `backend/` folder
- **"Make sure your app is actually running on a public HTTP port" error:**
  - The backend is now configured to use Railway's PORT environment variable
  - Make sure `main.py` has been updated with the latest code
  - Railway automatically sets the PORT variable - no need to configure it manually

---

## Quick Reference

| Platform | What to Deploy | Root Directory | Environment Variables |
|----------|---------------|----------------|----------------------|
| **Railway** | Backend (FastAPI) | `backend` | `FRONTEND_URL=https://your-project.vercel.app` |
| **Vercel** | Frontend (Next.js) | (root) | `NEXT_PUBLIC_API_URL=https://your-app.railway.app` |

