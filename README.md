# Gmail Toggle Checks

A Chrome/Firefox extension that adds **↓ Check below** and **↓ Uncheck below** buttons to Gmail, letting you check or uncheck a contiguous block of emails in one click.

## The Problem

Sometimes I go to GMail and I have many emails I want to delete, I press the select all and then I havve to scrool down to the emails I want to keep (Generally a day ago so maybe the bottom 40) and uncheck each one.  Gmail's select-all is great, but deselecting a range of emails is a lot of work. This extension fixes that.

## How to Use

1. Open Gmail and optionally hit the **Select all** checkbox at the top to check every visible email.
2. Hover over the row where you want to start unchecking — a small toolbar appears at the right edge of the screen.
3. Click **↓ Uncheck below** to uncheck that row and every row below it.
4. Use **↓ Check below** to do the reverse — check from a row downward.

## Installation

### Chrome / Edge

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select this folder
4. Reload Gmail

### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on** and select `manifest.json`
3. Reload Gmail

> **Note:** Firefox temporary add-ons are removed on browser restart. To make it permanent, the extension would need to be signed by Mozilla or installed via a custom profile.

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (Manifest V3, Chrome + Firefox compatible) |
| `content.js` | Content script injected into Gmail |

## How It Works

Gmail renders its inbox as a table where each row contains a `<div role="checkbox">` instead of a native `<input>`. The content script:

- Listens for `mouseover` events using event delegation (no per-row listeners, works as Gmail dynamically loads rows)
- Shows a floating toolbar aligned vertically to the hovered row, positioned just left of Gmail's own hover actions (Archive, Delete, Snooze, Mark as read, Track/Unsubscribe) so they stay clickable
- On button click, finds all email rows from the hovered row to the bottom of the list and clicks each checkbox that needs toggling

## Compatibility

- Chrome 109+
- Edge 109+
- Firefox 109+
- Works with Gmail's standard inbox, All Mail, and label views
