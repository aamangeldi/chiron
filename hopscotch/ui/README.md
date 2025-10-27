# Hopscotch UI

A Next.js web application providing an AI chat interface for the Hopscotch browsing history assistant.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **React**: 18.3

## Getting Started

### From the root project directory:

```bash
# Start the development server
npm run ui:dev

# Build for production
npm run ui:build

# Start production server
npm run ui:start
```

### From this directory (src/ui):

```bash
# Install dependencies (if needed)
npm install

# Start dev server
npm run dev

# Build
npm run build

# Start production server
npm start
```

## Development Server

The UI runs on **http://localhost:3000** by default (or 3001 if 3000 is in use).

## Project Structure

```
src/ui/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Home page with ChatInterface
│   └── globals.css      # Global styles with Tailwind
├── components/
│   ├── ChatInterface.tsx   # Main chat container with state management
│   ├── MessageList.tsx     # Message display with auto-scroll
│   └── MessageInput.tsx    # Text input with send button
├── lib/
│   ├── types.ts         # TypeScript type definitions
│   └── mockData.ts      # Mock chat data and AI responses
└── public/              # Static assets

```

## Features

### Current (Mock Implementation)

- ✅ AI chat interface with message history
- ✅ Real-time message updates
- ✅ Auto-scrolling to latest messages
- ✅ Loading states with animated dots
- ✅ Responsive design (mobile-friendly)
- ✅ Dark mode support
- ✅ Mock AI responses for testing

### Ready for Integration

- 🔄 Replace `sendMessageToAI()` in `lib/mockData.ts` with real API calls
- 🔄 Connect to Hopscotch backend/Electron app
- 🔄 Display actual browsing history in responses
- 🔄 Add authentication if needed

## Components

### ChatInterface

Main container component that manages chat state:
- Handles sending messages
- Manages loading states
- Orchestrates MessageList and MessageInput

### MessageList

Displays chat messages with:
- User messages (right-aligned, blue)
- AI responses (left-aligned, with border)
- Auto-scroll to bottom on new messages
- Loading indicator with animated dots
- Timestamps for each message

### MessageInput

Text input component with:
- Auto-expanding textarea
- Send button
- Enter to send (Shift+Enter for new line)
- Disabled state during loading

## Styling

Uses Tailwind CSS with:
- Dark mode support (follows system preference)
- Responsive design
- Consistent color scheme (blue primary)
- Modern UI components

## Mock Data

Located in `lib/mockData.ts`:

```typescript
// Initial welcome message
initialMessages

// Random mock responses
mockResponses

// Simulated AI API call (1 second delay)
sendMessageToAI(userMessage: string): Promise<string>
```

## Next Steps

1. **Backend Integration**: Replace mock AI responses with real API calls
2. **Authentication**: Add user authentication if needed
3. **History Display**: Show actual browsing history in the UI
4. **Settings**: Add configuration options
5. **Error Handling**: Improve error messages and retry logic
6. **Testing**: Add unit and integration tests

## Notes

- The UI is a **standalone web application**, separate from the Electron app
- It can run independently for development and testing
- Ready to integrate with any backend API (REST, GraphQL, WebSocket, etc.)
- All styling uses Tailwind utility classes for easy customization
