#!/bin/bash

# AssetWorks Cleanup Script - Phase 1
# This script performs the initial cleanup of the codebase
# Run with: bash scripts/cleanup-start.sh

echo "🧹 AssetWorks Cleanup Script - Phase 1"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Backup current state
echo -e "${YELLOW}Step 1: Creating backup...${NC}"
git add .
git stash
git stash apply
echo -e "${GREEN}✓ Current state backed up in git stash${NC}"
echo ""

# Step 2: Remove unused dependencies
echo -e "${YELLOW}Step 2: Removing unused dependencies...${NC}"
npm uninstall mongoose mongodb puppeteer highlight.js bcryptjs multer simple-icons sharp || true
echo -e "${GREEN}✓ Unused dependencies removed${NC}"
echo ""

# Step 3: Remove demo pages
echo -e "${YELLOW}Step 3: Removing demo pages...${NC}"
rm -rf app/primereact-demo
rm -rf app/shadcn-demo
rm -rf app/auto-login
echo -e "${GREEN}✓ Demo pages removed${NC}"
echo ""

# Step 4: Remove duplicate test files
echo -e "${YELLOW}Step 4: Cleaning test files...${NC}"
rm -f test-*.js
rm -f test-*.ts
echo -e "${GREEN}✓ Test files cleaned${NC}"
echo ""

# Step 5: Create new directory structure
echo -e "${YELLOW}Step 5: Creating improved directory structure...${NC}"
mkdir -p src/components/features
mkdir -p src/components/ui
mkdir -p src/services/ai
mkdir -p src/services/data
mkdir -p src/services/auth
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/constants
mkdir -p src/utils
echo -e "${GREEN}✓ New directory structure created${NC}"
echo ""

# Step 6: Find and report issues
echo -e "${YELLOW}Step 6: Analyzing code issues...${NC}"
echo ""

# Count console.logs
CONSOLE_COUNT=$(grep -r "console.log" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . | wc -l)
echo -e "  📊 console.log statements: ${RED}${CONSOLE_COUNT}${NC}"

# Count any types
ANY_COUNT=$(grep -r ": any" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . | wc -l)
echo -e "  📊 'any' type usage: ${RED}${ANY_COUNT}${NC}"

# Find large files
echo -e "  📊 Large files (>500 lines):"
find . -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -10 | while read line; do
    COUNT=$(echo $line | awk '{print $1}')
    FILE=$(echo $line | awk '{print $2}')
    if [ "$COUNT" -gt "500" ] 2>/dev/null; then
        echo -e "     ${RED}$COUNT lines${NC} - $FILE"
    fi
done

echo ""

# Step 7: Generate TODO list
echo -e "${YELLOW}Step 7: Generating TODO list...${NC}"
cat > TODO_CLEANUP.md << 'EOF'
# AssetWorks Cleanup TODO List

## 🔴 Critical (Do First)
- [ ] Rotate API keys in .env.local
- [ ] Remove credentials from git history
- [ ] Fix TypeScript 'any' types
- [ ] Break down financial-playground-v2/page.tsx

## 🟡 Important (This Week)
- [ ] Consolidate duplicate API routes
- [ ] Merge reports and playground_reports tables
- [ ] Remove MongoDB dependencies
- [ ] Standardize on one UI library

## 🟢 Nice to Have (This Month)
- [ ] Add unit tests
- [ ] Setup error monitoring
- [ ] Add API documentation
- [ ] Implement code splitting

## 📝 Files to Refactor
1. app/financial-playground-v2/page.tsx (2187 lines)
2. Consolidate lib/ai/* files
3. Merge duplicate service files
4. Clean up API routes

## 🗑️ Directories to Remove
- [ ] app/financial-playground (keep v2 only)
- [ ] lib/db/models (MongoDB models)
- [ ] Multiple demo pages

## 📦 Dependencies to Replace
- mongoose → Use Prisma only
- bcryptjs → @node-rs/argon2
- Multiple chart libraries → recharts only

EOF
echo -e "${GREEN}✓ TODO list created in TODO_CLEANUP.md${NC}"
echo ""

# Step 8: Update package.json scripts
echo -e "${YELLOW}Step 8: Adding helpful npm scripts...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts['lint:fix'] = 'next lint --fix';
pkg.scripts['type-check'] = 'tsc --noEmit';
pkg.scripts['analyze'] = 'ANALYZE=true next build';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"
echo -e "${GREEN}✓ Package.json scripts updated${NC}"
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}✅ Cleanup Phase 1 Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review TODO_CLEANUP.md"
echo "  2. Run 'npm install' to update dependencies"
echo "  3. Fix TypeScript errors with 'npm run type-check'"
echo "  4. Start refactoring large components"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  - Rotate API keys immediately"
echo "  - Test the application after cleanup"
echo "  - Commit changes incrementally"
echo ""