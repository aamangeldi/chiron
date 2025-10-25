# Hopscotch Implementation Plan

This document outlines the staged implementation plan for Hopscotch, an AI-powered browsing history assistant.

## Architecture Overview

The application is divided into independent modules that can be developed in parallel:

- **history-collector/** - Browser history extraction
- **storage/** - Data persistence (SQLite)
- **ai-agent/** - AI interaction layer (stub)
- **ui/** - User interface (stub)
- **main/** - Application orchestration
- **shared/** - Common types and interfaces

## Parallel Development Tracks

### Track 1: History Collection & Storage
**Owner:** [Your name here]
**Dependencies:** None (can start immediately)

### Track 2: AI Agent Implementation
**Owner:** [Teammate name here]
**Dependencies:** Shared interfaces only

### Track 3: UI Implementation
**Owner:** [Can be either or shared]
**Dependencies:** Shared interfaces + basic storage queries

---

## Stage 1: Browser History Collection
**Goal:** Extract browsing history from Chrome, Firefox, Safari, and Edge
**Status:** Not Started

### Success Criteria
- [ ] Chrome history can be read from local database
- [ ] Firefox history can be read from local database
- [ ] Safari history can be read from local database (macOS)
- [ ] Edge history can be read from local database
- [ ] Handles locked database files (browsers running)
- [ ] Handles missing/corrupted database files gracefully
- [ ] All entries converted to standard HistoryEntry format

### Implementation Steps
1. **Chrome Collector** (src/history-collector/chrome-collector.ts)
   - Locate Chrome history database by platform
   - Copy database to temp location (Chrome locks file)
   - Query `urls` and `visits` tables
   - Convert to HistoryEntry format
   - Handle errors gracefully

2. **Firefox Collector** (src/history-collector/firefox-collector.ts)
   - Locate Firefox places.sqlite by platform
   - Similar approach to Chrome
   - Query `moz_places` and `moz_historyvisits` tables

3. **Safari Collector** (src/history-collector/safari-collector.ts)
   - macOS only
   - Locate Safari History.db
   - Query history tables
   - Handle Safari-specific format

4. **Edge Collector** (src/history-collector/edge-collector.ts)
   - Similar to Chrome (Chromium-based)
   - Different default path

### Tests
- [ ] Each collector returns valid HistoryEntry objects
- [ ] Collectors handle missing browsers gracefully
- [ ] Collectors handle locked databases
- [ ] Manager can collect from multiple browsers
- [ ] Duplicate entries are handled correctly

---

## Stage 2: AI Agent Integration
**Goal:** Implement AI agent for intelligent browsing history interaction
**Status:** Not Started
**Owner:** [Teammate - independent work]

### Success Criteria
- [ ] AI agent can accept browsing history context
- [ ] Agent responds to user messages with relevant insights
- [ ] Agent can analyze browsing patterns
- [ ] Agent provides useful suggestions
- [ ] Response time is acceptable (<3 seconds typical)

### Implementation Steps
1. **Choose AI Backend** (decision needed)
   - Option A: OpenAI API (GPT-4, GPT-3.5)
   - Option B: Anthropic Claude API
   - Option C: Local LLM (Ollama, llama.cpp)
   - Option D: Custom model

2. **Implement IAIAgent Interface** (src/ai-agent/)
   - Replace StubAIAgent with real implementation
   - Implement initialize() - load model/connect to API
   - Implement sendMessage() - process requests
   - Implement context management for history entries

3. **Context Window Management**
   - Efficiently include relevant history in prompts
   - Summarize large history sets
   - Smart filtering by relevance

4. **Response Format**
   - Structured responses
   - Citations to specific history entries
   - Actionable suggestions

### Tests
- [ ] Agent initializes successfully
- [ ] Agent responds to basic queries
- [ ] Agent uses browsing history context
- [ ] Agent handles large context windows
- [ ] Agent gracefully handles errors

---

## Stage 3: User Interface
**Goal:** Create intuitive UI for browsing history and AI interaction
**Status:** Not Started
**Owner:** [Can be assigned to teammate or done together]

### Success Criteria
- [ ] Users can view their browsing history
- [ ] Users can search and filter history
- [ ] Users can chat with AI agent
- [ ] Chat includes relevant history context automatically
- [ ] UI is responsive and performant
- [ ] Works across platforms (macOS, Windows, Linux)

### Implementation Steps
1. **Choose UI Framework** (decision needed)
   - Option A: React + TypeScript
   - Option B: Vue + TypeScript
   - Option C: Svelte
   - Option D: Vanilla HTML/CSS/JS

2. **Design Main Views**
   - History browser view
   - AI chat interface
   - Settings panel
   - About/help section

3. **Implement IUIController Interface** (src/ui/)
   - Replace StubUIController
   - Create Electron BrowserWindow
   - Set up IPC communication with main process
   - Handle data updates from main process

4. **History View Features**
   - List/grid of history entries
   - Date range filtering
   - Browser type filtering
   - Search by URL/title
   - Pagination/infinite scroll

5. **AI Chat Features**
   - Chat message list
   - Input field
   - Auto-include relevant history
   - Citations/links to history entries
   - Export conversations

### Tests
- [ ] UI renders correctly
- [ ] History data displays properly
- [ ] Search and filters work
- [ ] Chat interface is functional
- [ ] IPC communication works
- [ ] UI updates on data changes

---

## Stage 4: Integration & Polish
**Goal:** Integrate all modules and polish the experience
**Status:** Not Started

### Success Criteria
- [ ] All modules work together seamlessly
- [ ] Periodic sync runs in background
- [ ] App starts on system boot (optional)
- [ ] System tray integration (optional)
- [ ] Settings are persisted
- [ ] Error handling is comprehensive
- [ ] Performance is acceptable
- [ ] Memory usage is reasonable

### Implementation Steps
1. **Main Process Orchestration** (src/main/index.ts)
   - Wire up all modules
   - Implement periodic sync
   - Handle app lifecycle
   - IPC channel setup

2. **Configuration Management**
   - User settings (enabled browsers, sync interval)
   - Persist settings to disk
   - Settings UI

3. **Error Handling**
   - Graceful degradation
   - User-friendly error messages
   - Logging system

4. **Performance Optimization**
   - Lazy loading for large datasets
   - Efficient database queries
   - Background processing for heavy tasks

5. **Polish**
   - App icon
   - About dialog
   - Keyboard shortcuts
   - Dark mode support

### Tests
- [ ] End-to-end workflow tests
- [ ] Performance benchmarks
- [ ] Memory leak tests
- [ ] Error scenarios handled
- [ ] Cross-platform testing

---

## Stage 5: Deployment & Distribution
**Goal:** Package and distribute the application
**Status:** Not Started

### Success Criteria
- [ ] App can be built for macOS, Windows, Linux
- [ ] Installation is straightforward
- [ ] Auto-updates work (optional)
- [ ] Documentation is complete
- [ ] License is clear

### Implementation Steps
1. **Electron Builder Setup**
   - Configure electron-builder
   - Platform-specific builds
   - Code signing (for macOS)

2. **Documentation**
   - User guide
   - Developer documentation
   - API documentation

3. **Distribution**
   - GitHub Releases
   - Or other distribution method

### Tests
- [ ] Builds complete on all platforms
- [ ] Installers work correctly
- [ ] App runs after installation

---

## Notes

- Remove this file when all stages are complete
- Update status as work progresses
- Add notes on decisions made
- Document any blockers or changes to plan

## Current Status Summary

| Stage | Status | Blocker |
|-------|--------|---------|
| 1. History Collection | Not Started | - |
| 2. AI Agent | Not Started | Backend decision needed |
| 3. UI | Not Started | Framework decision needed |
| 4. Integration | Not Started | Depends on 1-3 |
| 5. Deployment | Not Started | Depends on 4 |
