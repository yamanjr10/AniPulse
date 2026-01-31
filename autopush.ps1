# ============================
# Auto Push Script for GitHub
# ============================

# Go to your repo folder (change this path!)
$repoPath = "C:\Users\Acer\webdevlopement\Animes\Anime-Tracker\AniPulse"
Set-Location $repoPath

# Optional: Show current branch
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $branch"

# Stage all changes
git add .

# Commit with timestamp
$time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Anipulse Version 2.0.0"

# Force push to remote
git push -u origin $branch --force

Write-Host "✅ Auto-push completed at $time"

