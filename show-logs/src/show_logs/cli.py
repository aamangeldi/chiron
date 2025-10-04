#!/usr/bin/env python3
"""
Export Claude Code conversation transcripts in a readable format.
Shows ALL information including metadata, tool results, and file history.
"""
import json
import sys
import os
from pathlib import Path
from datetime import datetime

def format_timestamp(ts):
    """Format ISO timestamp to readable format."""
    try:
        dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except:
        return ts

def format_metadata(entry):
    """Format entry metadata."""
    meta = []
    if 'timestamp' in entry:
        meta.append(f"Time: {format_timestamp(entry['timestamp'])}")
    if 'uuid' in entry:
        meta.append(f"UUID: {entry['uuid']}")
    if 'requestId' in entry:
        meta.append(f"Request: {entry['requestId']}")
    if 'sessionId' in entry:
        meta.append(f"Session: {entry['sessionId']}")
    if 'cwd' in entry:
        meta.append(f"CWD: {entry['cwd']}")
    if 'gitBranch' in entry:
        meta.append(f"Branch: {entry['gitBranch']}")
    return ' | '.join(meta)

def format_transcript(input_file, output_file=None):
    """Parse and format a JSONL transcript file with ALL information."""

    output = []

    with open(input_file, 'r') as f:
        for line in f:
            if line.strip():
                entry = json.loads(line)

                # File history snapshots
                if entry.get('type') == 'file-history-snapshot':
                    output.append(f"\n{'='*80}")
                    output.append(f"FILE HISTORY SNAPSHOT")
                    output.append(f"{'='*80}")
                    output.append(f"Message ID: {entry.get('messageId')}")
                    output.append(f"Is Update: {entry.get('isSnapshotUpdate')}")
                    snapshot = entry.get('snapshot', {})
                    output.append(f"Timestamp: {format_timestamp(snapshot.get('timestamp', ''))}")
                    tracked = snapshot.get('trackedFileBackups', {})
                    if tracked:
                        output.append(f"Tracked Files: {json.dumps(tracked, indent=2)}")
                    else:
                        output.append("Tracked Files: (none)")

                # User messages
                elif entry.get('type') == 'user':
                    output.append(f"\n{'='*80}")
                    output.append(f"USER")
                    output.append(f"{'='*80}")
                    output.append(f"Metadata: {format_metadata(entry)}")

                    msg = entry.get('message', {})
                    content = msg.get('content', '')

                    # String content (user input)
                    if isinstance(content, str):
                        output.append(f"\n{content}")

                    # List content (tool results)
                    elif isinstance(content, list):
                        for item in content:
                            if item.get('type') == 'tool_result':
                                output.append(f"\n[TOOL RESULT: {item.get('tool_use_id')}]")
                                result_content = item.get('content', '')
                                output.append(result_content)

                    # Tool use result metadata (if present)
                    if 'toolUseResult' in entry:
                        result = entry['toolUseResult']
                        output.append(f"\n[TOOL RESULT METADATA]")
                        if isinstance(result, dict):
                            for key, value in result.items():
                                if key not in ['result']:  # result is already shown above
                                    output.append(f"{key}: {value}")
                        else:
                            output.append(f"{result}")

                    # Thinking metadata (if present)
                    if 'thinkingMetadata' in entry:
                        output.append(f"\n[THINKING METADATA]")
                        output.append(json.dumps(entry['thinkingMetadata'], indent=2))

                # Assistant messages
                elif entry.get('type') == 'assistant':
                    output.append(f"\n{'='*80}")
                    output.append(f"ASSISTANT")
                    output.append(f"{'='*80}")
                    output.append(f"Metadata: {format_metadata(entry)}")

                    msg = entry.get('message', {})

                    # Model and usage info
                    if 'model' in msg:
                        output.append(f"Model: {msg['model']}")
                    if 'usage' in msg:
                        usage = msg['usage']
                        output.append(f"Token Usage: {json.dumps(usage, indent=2)}")
                    if 'stop_reason' in msg and msg['stop_reason']:
                        output.append(f"Stop Reason: {msg['stop_reason']}")

                    content = msg.get('content', [])

                    for item in content:
                        if item.get('type') == 'text':
                            output.append(f"\n{item.get('text', '')}")
                        elif item.get('type') == 'thinking':
                            output.append(f"\n[THINKING]")
                            thinking = item.get('thinking', '')
                            output.append(thinking)
                            # Show signature if present
                            if 'signature' in item:
                                output.append(f"\n[SIGNATURE: {item['signature'][:50]}...]")
                        elif item.get('type') == 'tool_use':
                            output.append(f"\n[TOOL USE: {item.get('name')}]")
                            output.append(f"Tool ID: {item.get('id')}")
                            output.append(f"Input: {json.dumps(item.get('input', {}), indent=2)}")

    formatted_output = '\n'.join(output)

    if output_file:
        with open(output_file, 'w') as f:
            f.write(formatted_output)
        print(f"Transcript exported to: {output_file}")
    else:
        print(formatted_output)

def main():
    if len(sys.argv) < 2:
        # Use default transcript location
        home = Path.home()
        cwd = os.getcwd()
        project_path = cwd.replace('/', '-')
        transcript_dir = home / '.claude' / 'projects' / project_path

        # Find the most recent transcript
        if transcript_dir.exists():
            transcripts = list(transcript_dir.glob('*.jsonl'))
            if transcripts:
                input_file = max(transcripts, key=lambda p: p.stat().st_mtime)
                print(f"Using transcript: {input_file}")
            else:
                print(f"No transcripts found in {transcript_dir}")
                sys.exit(1)
        else:
            print(f"Transcript directory not found: {transcript_dir}")
            sys.exit(1)
    else:
        input_file = sys.argv[1]

    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    format_transcript(input_file, output_file)

if __name__ == '__main__':
    main()
