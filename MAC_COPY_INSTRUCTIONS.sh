#!/bin/bash

# Simple Mac Copy Script for Bumpie_Meds Integration
# Run this from your Mac Terminal

echo "🎯 Drug Interaction Module - Quick Copy Script"
echo ""
echo "This will copy files FROM MindTrackAI TO Bumpie_Meds"
echo ""

# Instructions
cat << 'INSTRUCTIONS'
📋 COPY THESE COMMANDS TO YOUR MAC TERMINAL:

# 1. Find where your repos are
cd ~
find . -name "Bumpie_Meds" -type d -maxdepth 3 2>/dev/null | head -5
find . -name "MindTrackAI" -type d -maxdepth 3 2>/dev/null | head -5

# 2. Once you find them, navigate to MindTrackAI
# Replace the path below with your actual path
cd /Users/ihabsaloum/YOUR_ACTUAL_PATH/MindTrackAI

# 3. Verify you have the files
ls -lh drug-interaction-checker.js

# 4. Copy files (adjust Bumpie_Meds path as needed)
cp drug-interaction-checker.js /Users/ihabsaloum/YOUR_BUMPIE_PATH/Bumpie_Meds/src/services/
cp drug-interactions-database.json /Users/ihabsaloum/YOUR_BUMPIE_PATH/Bumpie_Meds/src/services/
cp DRUG_INTERACTION_MODULE.md /Users/ihabsaloum/YOUR_BUMPIE_PATH/Bumpie_Meds/docs/
cp example-integration.js /Users/ihabsaloum/YOUR_BUMPIE_PATH/Bumpie_Meds/examples/drug-interaction-examples.js
cp INTEGRATION_GUIDE_BUMPIE_MEDS.md /Users/ihabsaloum/YOUR_BUMPIE_PATH/Bumpie_Meds/docs/

# 5. Verify files were copied
cd /Users/ihabsaloum/YOUR_BUMPIE_PATH/Bumpie_Meds
ls -lh src/services/drug-interaction-checker.js
ls -lh docs/INTEGRATION_GUIDE_BUMPIE_MEDS.md

# 6. Commit to Bumpie_Meds
git status
git add src/services/drug-interaction-checker.js
git add src/services/drug-interactions-database.json
git add docs/DRUG_INTERACTION_MODULE.md
git add examples/drug-interaction-examples.js
git add docs/INTEGRATION_GUIDE_BUMPIE_MEDS.md
git commit -m "Add comprehensive drug interaction module with 458-interaction database"
git push

INSTRUCTIONS

echo ""
echo "✅ Follow the commands above, replacing YOUR_ACTUAL_PATH with your real paths"
