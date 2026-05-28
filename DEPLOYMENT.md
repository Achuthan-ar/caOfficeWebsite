# CA Office ERP - Production Deployment Guide

This guide details instructions and configuration requirements for deploying the **CA Office ERP** application to production.

---

## 1. Production Environment Configurations

Ensure the following environment variables are configured in your hosting panels (Vercel, Netlify, Render, Railway, etc.):

### Backend environment variables (`.env`)
| Key | Example / Description |
| :--- | :--- |
| `PORT` | `5000` (automatically provisioned by Render/Railway) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://ca-office-erp.vercel.app` (your frontend domain) |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/ca_office` (MongoDB Atlas link) |
| `JWT_SECRET` | A secure, random 256-bit string |
| `JWT_REFRESH_SECRET` | A separate secure, random 256-bit string |
| `JWT_EXPIRES_IN` | `15m` (short-lived access tokens) |
| **SMTP (Nodemailer)** | |
| `SMTP_HOST` | `smtp.gmail.com` or SendGrid server |
| `SMTP_PORT` | `465` (SSL) or `587` (TLS) |
| `SMTP_USER` | Your SMTP mail address |
| `SMTP_PASS` | Your secure app password |
| `FROM_EMAIL` | `"CA Office Team" <notifications@yourdomain.com>` |
| **Cloudinary** | |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Account Cloud Name |
| `CLOUDINARY_API_KEY` | Cloudinary account credential |
| `CLOUDINARY_API_SECRET` | Cloudinary secure API secret |

### Frontend environment variables (`.env` or variables panel)
| Key | Example / Description |
| :--- | :--- |
| `VITE_API_URL` | `https://ca-office-backend.onrender.com/api` (your production API link) |

---

## 2. Cloudinary File Storage Configuration

Cloudinary handles secure uploads for client financial documents, applicant resumes, and intern worksheets.
1. Sign up for a free account at [Cloudinary](https://cloudinary.com).
2. Grab your **Cloud Name**, **API Key**, and **API Secret** from the console dashboard and paste them into your backend environment panel.
3. If they are left empty, the application will degrade gracefully to **local workspace disk storage** (`backend/uploads/`), which is ideal for offline development and local debugging.

---

## 3. Database Deployment (MongoDB Atlas)

1. Set up a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under "Network Access", allow access from `0.0.0.0/0` (or configure specific static IPs if utilizing premium hosting).
3. Under "Database Access", create an admin user with read/write privileges.
4. Retrieve the SRV Connection String and input it into the backend's `MONGODB_URI` environment variable.
5. **Autoseeder Active**: The database is equipped with an automatic seeder. On first boot, if the collections are empty, it will seed all default roles, permission scopes, demo departments, admin accounts, and sample blogs automatically.

---

## 4. Backend Deployment (Render or Railway)

### On Render:
1. Create a new **Web Service** pointing to your Git repository.
2. Select **Node** as the environment runtime.
3. Configure the following build & start properties:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add all environment variables listed in Section 1 to the Render Dashboard.

### On Railway:
1. Create a new project pointing to your repository.
2. Add a new service from the root repo, specifying the Root Directory as `backend`.
3. Railway automatically detects `package.json` scripts and runs `npm run start`.
4. Configure all environment variables in the variables tab.

---

## 5. Frontend Deployment (Vercel or Netlify)

### On Vercel:
1. Create a new project pointing to your Git repository.
2. Set the **Framework Preset** to `Vite`.
3. Leave the **Root Directory** as default (repository root).
4. Add `VITE_API_URL` in Vercel's Environment Variables panel.
5. In order to handle React Router client-side routing fallback redirects correctly in production, add a `vercel.json` configuration file in the repository root:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### On Netlify:
1. Create a new site from Git, mapping to the repository.
2. Leave the **Base Directory** as default (repository root).
3. Build Settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add `VITE_API_URL` environment variables.
5. In order to support client-side routing redirects, add a `_redirects` file to the public folder:
   ```text
   /*   /index.html   200
   ```
