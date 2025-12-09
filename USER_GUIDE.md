# Compose Booster User Guide

This guide provides detailed instructions for using all features of Compose Booster.

**Quick Links:** [Getting Started](#getting-started) | [Main Interface](#main-interface) | [Quick Actions](#quick-actions) | [Style Profiles](#style-profiles) | [Settings](#settings) | [Keyboard Shortcuts](#keyboard-shortcuts) | [Troubleshooting](#troubleshooting-guide)

---

## Table of Contents

1. [Getting Started](#getting-started)
   - [Installation](#installation)
   - [Setting Up Your API Key](#setting-up-your-api-key)
   - [Your First Email](#your-first-email)
2. [Main Interface](#main-interface)
   - [Input Area](#input-area)
   - [Output Area](#output-area)
   - [Status Bar](#status-bar)
3. [Quick Actions](#quick-actions)
   - [Using Quick Actions](#using-quick-actions)
   - [Customizing Quick Actions](#customizing-quick-actions)
4. [Custom Processing](#custom-processing)
   - [Selecting a Model](#selecting-a-model)
   - [Choosing a Prompt](#choosing-a-prompt)
   - [Setting the Tone](#setting-the-tone)
   - [Applying a Style](#applying-a-style)
5. [Style Profiles](#style-profiles)
   - [What Are Style Profiles?](#what-are-style-profiles)
   - [Creating a Style Profile](#creating-a-style-profile)
   - [Using Style Profiles](#using-style-profiles)
   - [Best Practices for Samples](#best-practices-for-samples)
6. [Response Regeneration](#response-regeneration)
   - [Try Again Button](#try-again-button)
   - [Version Navigation](#version-navigation)
   - [How Temperature Works](#how-temperature-works)
7. [Output Format Options](#output-format-options)
   - [Plain Text](#plain-text)
   - [Markdown](#markdown)
   - [HTML (Rich Text)](#html-rich-text)
8. [Context Window Warnings](#context-window-warnings)
   - [Understanding Context Limits](#understanding-context-limits)
   - [Warning Levels](#warning-levels)
   - [Reducing Token Usage](#reducing-token-usage)
9. [Settings](#settings)
   - [General Settings](#general-settings)
   - [Models Tab](#models-tab)
   - [Prompts Tab](#prompts-tab)
   - [Tones Tab](#tones-tab)
   - [Styles Tab](#styles-tab)
   - [Quick Actions Tab](#quick-actions-tab)
   - [Advanced Tab](#advanced-tab)
10. [Keyboard Shortcuts](#keyboard-shortcuts)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## Getting Started

### Installation

**Windows:**
1. Download the installer from [GitHub Releases](https://github.com/lestephen/compose-booster/releases) or the Microsoft Store
2. Run the installer and follow the prompts
3. Launch Compose Booster from the Start Menu

**macOS:**
1. Download from the Mac App Store (coming soon) or [GitHub Releases](https://github.com/lestephen/compose-booster/releases)
2. Open the DMG file and drag Compose Booster to Applications
3. Launch from Applications or Spotlight

### Setting Up Your API Key

Compose Booster uses [OpenRouter](https://openrouter.ai/) to access AI models. You'll need an API key to get started.

1. **Get an API Key:**
   - Visit [openrouter.ai/keys](https://openrouter.ai/keys)
   - Sign up for a free account
   - Create a new API key

2. **Enter Your Key in Compose Booster:**
   - Open **Settings** (File → Settings or `Ctrl/Cmd + ,`)
   - Paste your API key in the **API Key** field
   - Click **Test Key** to verify it works
   - Click **Save Settings**

> **Cost Note:** OpenRouter uses pay-as-you-go pricing. A typical email costs $0.001-0.01 depending on the model. Start with free credits from OpenRouter, then add funds as needed.

### Your First Email

1. **Paste your email draft** into the input area (left side)
2. **Click a Quick Action button** (e.g., ⚡ Quick Polish)
3. **Wait a few seconds** for the AI to process
4. **Review the improved email** in the output area (right side)
5. **Copy to clipboard** using the Copy button or `Ctrl/Cmd + Shift + C`

---

## Main Interface

The main window is divided into several key areas:

### Input Area

The left text area where you enter or paste your email draft.

- **Character Counter:** Shows the current character count in the bottom-left corner
- **Paste Button:** Click to paste from clipboard, or use `Ctrl/Cmd + Shift + V`
- **Clear Button:** Removes all text from the input area

**Tips:**
- Include the full email thread if you want context-aware responses
- The AI can handle emails of any length, but very long threads may approach context limits

### Output Area

The right text area displays the AI-improved version of your email.

- **Copy Button:** Copies the output to clipboard in your preferred format
- **Clear Button:** Clears the output area
- **Try Again Button:** Generates an alternative version (appears after processing)

### Status Bar

The bottom bar shows:
- **Model Used:** Which AI model processed your request
- **Processing Time:** How long the request took
- **Cost:** Estimated cost for the API call (if available)
- **Status Messages:** Errors, warnings, and success indicators

---

## Quick Actions

Quick Actions are pre-configured one-click buttons for common email improvements.

### Using Quick Actions

1. Enter your email text in the input area
2. Click one of the three Quick Action buttons:
   - **⚡ Quick Polish** - Fast general improvement
   - **🎯 Professional** - Formal business tone
   - **✨ Friendly** - Warm, approachable tone
3. Or use keyboard shortcuts: `Ctrl/Cmd + 1`, `2`, or `3`

Each Quick Action combines a specific model, prompt, and tone for consistent results.

### Customizing Quick Actions

You can fully customize each Quick Action button:

1. Open **Settings** → **Quick Actions** tab
2. For each action, configure:
   - **Name:** Display name on the button
   - **Icon:** Emoji to show on the button
   - **Model:** Which AI model to use
   - **Prompt:** Which prompt template to apply
   - **Tone:** Which tone to use
   - **Style:** Optionally apply a style profile
3. **Reorder** by dragging cards or using the arrow buttons
4. Click **Save Settings**

> **Tip:** The order of Quick Actions determines the keyboard shortcuts. The first action is `Ctrl+1`, second is `Ctrl+2`, etc.

---

## Custom Processing

For more control, use the custom processing options below the Quick Actions.

### Selecting a Model

Choose from various AI models with different capabilities and costs:

| Model | Best For | Cost |
|-------|----------|------|
| Claude 3.5 Haiku | Fast, everyday emails | Low |
| GPT-4o Mini | Good balance of speed/quality | Low |
| Claude 3.5 Sonnet | High-quality writing | Medium |
| GPT-4o | Complex, nuanced emails | Medium |
| Claude 3 Opus | Best quality, complex tasks | High |

**To change the model:**
1. Click the **Model** dropdown
2. Select your preferred model
3. The selection is remembered for next time

### Choosing a Prompt

Prompts tell the AI what kind of improvement to make:

- **Improve Email** - General enhancement
- **Fix Grammar** - Focus on grammar and spelling
- **Make Concise** - Shorten while preserving meaning
- **Expand Detail** - Add more detail and context
- **Formal Tone** - Professional business language
- **Casual Tone** - Relaxed, friendly language
- **Reply to Email** - Draft a response to an email

### Setting the Tone

Tones adjust the emotional quality of the output:

- **Professional** - Formal, business-appropriate
- **Friendly** - Warm and approachable
- **Neutral** - Balanced, no strong emotion
- **Confident** - Assertive and decisive
- **Empathetic** - Understanding and supportive
- **Urgent** - Conveys importance and time-sensitivity

### Applying a Style

Optionally select a Style Profile to match your personal writing voice. See [Style Profiles](#style-profiles) for details.

---

## Style Profiles

### What Are Style Profiles?

Style Profiles teach the AI to write in your personal style by providing example emails you've written. This uses a technique called "few-shot prompting" where the AI learns patterns from your examples.

**Benefits:**
- Output sounds more like you, not generic AI
- Consistent voice across all your emails
- Preserve your unique writing quirks and preferences

### Creating a Style Profile

1. Open **Settings** → **Styles** tab
2. Click **+ Add New Style**
3. Fill in the details:
   - **Style Name:** e.g., "My Work Style" or "Casual Me"
   - **Description:** Brief notes about the style (optional)
   - **Sample Emails:** Paste 2-3 emails you've written

4. Click **Save**

### Using Style Profiles

1. In the main window, find the **Style** dropdown
2. Select your style profile
3. Process your email as usual
4. The AI will attempt to match your writing patterns

**Styles work with:**
- Quick Actions (configure in Settings → Quick Actions)
- Custom processing (select from Style dropdown)

### Best Practices for Samples

**Do include:**
- 2-3 representative emails (more isn't always better)
- Emails that showcase your typical vocabulary and phrasing
- A mix of short and medium-length emails
- Emails you're proud of and consider "your voice"

**Avoid:**
- Very short emails (one-liners don't show enough style)
- Extremely long emails (uses too many tokens)
- Emails with lots of quoted text or signatures
- Highly unusual or one-off emails

**Sample length:**
- Each sample should be 100-500 words ideally
- Total samples shouldn't exceed ~1500 words combined
- Too many samples can hit context limits (see [Context Warnings](#context-window-warnings))

---

## Response Regeneration

### Try Again Button

Not happy with the output? Click **Try Again** to get an alternative version.

The button appears in the output area after processing completes. Each regeneration:
- Uses the same input, model, prompt, and tone
- Increases the "temperature" for more creative variation
- Stores the previous version so you can go back

### Version Navigation

After regenerating, use the version navigator to browse alternatives:

```
← [1 of 3] →
```

- **Previous (←):** Go to the earlier version
- **Next (→):** Go to the later version
- **Indicator:** Shows which version you're viewing

Up to 10 versions are stored per session. Starting a new email clears previous versions.

### How Temperature Works

Temperature controls how "creative" or "random" the AI's output is:

| Temperature | Behavior |
|-------------|----------|
| 0.7 (initial) | Balanced, predictable output |
| 0.9 | More variety, some surprises |
| 1.1 | Creative, may deviate from conventions |
| 1.3+ | Highly varied, less predictable |

Each regeneration increases temperature by 0.2, up to a maximum of 1.5.

---

## Output Format Options

Control how your copied text is formatted for pasting into other applications.

### Plain Text

**Setting:** Settings → General → Output Format → Plain Text

Copies the output as simple text with no formatting. Best for:
- Email clients that don't support rich text
- Plain text editors
- Maximum compatibility

### Markdown

**Setting:** Settings → General → Output Format → Markdown

Copies the output preserving Markdown formatting (headers, lists, bold, etc.). Best for:
- GitHub, GitLab, or similar platforms
- Markdown-aware applications
- Documentation systems

### HTML (Rich Text)

**Setting:** Settings → General → Output Format → HTML

Copies formatted HTML that pastes as rich text. Best for:
- Microsoft Outlook
- Gmail compose window
- Word processors
- Any application supporting rich text paste

> **Tip:** If you're pasting into a rich text email client like Outlook or Gmail, HTML format preserves formatting like bold text and bullet points.

---

## Context Window Warnings

### Understanding Context Limits

AI models have a maximum "context window" - the total amount of text they can process at once. This includes:
- Your email input
- The prompt template
- Style profile samples
- System instructions

When your input approaches these limits, the request may fail or produce poor results.

### Warning Levels

Compose Booster displays warnings when you're approaching limits:

| Level | Threshold | Indicator |
|-------|-----------|-----------|
| Normal | < 80% | No warning |
| Warning | 80-95% | Yellow warning message |
| Critical | > 95% | Red warning, may fail |

Warnings appear before processing and give you the option to:
- Continue anyway (risk of failure)
- Cancel and reduce input
- Switch to a model with larger context

### Reducing Token Usage

If you hit context limits:

1. **Shorten the email thread**
   - Remove older messages from the thread
   - Keep only the most recent relevant messages

2. **Reduce style samples**
   - Use fewer or shorter sample emails
   - Remove samples from your style profile temporarily

3. **Use a larger model**
   - Claude 3.5 Sonnet: 200K tokens
   - GPT-4o: 128K tokens
   - Claude 3 Opus: 200K tokens

4. **Simplify the prompt**
   - Use a shorter prompt template
   - Remove unnecessary instructions

---

## Settings

Access settings via **File → Settings** or press `Ctrl/Cmd + ,`

### General Settings

| Setting | Description |
|---------|-------------|
| **API Key** | Your OpenRouter API key |
| **Test Key** | Verify your API key is valid |
| **Theme** | Light, Dark, or System (follows OS) |
| **Font Size** | Interface text size (10-20px) |
| **Output Format** | Clipboard format: Plain, Markdown, or HTML |
| **Save Window Position** | Remember window size and location |
| **Clear History on Exit** | Don't persist undo history |
| **Developer Tools** | Enable DevTools shortcuts |

### Models Tab

Manage the AI models available in dropdowns.

**Features:**
- **Enable/Disable:** Toggle models on/off with checkboxes
- **Add Custom:** Add models from OpenRouter's full catalog
- **Reorder:** Drag to change dropdown order
- **Detailed View:** Toggle to show model IDs and pricing
- **Refresh:** Update model list from OpenRouter (5-minute cache)
- **Reset:** Restore default model list

**Adding a custom model:**
1. Click **+ Add Custom Model**
2. Enter the model ID (from OpenRouter)
3. Enter a display name
4. Set the cost tier (Low/Medium/High)
5. Click **Add**

### Prompts Tab

Create and manage prompt templates.

**Features:**
- **Add New:** Create custom prompts
- **Edit:** Modify existing prompts
- **Duplicate:** Copy a prompt as starting point
- **Delete:** Remove custom prompts (defaults are protected)
- **Reorder:** Drag to change dropdown order

**Variables in prompts:**
- `${content}` - Replaced with user's email text
- `${tone}` - Replaced with selected tone description
- `${date}` - Replaced with current date
- `${style}` - Replaced with style profile content

### Tones Tab

Manage tone options for email styling.

**Features:**
- **Add New:** Create custom tones
- **Edit:** Change name and description
- **Duplicate:** Copy existing tone
- **Delete:** Remove custom tones
- **Reorder:** Drag to arrange

**Tone description:**
The description is included in the AI prompt to guide the output. Be specific:
- Good: "Warm and friendly, uses casual language, includes personal touches"
- Less effective: "Friendly"

### Styles Tab

Manage Style Profiles for personalized output. See [Style Profiles](#style-profiles) for detailed instructions.

**Features:**
- **Add New:** Create a style with samples
- **Edit:** Update name, description, or samples
- **Duplicate:** Copy a style profile
- **Delete:** Remove custom styles
- **Reorder:** Drag to arrange

### Quick Actions Tab

Configure the three Quick Action buttons.

**For each action:**
- **Name:** Button label
- **Icon:** Emoji to display
- **Model:** AI model to use
- **Prompt:** Prompt template
- **Tone:** Tone setting
- **Style:** Optional style profile

**Reordering:**
- Drag cards to reorder, or use ↑/↓ arrows
- Order determines keyboard shortcuts (1, 2, 3)

### Advanced Tab

| Feature | Description |
|---------|-------------|
| **Export Settings** | Save all settings to a JSON file |
| **Import Settings** | Load settings from a JSON file |
| **Reset to Defaults** | Restore all settings to original values |

> **Note:** Export does not include your API key for security.

---

## Keyboard Shortcuts

### Processing

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Process with current settings |
| `Ctrl/Cmd + 1` | Quick Action 1 |
| `Ctrl/Cmd + 2` | Quick Action 2 |
| `Ctrl/Cmd + 3` | Quick Action 3 |
| `Escape` | Cancel processing |

### Clipboard

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + V` | Paste into input |
| `Ctrl/Cmd + Shift + C` | Copy output |

### Editing

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo (restore previous input) |
| `Ctrl/Cmd + K` | Clear input |
| `Ctrl/Cmd + Shift + K` | Clear output |

### Application

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + ,` | Open Settings |
| `Ctrl/Cmd + Q` | Quit (macOS) |
| `Alt + F4` | Quit (Windows) |

---

## Troubleshooting Guide

### Common Issues

#### "API key is invalid"

1. Check that you copied the full key (starts with `sk-or-`)
2. Verify the key at [openrouter.ai/keys](https://openrouter.ai/keys)
3. Ensure the key hasn't been revoked
4. Create a new key if needed

#### "Insufficient credits"

1. Check your balance at [openrouter.ai/credits](https://openrouter.ai/credits)
2. Add credits to your account
3. Consider using a lower-cost model

#### Processing takes too long

1. Check your internet connection
2. Try a faster model (Haiku or GPT-4o Mini)
3. Shorten your input text
4. Check OpenRouter status at [status.openrouter.ai](https://status.openrouter.ai)

#### Output is cut off or incomplete

1. The model may have hit its output limit
2. Try regenerating (Try Again button)
3. Use a prompt that explicitly requests complete output
4. Try a different model

#### Context limit errors

1. Your input + style samples exceed the model's limit
2. See [Context Window Warnings](#context-window-warnings) for solutions
3. Use a model with larger context (Claude 3.5 Sonnet: 200K)

#### App won't start / crashes

1. **Windows:** Try running as Administrator
2. **macOS:** Check Security & Privacy settings
3. Delete config file and restart:
   - Windows: `%APPDATA%/compose-booster/`
   - macOS: `~/Library/Application Support/compose-booster/`
4. Reinstall the application

### Getting Help

- **Documentation:** [GitHub Wiki](https://github.com/lestephen/compose-booster/wiki)
- **Bug Reports:** [GitHub Issues](https://github.com/lestephen/compose-booster/issues)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| **API Key** | Authentication credential for OpenRouter |
| **Context Window** | Maximum tokens a model can process |
| **Few-shot Prompting** | Teaching AI by example (Style Profiles) |
| **Prompt Template** | Instructions telling the AI what to do |
| **Temperature** | Controls randomness/creativity of output |
| **Token** | Unit of text (~4 characters in English) |
| **Tone** | Emotional quality of the writing |

### Model Context Limits

| Model | Context Window |
|-------|----------------|
| Claude 3.5 Haiku | 200K tokens |
| Claude 3.5 Sonnet | 200K tokens |
| Claude 3 Opus | 200K tokens |
| GPT-4o | 128K tokens |
| GPT-4o Mini | 128K tokens |
| Gemini 1.5 Pro | 1M tokens |
| Gemini 1.5 Flash | 1M tokens |

---

*Last updated: December 2025*
