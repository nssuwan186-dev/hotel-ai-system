#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║       PROJECT STRUCTURE AUDIT          ║"
echo "╚════════════════════════════════════════╝"
echo ""

PASS=0
FAIL=0

# 1. Check directories
echo "📁 Checking directories..."
DIRS=("src" "src/api" "src/api/routes" "src/api/middleware" "src/core" "src/database" "src/database/repositories" "src/services" "src/cli" "src/cli/commands" "src/scripts" "src/web" "src/web/components" "src/web/styles" "src/tools" "data" "data/db" "data/brain" "node_modules")

for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "  ✅ $dir"
    ((PASS++))
  else
    echo "  ❌ MISSING: $dir"
    ((FAIL++))
  fi
done

echo ""

# 2. Check critical files
echo "📄 Checking critical files..."
FILES=("src/index.ts" "src/api/app.ts" "src/database/database.ts" "src/core/ai-provider.ts" "package.json" ".env" "tsconfig.json" ".gitignore" "README.md")

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
    ((PASS++))
  else
    echo "  ❌ MISSING: $file"
    ((FAIL++))
  fi
done

echo ""

# 3. Check database
echo "💾 Checking database..."
if [ -f "data/db/hotel.sqlite" ]; then
  echo "  ✅ Database exists"
  TABLES=$(sqlite3 data/db/hotel.sqlite "SELECT count(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
  echo "     Tables: $TABLES"
  ((PASS++))
else
  echo "  ❌ Database missing"
  ((FAIL++))
fi

echo ""

# 4. Check dependencies
echo "📦 Checking dependencies..."
if [ -f "package.json" ]; then
  echo "  ✅ package.json exists"
  ((PASS++))
  
  if grep -q '"express"' package.json; then
    echo "  ✅ Express installed"
    ((PASS++))
  else
    echo "  ❌ Express missing"
    ((FAIL++))
  fi
  
  if grep -q '"sqlite3"' package.json; then
    echo "  ✅ SQLite3 installed"
    ((PASS++))
  else
    echo "  ❌ SQLite3 missing"
    ((FAIL++))
  fi
  
  if grep -q '"typescript"' package.json; then
    echo "  ✅ TypeScript installed"
    ((PASS++))
  else
    echo "  ❌ TypeScript missing"
    ((FAIL++))
  fi
else
  echo "  ❌ package.json missing"
  ((FAIL++))
fi

echo ""

# 5. Count files
echo "📊 File count..."
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
echo "  TypeScript files: $TS_FILES"

if [ $TS_FILES -gt 50 ]; then
  echo "  ✅ Good file count"
  ((PASS++))
else
  echo "  ⚠️  Low file count"
  ((FAIL++))
fi

echo ""

# 6. Check for build errors
echo "🔍 Checking for syntax errors..."
if command -v npx &> /dev/null; then
  echo "  Running TypeScript check..."
  if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo "  ❌ TypeScript errors found"
    ((FAIL++))
  else
    echo "  ✅ No TypeScript errors"
    ((PASS++))
  fi
else
  echo "  ⚠️  Cannot check (npx not available)"
fi

echo ""
echo "════════════════════════════════════════"
echo "         AUDIT SUMMARY"
echo "════════════════════════════════════════"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  📊 Total:  $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "  🎉 All checks passed!"
  echo "  ✅ Project structure is complete!"
else
  echo "  ⚠️  $FAIL issues found"
  echo "  💡 Run ./fix-project.sh to auto-fix"
fi

echo "════════════════════════════════════════"
