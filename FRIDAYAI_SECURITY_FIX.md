# 🔒 FridayAI Security Recovery Plan

## 🚨 CRITICAL SITUATION

Your FridayAI repository has exposed credentials that are PUBLIC on GitHub:
- 3 AWS/SSH private keys (.pem files)
- 3 encryption keys (.key files)
- 1 GitHub token
- Database and log files

**Impact:** Anyone can access your AWS account, GitHub account, and encrypted data.

---

## ⚡ IMMEDIATE ACTIONS (Do in order - 30 minutes)

### Step 1: Make Repository Private (2 minutes) ⚠️ DO FIRST

**Action:**
1. Go to: https://github.com/Isaloum/FridayAI/settings
2. Scroll to bottom → "Danger Zone"
3. Click "Change visibility" → Select "Private"
4. Type repository name to confirm
5. Click "I understand, change repository visibility"

**Why:** Stops NEW people from accessing your credentials while you fix the rest.

**Note:** People who already cloned/forked still have the credentials. You MUST rotate them (Step 2).

---

### Step 2: Rotate ALL Exposed Credentials (10 minutes) ⚠️ CRITICAL

These credentials are compromised. You MUST replace them:

#### A. AWS Keys (if using EC2/AWS)
1. Go to AWS Console: https://console.aws.amazon.com
2. Navigate to EC2 → Key Pairs
3. **Delete** old key pairs:
   - `FridayAI-New`
   - `FridayAIKey`
   - `fridayai-backend`
4. **Create NEW** key pair
5. Download new .pem file (save locally, NOT in git)
6. Update any EC2 instances using new key

#### B. GitHub Token
1. Go to: https://github.com/settings/tokens
2. Find token created in 2025
3. Click "Delete" or "Revoke"
4. Create NEW token with minimal permissions needed
5. Save to password manager (NOT git)

#### C. Encryption Keys
1. Generate new encryption keys locally:
   ```bash
   # Generate new encryption keys
   openssl rand -base64 32 > new_memory.key
   openssl rand -base64 32 > new_test_query.key
   openssl rand -base64 32 > new_vault.key
   ```
2. Re-encrypt any data using new keys
3. Save keys in password manager (NOT git)

**Why:** Anyone who downloaded the repository has your old credentials. They're permanently compromised.

---

### Step 3: Remove Secrets from Git History (10 minutes)

**Option A: Quick Nuclear Option (Recommended if no important history)**

```bash
# Clone your repo
cd ~/
git clone https://github.com/Isaloum/FridayAI.git
cd FridayAI

# Delete ALL git history and start fresh
rm -rf .git
git init
git add .
git commit -m "Initial commit - cleaned security issues"

# Force push new history
git remote add origin https://github.com/Isaloum/FridayAI.git
git push -u origin main --force
```

**Warning:** This deletes ALL commit history. Good for security, bad if you need history.

---

**Option B: Surgical Removal (Preserves history)**

```bash
# Install BFG Repo-Cleaner (faster than git filter-branch)
cd ~/
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Clone a mirror of your repo
git clone --mirror https://github.com/Isaloum/FridayAI.git

# Remove sensitive files from ALL commits
java -jar bfg-1.14.0.jar --delete-files "*.pem" FridayAI.git
java -jar bfg-1.14.0.jar --delete-files "*.key" FridayAI.git
java -jar bfg-1.14.0.jar --delete-files "*token*.txt" FridayAI.git
java -jar bfg-1.14.0.jar --delete-files "*.db" FridayAI.git
java -jar bfg-1.14.0.jar --delete-files "*.log" FridayAI.git

# Clean up
cd FridayAI.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push cleaned history
git push --force
```

**Why:** Removes files from git history so they can't be recovered.

---

### Step 4: Set Up Proper .gitignore (5 minutes)

Create `.gitignore` in FridayAI root:

```bash
# Secrets & Credentials
*.pem
*.key
*.p12
*.pfx
*token*
*secret*
*credential*
.env
.env.*

# AWS
.aws/
credentials
config

# Databases
*.db
*.sqlite
*.sqlite3

# Logs
*.log
logs/
*.log.*

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environments
venv/
ENV/
env/
.venv

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
*.bak
*.backup
```

**Add and commit:**

```bash
git add .gitignore
git commit -m "security: add comprehensive .gitignore"
git push
```

---

### Step 5: Clean Up Repository Files (5 minutes)

**Remove sensitive files from working directory:**

```bash
cd ~/FridayAI

# Remove credentials
rm -f *.pem
rm -f *.key
rm -f *token*.txt
rm -f *.db
rm -f *.log

# Move duplicates to archive
mkdir -p archive/experimental
mv "FridayAI (1).py" archive/experimental/
mv "FridayAI_Legendary.py" archive/experimental/
mv "FridayAI_Unstoppable.py" archive/experimental/

# Commit cleanup
git add -A
git commit -m "cleanup: remove sensitive files and organize structure"
git push
```

---

## 🛡️ FUTURE PROTECTION

### A. Branch Protection Rules

1. Go to: https://github.com/Isaloum/FridayAI/settings/branches
2. Click "Add rule"
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass
   - ✅ Include administrators
5. Click "Create"

**Why:** Prevents accidental force pushes and requires reviews.

---

### B. Secret Scanning (Free on GitHub)

1. Go to: https://github.com/Isaloum/FridayAI/settings/security_analysis
2. Enable:
   - ✅ Secret scanning
   - ✅ Push protection
