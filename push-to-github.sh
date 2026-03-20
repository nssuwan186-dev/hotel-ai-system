#!/bin/bash

echo "╔══════════════════════════════════════════════╗"
echo "║     🚀 Push to GitHub                        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Check if remote exists
if git remote | grep -q origin; then
    echo "✅ Remote 'origin' already configured"
    git remote -v
else
    echo "⚠️  No remote configured!"
    echo ""
    read -p "Enter GitHub repository URL: " repo_url
    
    if [ -n "$repo_url" ]; then
        git remote add origin "$repo_url"
        echo "✅ Remote added!"
        git remote -v
    else
        echo "❌ No URL provided!"
        exit 1
    fi
fi

echo ""
echo "📋 Current Branch:"
git branch

echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║     ✅  Pushed to GitHub Successfully!       ║"
    echo "╚══════════════════════════════════════════════╝"
else
    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║     ❌  Push Failed!                          ║"
    echo "╚══════════════════════════════════════════════╝"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if repository exists on GitHub"
    echo "2. Check your credentials:"
    echo "   git config --global user.name"
    echo "   git config --global user.email"
    echo "3. Try:"
    echo "   git push --force"
fi
