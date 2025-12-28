# Ionic Appflow iOS Build Setup

This document describes the required Appflow configuration for building the iOS app.

## Build Stack

**Required:** `macOS - 2025.11 - Apple silicon` (or newer)

The 2025.06 stack only includes Node.js v20, but Capacitor 8 requires Node.js >=22.

## Environment Variables

Create an environment in Appflow with:

| Key | Value |
|-----|-------|
| `OVERRIDE_NODE_VERSION` | `22` |

Make sure to **select this environment** when triggering builds.

## Prerequisites

Before running an Appflow build, you must generate and commit the iOS platform locally:

```bash
# On a Mac with Xcode installed
npm ci
npm run build
npx cap add ios
npx cap sync ios

# Commit the iOS folder
git add ios
git commit -m "Add iOS platform"
git push
```

## Build Verification

After a successful build, verify in the Build Summary:
- Node.js version should show `v22.x.x`
- The `ios/App/App.xcodeproj` should be detected

## Troubleshooting

| Error | Solution |
|-------|----------|
| `Capacitor CLI requires NodeJS >=22.0.0` | Switch to 2025.11+ build stack |
| `No .xcodeproj file found` | Run `npx cap add ios` locally and commit |
| Node version still v20 | Ensure environment with `OVERRIDE_NODE_VERSION=22` is selected |
