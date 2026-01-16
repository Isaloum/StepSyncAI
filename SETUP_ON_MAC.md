# 🍎 Setup Instructions for Mac

## Current Status
All drug interaction module files are ready in the MindTrackAI repository (on the server).
You need to copy them to your local Mac and then to Bumpie_Meds.

## Step-by-Step Setup

### Step 1: Clone/Update MindTrackAI on Your Mac

```bash
# Open Terminal on your Mac and navigate to where you keep your projects
cd ~/Documents  # or wherever you keep git repos

# Clone MindTrackAI if you don't have it
git clone https://github.com/Isaloum/MindTrackAI.git

# Or if you already have it, update it
cd MindTrackAI
git fetch origin
git checkout claude/fix-medication-warnings-I6Jxp
git pull origin claude/fix-medication-warnings-I6Jxp
```

### Step 2: Verify Files Exist

```bash
# You should be in MindTrackAI directory
cd ~/Documents/MindTrackAI  # adjust path as needed

# List the required files
ls -lh drug-interaction-checker.js \
       drug-interactions-database.json \
       DRUG_INTERACTION_MODULE.md \
       example-integration.js \
       INTEGRATION_GUIDE_BUMPIE_MEDS.md \
       copy-to-bumpie.sh
```

You should see all 6 files listed.

### Step 3: Clone Bumpie_Meds

```bash
# Go to your projects directory
cd ~/Documents  # or wherever you keep git repos

# Clone Bumpie_Meds
git clone https://github.com/Isaloum/Bumpie_Meds.git

# Navigate into it
cd Bumpie_Meds
```

### Step 4: Run the Copy Script

```bash
# From Bumpie_Meds directory, run:
cd ~/Documents/MindTrackAI
./copy-to-bumpie.sh ~/Documents/Bumpie_Meds
```

Or adjust the path based on where you cloned Bumpie_Meds:
```bash
./copy-to-bumpie.sh ../Bumpie_Meds
```

### Step 5: Verify Files Were Copied

```bash
cd ~/Documents/Bumpie_Meds

# Check the files are in place
ls -la src/services/drug-interaction-checker.js
ls -la src/services/drug-interactions-database.json
ls -la docs/DRUG_INTERACTION_MODULE.md
ls -la examples/drug-interaction-examples.js
ls -la docs/INTEGRATION_GUIDE_BUMPIE_MEDS.md
```

All files should show up!

### Step 6: Follow Integration Guide

```bash
# Read the integration guide
cd ~/Documents/Bumpie_Meds
cat docs/INTEGRATION_GUIDE_BUMPIE_MEDS.md

# Or open in your editor
code docs/INTEGRATION_GUIDE_BUMPIE_MEDS.md  # VS Code
open docs/INTEGRATION_GUIDE_BUMPIE_MEDS.md  # Default app
```

## 🚨 Quick Troubleshooting

### "Permission denied" when running copy-to-bumpie.sh
```bash
chmod +x copy-to-bumpie.sh
./copy-to-bumpie.sh ~/Documents/Bumpie_Meds
```

### "No such file or directory" errors
Make sure you're using absolute paths or correct relative paths:
```bash
# Find your current location
pwd

# List what's available
ls -la

# Use full paths
./copy-to-bumpie.sh /Users/ihabsaloum/Documents/Bumpie_Meds
```

### Files not showing after git checkout
Make sure you pulled the latest changes:
```bash
cd ~/Documents/MindTrackAI
git checkout claude/fix-medication-warnings-I6Jxp
git pull origin claude/fix-medication-warnings-I6Jxp
ls -la drug-interaction-checker.js  # Should exist now
```

## 📋 What You're Setting Up

After these steps, your Bumpie_Meds will have:

```
Bumpie_Meds/
├── src/
│   └── services/
│       ├── drug-interaction-checker.js       ← Main module (7.2 KB)
│       └── drug-interactions-database.json   ← 458 interactions (18 KB)
├── docs/
│   ├── DRUG_INTERACTION_MODULE.md            ← API docs (9.4 KB)
│   └── INTEGRATION_GUIDE_BUMPIE_MEDS.md      ← Integration guide (9.8 KB)
└── examples/
    └── drug-interaction-examples.js          ← 6 examples (7.1 KB)
```

## ✅ Next Steps After Copying

1. **Read the integration guide:**
   ```bash
   cd ~/Documents/Bumpie_Meds
   open docs/INTEGRATION_GUIDE_BUMPIE_MEDS.md
   ```

2. **Integrate with PregnancySafetyEngine** (follow guide steps 3-7)

3. **Create tests**

4. **Commit and push to Bumpie_Meds:**
   ```bash
   git checkout -b feature/drug-interaction-module
   git add src/services/ docs/ examples/
   git commit -m "Add drug interaction checking module with pregnancy warnings"
   git push -u origin feature/drug-interaction-module
   ```

5. **Create PR in Bumpie_Meds repository**

## 🎯 Summary

**On your Mac terminal:**
```bash
# 1. Get MindTrackAI with the files
cd ~/Documents
git clone https://github.com/Isaloum/MindTrackAI.git  # or git pull if exists
cd MindTrackAI
git checkout claude/fix-medication-warnings-I6Jxp

# 2. Get Bumpie_Meds
cd ~/Documents
git clone https://github.com/Isaloum/Bumpie_Meds.git

# 3. Copy files
cd ~/Documents/MindTrackAI
./copy-to-bumpie.sh ~/Documents/Bumpie_Meds

# 4. Follow integration guide
cd ~/Documents/Bumpie_Meds
open docs/INTEGRATION_GUIDE_BUMPIE_MEDS.md
```

That's it! 🚀
