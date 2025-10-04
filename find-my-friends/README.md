# Find My Friends - Browser Extension

A retro-styled browser extension that tracks what page you're currently viewing and shows where your friends are browsing on the internet in real-time.

## Features

- 📍 **Real-time tracking** - Automatically tracks your current browser tab
- 👥 **Friends list** - See where your friends are browsing right now
- 🎨 **Retro pixel design** - Matches the InfoShare widget aesthetic
- ⚡ **Lightweight** - Minimal performance impact

## Installation (Chrome/Edge)

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `find-my-friends` folder
5. The extension icon should appear in your toolbar

## Installation (Firefox)

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to the `find-my-friends` folder and select `manifest.json`

## Creating Icons

The extension needs three icon files. To create them:

1. Open `create-icons.html` in your browser
2. Right-click each canvas and save as:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
3. Save all three files in the `find-my-friends` directory

Or create your own 16x16, 48x48, and 128x128 pixel icons.

## How It Works

**Current Implementation (Local Only):**
- The extension tracks your current tab URL, title, and favicon
- Your location is stored locally in Chrome storage
- Sample friend data is shown in the popup (hardcoded)

**For Real-World Use (Requires Backend):**
To make this work with real friends, you'll need to:

1. Set up a backend server (Node.js, Firebase, Supabase, etc.)
2. Add authentication (so users can sign in)
3. Create friend connections
4. Sync locations to the server in `background.js`
5. Fetch friends' locations in `popup.js`

## Privacy Note

This extension tracks your browsing activity. In a real implementation:
- Only share location data with explicit user consent
- Allow users to pause tracking
- Let users control which sites are tracked
- Implement privacy controls for who can see your location

## File Structure

```
find-my-friends/
├── manifest.json        # Extension configuration
├── background.js        # Tracks current tab/URL
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── create-icons.html   # Icon generator utility
├── icon16.png          # 16x16 icon (needs to be created)
├── icon48.png          # 48x48 icon (needs to be created)
├── icon128.png         # 128x128 icon (needs to be created)
└── README.md           # This file
```

## Development

The extension uses:
- **Manifest V3** - Latest Chrome extension format
- **Service Worker** - For background tracking
- **Chrome Storage API** - To store current location
- **Tabs API** - To monitor active tabs

## Next Steps

To make this production-ready:

1. **Backend Integration**
   - Set up authentication
   - Create API endpoints for location sync
   - Implement friend management

2. **Privacy Controls**
   - Add pause/resume tracking
   - Site blacklist
   - Visibility settings

3. **Enhanced Features**
   - Chat with friends at same site
   - Visit history
   - Popular sites among friends
   - Notifications when friends visit interesting sites

4. **Icons**
   - Generate proper icons using `create-icons.html`
