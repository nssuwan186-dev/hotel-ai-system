# GitHub Actions Workflows

## 📋 Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)
- **Triggers**: Push to main/develop, Pull requests
- **Jobs**:
  - 🔍 Code Quality (Lint + TypeScript)
  - 🧪 Testing (Unit + Integration)
  - 🏗️ Build Application
  - 🔒 Security Scan (npm audit)
  - 🎯 Deploy to Production (main branch only)

### 2. n8n Workflows Testing (`n8n-test.yml`)
- **Triggers**: Changes to n8n/workflows/
- **Jobs**:
  - 🔍 Validate JSON syntax
  - ✅ Check workflow structure

### 3. Test Workflow (`test-workflow.yml`)
- **Triggers**: Manual (workflow_dispatch)
- **Purpose**: Verify GitHub Actions setup

## 🔐 Required Secrets

Add these secrets to your GitHub repository:

### Required:
- `OPENAI_API_KEY` - OpenAI API key
- `GEMINI_API_KEY` - Google Gemini API key
- `DATABASE_URL` - Database connection string

### How to add secrets:
1. Go to repository Settings
2. Click "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add name and value

## 🚀 Usage

### Manual Test:
1. Go to Actions tab
2. Select "Test Workflow Setup"
3. Click "Run workflow"
4. Wait for completion

### Automatic:
- Push to main/develop triggers full CI/CD
- Pull requests trigger lint + test
- Changes to n8n/workflows/ trigger validation

## 📊 Status Badges

Add to README.md:
```markdown
![CI/CD](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci-cd.yml/badge.svg)
```
