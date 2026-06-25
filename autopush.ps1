# ============================
# Auto Push Script for GitHub
# ============================

$repoPath = "C:\Users\Acer\webdevlopement\Animes\Tracker\Anime\AniPulse"
Set-Location $repoPath

# Switch to main
git checkout main

# Stage all changes
git add .

# Commit with timestamp
$time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Anipulse Version 3 ( Part 1 ) - Official Release"

# Push to GitHub
git push origin main

Write-Host "✅ Auto-push completed at $time"