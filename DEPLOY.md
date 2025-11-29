# Deploying ShiftStats to GitHub Pages

Follow these simple steps to deploy your ShiftStats app to GitHub Pages:

## Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **+** icon in the top right corner
3. Select **New repository**
4. Name it `ShiftStats` (or any name you prefer)
5. Make it **Public** (required for free GitHub Pages)
6. **Don't** initialize with README, .gitignore, or license (we already have files)
7. Click **Create repository**

## Step 2: Upload Your Files

### Option A: Using GitHub Web Interface

1. In your new repository, click **uploading an existing file**
2. Drag and drop these files into the upload area:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md` (optional)
3. Scroll down and click **Commit changes**

### Option B: Using Git Command Line

If you have Git installed on your computer:

```bash
# Navigate to your ShiftStats folder
cd C:\Coding\ShiftStats

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit the files
git commit -m "Initial commit - ShiftStats app"

# Add your GitHub repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ShiftStats.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** (top menu)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select:
   - **Branch**: `main` (or `master` if that's your branch name)
   - **Folder**: `/ (root)`
5. Click **Save**

## Step 4: Access Your Site

GitHub will provide you with a URL. It will be:
```
https://YOUR_USERNAME.github.io/ShiftStats/
```

**Note**: It may take a few minutes for your site to be available after enabling Pages.

## Updating Your Site

Whenever you make changes to your files:

### Using Web Interface:
1. Edit files directly on GitHub
2. Commit changes
3. Changes will be live in a few minutes

### Using Git:
```bash
git add .
git commit -m "Your update message"
git push
```

## Troubleshooting

- **Site not loading?** Wait 5-10 minutes after first deployment
- **Changes not showing?** Clear your browser cache or wait a few minutes
- **404 Error?** Make sure `index.html` is in the root folder of your repository

## Custom Domain (Optional)

If you want to use a custom domain:
1. In Pages settings, add your custom domain
2. Follow GitHub's instructions for DNS configuration

---

Your ShiftStats app is now live on the web! 🎉