3. GitHub will alert you if secrets are committed

**Why:** Automatic detection of exposed credentials.

---

### C. Pre-commit Hooks (Local Protection)

Install git-secrets to prevent commits with credentials:

```bash
# Install git-secrets
brew install git-secrets  # macOS
# OR
sudo apt-get install git-secrets  # Linux

# Set up in your repo
cd ~/FridayAI
git secrets --install
git secrets --register-aws
git secrets --add '*.pem'
git secrets --add '*.key'
git secrets --add '*token*'
```

**Why:** Blocks commits containing credentials before they reach GitHub.

---

### D. Use Environment Variables

**Instead of committing credentials, use environment variables:**

```python
# BAD - Don't do this
API_KEY = "sk-1234567890abcdef"

# GOOD - Do this
import os
API_KEY = os.getenv("FRIDAY_API_KEY")
```

**Set environment variables:**

```bash
# In ~/.bashrc or ~/.zshrc
export FRIDAY_API_KEY="your-key-here"
export AWS_ACCESS_KEY_ID="your-key-here"
export AWS_SECRET_ACCESS_KEY="your-secret-here"
```

**Or use .env file (locally only, never commit):**

```bash
# .env (add to .gitignore)
FRIDAY_API_KEY=your-key-here
AWS_ACCESS_KEY_ID=your-key-here
AWS_SECRET_ACCESS_KEY=your-secret-here
```

```python
# In your code
from dotenv import load_dotenv
import os

load_dotenv()  # Loads .env file
api_key = os.getenv("FRIDAY_API_KEY")
```

---

### E. Use AWS Secrets Manager (Professional Approach)

**For production apps:**

```python
import boto3
import json

def get_secret():
    client = boto3.client('secretsmanager', region_name='us-east-1')
    secret = client.get_secret_value(SecretId='friday-ai-secrets')
    return json.loads(secret['SecretString'])

secrets = get_secret()
api_key = secrets['api_key']
```

**Why:** Credentials never touch your code or git repository.

---

## ✅ CHECKLIST

**Emergency Actions (Do Today):**
- [ ] Make FridayAI repository private
- [ ] Rotate AWS key pairs (delete old, create new)
- [ ] Revoke GitHub token
- [ ] Generate new encryption keys
- [ ] Remove secrets from git history (Option A or B)
- [ ] Add .gitignore
- [ ] Clean up working directory

**Protection Setup (This Week):**
- [ ] Enable branch protection rules
- [ ] Enable GitHub secret scanning
- [ ] Install git-secrets locally
- [ ] Move credentials to environment variables
- [ ] Add README to FridayAI

**Optional (Advanced):**
- [ ] Set up AWS Secrets Manager
- [ ] Add pre-commit hooks
- [ ] Enable 2FA on GitHub
- [ ] Audit AWS CloudTrail logs for unauthorized access

---

## 🚨 DAMAGE ASSESSMENT

**What to check after rotating credentials:**

1. **AWS CloudTrail Logs:**
   - Check for unauthorized EC2 launches
   - Check for unusual API calls
   - Look for data exfiltration

2. **GitHub Audit Log:**
   - Check for unauthorized access
   - Look for unexpected clones/forks

3. **Monitor for:**
   - Unexpected AWS charges
   - Unauthorized commits to your repos
   - Spam/phishing from your accounts

---

## 📞 IF YOU'VE BEEN COMPROMISED

**Signs of compromise:**
- Unexpected AWS charges
- EC2 instances you didn't create
- GitHub repos you didn't create
- Emails from GitHub/AWS about suspicious activity

**Actions:**
1. **Immediately:** Change ALL GitHub/AWS passwords
2. **Enable 2FA** on both accounts
3. **Contact AWS Support:** https://console.aws.amazon.com/support
4. **Contact GitHub Support:** https://support.github.com
5. **Review all access:** Revoke all tokens, keys, and sessions

---

## ⏱️ TIME ESTIMATE

**Emergency fix:** 30 minutes
**Full protection setup:** 1-2 hours
**Worth it?** Absolutely - prevents identity theft, AWS bill disasters, and data breaches

---

## 💡 LESSONS LEARNED

**Never commit to git:**
- ❌ Private keys (.pem, .key, .p12)
- ❌ API tokens/secrets
- ❌ Passwords
- ❌ Database credentials
- ❌ .env files
- ❌ Logs with sensitive data
- ❌ Databases with personal info

**Always use:**
- ✅ Environment variables
- ✅ .gitignore
- ✅ Secret managers (AWS Secrets Manager, 1Password, etc.)
- ✅ Branch protection
- ✅ Secret scanning

---

## 🎯 AFTER SECURITY IS FIXED

**When FridayAI is secure:**
1. Add professional README
2. Clean up duplicate files
3. Organize directory structure
4. Add documentation
5. Make public again (if you want)

**For now:** Keep it private until fully cleaned and secured.

---

## ❓ NEED HELP?

**I can help you:**
1. Write scripts to automate cleanup
2. Review .gitignore completeness
3. Set up proper secrets management
4. Create AWS IAM roles with minimal permissions
5. Audit what was exposed

**Next steps:**
1. Start with Step 1 (make repo private)
2. Work through Steps 2-5 in order
3. Let me know if you get stuck on any step

Your FridayAI project has potential - let's secure it properly! 🔒
