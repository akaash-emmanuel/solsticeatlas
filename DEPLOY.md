# deploying to Netlify

## 1. Connect Repository
- Go to [Netlify](https://app.netlify.com/).
- Click **"Add new site"** > **"Import an existing project"**.
- Select **GitHub** and choose `solsticeatlas`.

## 2. Configuration (Auto-Detected)
Netlify should read `netlify.toml` and automatically fill these:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

## 3. ⚠️ IMPORTANT: Environment Variables
**Before deploying**, you must add your API Key in Netlify:
1.  Click **"Site settings"** > **"Environment variables"**.
2.  Click **"Add a variable"**.
3.  **Key**: `OPENAI_API_KEY`
4.  **Value**: `sk-proj-...` (Your actual key from `.env`).

**Why?**
Because `.env` is ignored by Git (for security), Netlify doesn't know your key. You must tell it securely via the dashboard.

## 4. Deploy
- Click **"Deploy site"**.
- Netlify will run `npm run build`, inject the key into the bundle, and publish.
