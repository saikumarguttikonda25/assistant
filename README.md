# Fieldnote

A personal voice notebook that stores editable Markdown files on your computer. Requires Node.js 22.9 or later. There are no npm dependencies to install.

## Run locally

This checkout includes a portable Node.js runtime under `.runtime/`. It is isolated
to this folder and does not modify the system Node.js installation or global PATH.

1. Open PowerShell in this repository.
2. To enable recording and AI formatting, copy `.env.example` to `.env` and add `OPENAI_API_KEY=your-key`. Use an OpenAI API key with billing enabled. The server reads the key and the browser never receives it. Git ignores the file.
3. Run `.\run-local.ps1` and open **http://127.0.0.1:3000** in a current Chrome, Firefox, or Safari browser. Allow microphone access when prompted.

Select **Start recording**, speak, then **Stop recording**. Review the transcript and choose **Save note**. Recordings stop automatically at 20 minutes. For typed input, choose **Text note**. Without a key, typed notes still save with a title derived from the opening words.

Voice transcription sends recorded audio to OpenAI Whisper. Saving with AI enabled sends the transcript to GPT-4o-mini, which selects headings and writes the title and note. Audio is held in browser memory during transcription. The waveform is a recording indicator.

## Files and editing

Find notes under `notes/YYYY/MM/` alongside the server, organized by UTC creation date. Each Markdown file contains a title, timestamp, formatted body and original transcript. Search across all three text fields. Open a saved note to edit its title and Markdown or delete its file. Back up the notes directory to preserve your notebook. Keep the timestamp line and original transcript divider intact when editing files directly.

Set `NOTES_DIR` to use another storage folder or `PORT` to change the port. The server listens on the loopback interface for personal use. Running it on a remote machine stores files on that machine.

Run `.\test-local.ps1` for the local note lifecycle check.

If PowerShell blocks scripts, use the same isolated runtime directly:

```powershell
.\.runtime\node-v22.14.0-win-x64\node.exe --env-file-if-exists=.env server.js
```
