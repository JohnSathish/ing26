# GitHub Backup Setup Guide

## Step 1: Create a Repository on GitHub

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the repository details:
   - **Repository name**: `ing26` (or any name you prefer)
   - **Description**: "CMD ING Guwahati - Web Application"
   - **Visibility**: Choose Private (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 2: Connect Your Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these commands in your terminal:

### Option A: If you haven't committed yet (but you have, so skip to Option B)

```bash
cd E:\Projects\ing26
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Option B: If you already have commits (this applies to you)

```bash
cd E:\Projects\ing26
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your GitHub username and `YOUR_REPO_NAME` with your repository name.**

## Step 3: Authenticate

GitHub may prompt you to authenticate. You can use:

1. **Personal Access Token (Recommended)**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with `repo` scope
   - Use the token as your password when prompted

2. **GitHub CLI** (if installed):
   ```bash
   gh auth login
   ```

## Step 4: Verify the Push

1. Go to your repository on GitHub
2. You should see all your files there
3. Your code is now backed up on GitHub!

## Future Updates

To push future changes to GitHub:

```bash
cd E:\Projects\ing26
git add .
git commit -m "Your commit message describing the changes"
git push
```

## Important Notes

- The `.gitignore` file excludes sensitive files like:
  - Database credentials (`.env` files)
  - `node_modules/` (dependencies)
  - Build outputs
  - User-uploaded files

- **Never commit**:
  - Database passwords
  - API keys
  - `.env` files with sensitive data
  - User-uploaded content (already excluded)

## Troubleshooting

### If you get authentication errors:
- Use a Personal Access Token instead of password
- Make sure you have write access to the repository

### If you get "repository not found":
- Check that the repository name is correct
- Check that you have access to the repository
- Verify your GitHub username is correct

### If you want to change the remote URL:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

