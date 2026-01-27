# Development Workflow Guide for Claude Code

This document provides guidelines for Claude Code when working on the ShatterRealms project.

## Core Principles

1. **Everything is a Pull Request**: Never commit directly to `main`. Always create a feature branch and open a PR.
2. **Tests Must Pass**: All tests must pass locally before creating a PR. Run `npm test` to verify.
3. **Linters Must Pass**: Code must pass ESLint and Prettier checks. Run `npm run check` to verify everything.
4. **Clean Commits**: Write clear, descriptive commit messages following conventional commit format.

## Pre-PR Checklist

Before creating a pull request, **always** run these commands locally:

```bash
# 1. Run all tests
npm test

# 2. Run linter
npm run lint

# 3. Check code formatting
npm run format:check

# 4. Or run all checks at once
npm run check
```

If any of these fail, fix the issues before creating the PR.

## Workflow Steps

### 1. Start a New Feature

```bash
# Always start from main
git checkout main
git pull origin main

# Create a feature branch with descriptive name
git checkout -b feature/descriptive-name
# or
git checkout -b fix/bug-description
# or
git checkout -b refactor/what-is-being-refactored
```

### 2. Make Changes

- Write code following project conventions
- Add tests for new functionality
- Update documentation if needed
- Keep changes focused on a single feature/fix

### 3. Test Locally

```bash
# Run tests
npm test

# Run linters
npm run lint

# Format code
npm run format

# Run all checks
npm run check
```

Fix any issues before proceeding.

### 4. Commit Changes

```bash
# Stage specific files (avoid git add -A)
git add path/to/file1 path/to/file2

# Write descriptive commit message
git commit -m "Add user authentication with JWT

- Implement login endpoint in api/auth.js
- Add password hashing with bcrypt
- Create auth middleware for protected routes
- Add tests for auth flow

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### 5. Push and Create PR

```bash
# Push to remote
git push -u origin feature/descriptive-name

# Create PR using GitHub CLI
gh pr create --title "Add user authentication" --body "$(cat <<'EOF'
## Summary
Implements user authentication using JWT tokens.

## Changes
- New `/api/auth/login` and `/api/auth/register` endpoints
- Password hashing with bcrypt
- JWT token generation and validation
- Auth middleware for protected routes

## Test Plan
- [x] Unit tests for auth endpoints
- [x] Integration tests for auth flow
- [x] Manual testing of login/logout
- [x] Linters pass
- [x] All tests pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Code Quality Standards

### ESLint Rules

- No unused variables (prefix with `_` if intentionally unused)
- Use single quotes for strings
- Always use semicolons
- No trailing spaces

### Prettier Formatting

- 2 spaces for indentation
- Single quotes
- Semicolons required
- 100 character line width
- Trailing commas in ES5

### Testing Standards

- Write tests for all new API endpoints
- Test both success and error cases
- Use descriptive test names
- Aim for >80% code coverage

## File Organization

### Where to Put New Files

**API Endpoints**: `api/endpoint-name.js`

- Use ES6 modules (import/export)
- Include CORS headers
- Handle all HTTP methods properly
- Return proper error codes

**Tests**: `api/__tests__/endpoint-name.test.js`

- One test file per API file
- Group related tests in `describe` blocks
- Use clear test names

**Documentation**: `docs/`

- API documentation in `docs/API.md`
- Architecture docs in `docs/ARCHITECTURE.md`

**Frontend Code**: `public/`

- Modularize JavaScript into `public/js/`
- Keep `index.html` focused on structure

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run party:dev        # Start PartyKit multiplayer server

# Testing
npm test                 # Run all tests
npm run test:ci          # Run tests with coverage

# Code Quality
npm run lint             # Check for linting errors
npm run format           # Format code with Prettier
npm run format:check     # Check if code is formatted
npm run check            # Run lint + format check + tests

# Deployment
npm run party:deploy     # Deploy PartyKit to production
# Vercel deploys automatically on push to main
```

## Branch Protection (For Repository Owners)

To enforce these rules automatically, configure GitHub branch protection:

1. Go to **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Status checks that are required:
     - `Tests and Linters`
     - `All Checks Passed`
   - ✅ Do not allow bypassing the above settings

## Collaborative Development

### Working with Multiple Developers

1. **Pull latest changes frequently**:

   ```bash
   git checkout main
   git pull origin main
   git checkout your-feature-branch
   git rebase main  # Keep your branch up to date
   ```

2. **Avoid merge conflicts**:
   - Keep PRs small and focused
   - Communicate about which files you're working on
   - Merge PRs quickly after approval

3. **Code review etiquette**:
   - Review PRs promptly
   - Provide constructive feedback
   - Approve when tests pass and code looks good

## Troubleshooting

### Tests Fail Locally

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

### Linter Errors

```bash
# Auto-fix what can be fixed
npm run format
npm run lint

# Check remaining issues
npm run check
```

### PR Checks Failing on GitHub

1. Pull latest main: `git pull origin main`
2. Rebase your branch: `git rebase main`
3. Run checks locally: `npm run check`
4. Push again: `git push --force-with-lease`

## Git Commit Message Format

Use conventional commit format:

```
<type>: <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation changes
- `chore`: Maintenance tasks
- `style`: Code formatting (not CSS)

**Example**:

```
feat: Add weapon generation API endpoint

- Create /api/generate-weapon endpoint
- Integrate with Anthropic Claude API
- Add weapon rarity system
- Include price calculation based on stats

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Don'ts

❌ Don't commit directly to `main`
❌ Don't push code that doesn't pass tests
❌ Don't push code that doesn't pass linters
❌ Don't create PRs without testing locally first
❌ Don't commit sensitive data (.env files, API keys)
❌ Don't use `git add -A` without reviewing what's staged
❌ Don't force push to `main` (ever)
❌ Don't merge your own PRs without review (if team size > 1)

## Do's

✅ Create feature branches for all changes
✅ Run `npm run check` before every PR
✅ Write descriptive commit messages
✅ Add tests for new features
✅ Update documentation when needed
✅ Ask for code review
✅ Keep PRs focused and small
✅ Respond to review feedback promptly

---

**Remember**: The goal is to maintain high code quality while moving fast. These workflows exist to help the team collaborate effectively and catch issues before they reach production.

When in doubt, ask! Better to clarify than to make assumptions.
