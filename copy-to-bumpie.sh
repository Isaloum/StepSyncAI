#!/bin/bash

# Drug Interaction Module Copy Script
# Copies all required files from MindTrackAI to Bumpie_Meds

# Configuration
BUMPIE_PATH="${1}"

if [ -z "$BUMPIE_PATH" ]; then
  echo "❌ Error: Please provide the path to Bumpie_Meds repository"
  echo ""
  echo "Usage: ./copy-to-bumpie.sh /path/to/Bumpie_Meds"
  echo ""
  echo "Example:"
  echo "  ./copy-to-bumpie.sh ~/Bumpie_Meds"
  echo "  ./copy-to-bumpie.sh ../Bumpie_Meds"
  exit 1
fi

if [ ! -d "$BUMPIE_PATH" ]; then
  echo "❌ Error: Directory not found: $BUMPIE_PATH"
  echo ""
  echo "Please make sure the Bumpie_Meds repository exists at that location."
  echo "You may need to clone it first:"
  echo "  git clone https://github.com/Isaloum/Bumpie_Meds.git"
  exit 1
fi

echo "📦 Copying drug interaction module to Bumpie_Meds..."
echo ""
echo "Source: /home/user/MindTrackAI"
echo "Destination: $BUMPIE_PATH"
echo ""

# Create directories if needed
mkdir -p "$BUMPIE_PATH/src/services" && echo "✅ Created src/services/" || echo "ℹ️  src/services/ already exists"
mkdir -p "$BUMPIE_PATH/docs" && echo "✅ Created docs/" || echo "ℹ️  docs/ already exists"
mkdir -p "$BUMPIE_PATH/examples" && echo "✅ Created examples/" || echo "ℹ️  examples/ already exists"

echo ""
echo "📄 Copying files..."

# Copy files
if cp drug-interaction-checker.js "$BUMPIE_PATH/src/services/"; then
  echo "✅ Copied drug-interaction-checker.js → src/services/"
else
  echo "❌ Failed to copy drug-interaction-checker.js"
  exit 1
fi

if cp drug-interactions-database.json "$BUMPIE_PATH/src/services/"; then
  echo "✅ Copied drug-interactions-database.json → src/services/"
else
  echo "❌ Failed to copy drug-interactions-database.json"
  exit 1
fi

if cp DRUG_INTERACTION_MODULE.md "$BUMPIE_PATH/docs/"; then
  echo "✅ Copied DRUG_INTERACTION_MODULE.md → docs/"
else
  echo "❌ Failed to copy DRUG_INTERACTION_MODULE.md"
  exit 1
fi

if cp example-integration.js "$BUMPIE_PATH/examples/drug-interaction-examples.js"; then
  echo "✅ Copied example-integration.js → examples/drug-interaction-examples.js"
else
  echo "❌ Failed to copy example-integration.js"
  exit 1
fi

if cp INTEGRATION_GUIDE_BUMPIE_MEDS.md "$BUMPIE_PATH/docs/"; then
  echo "✅ Copied INTEGRATION_GUIDE_BUMPIE_MEDS.md → docs/"
else
  echo "❌ Failed to copy INTEGRATION_GUIDE_BUMPIE_MEDS.md"
  exit 1
fi

echo ""
echo "🎉 All files copied successfully!"
echo ""
echo "📊 Files copied:"
echo "  • drug-interaction-checker.js (7.2 KB)"
echo "  • drug-interactions-database.json (18 KB)"
echo "  • DRUG_INTERACTION_MODULE.md (9.4 KB)"
echo "  • example-integration.js (7.1 KB)"
echo "  • INTEGRATION_GUIDE_BUMPIE_MEDS.md (9.8 KB)"
echo ""
echo "📖 Next steps:"
echo "1. cd $BUMPIE_PATH"
echo "2. Read docs/INTEGRATION_GUIDE_BUMPIE_MEDS.md"
echo "3. Follow integration steps 3-7"
echo "4. Test with: npm test"
echo "5. Create a PR in Bumpie_Meds"
echo ""
echo "✨ Ready to integrate!"
