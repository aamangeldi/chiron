# show-logs

Export Claude Code conversation transcripts in a readable format.

## Features

- View complete conversation history including:
  - User messages and assistant responses
  - Thinking blocks (Claude's internal reasoning)
  - Tool calls and results
  - Metadata (timestamps, token usage, model info)
  - File history snapshots

## Installation

```bash
# Install from local directory
pip install -e .
```

## Usage

```bash
# Auto-detect current project's transcript
show-logs

# Specify a transcript file
show-logs ~/.claude/projects/-Users-username-project/transcript.jsonl

# Export to a file
show-logs ~/.claude/projects/-Users-username-project/transcript.jsonl output.txt
```

## Transcript Location

Claude Code stores transcripts in:
- **Project-specific**: `~/.claude/projects/<project-path>/*.jsonl`
- **Global history**: `~/.claude/history.jsonl`

## Development

```bash
# Install in development mode
pip install -e .

# Run from source
python -m show_logs.cli
```
