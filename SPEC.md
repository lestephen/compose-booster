# Compose Booster - Product Specification

## Project Overview

**Name:** Compose Booster  
**Type:** Cross-platform desktop application (Windows & Mac)  
**Framework:** Electron  
**Purpose:** AI-powered email composition assistant using OpenRouter API with customizable models, prompts, and tones

### Core Value Proposition
A privacy-focused, standalone desktop application that allows users to improve, rewrite, or draft email responses using various AI models through OpenRouter's API. Users copy email content from Outlook, process it with pre-configured AI combos (model + prompt + tone), and paste the improved result back.

---

## Technical Stack

### Required Dependencies
```json
{
  "electron": "^28.0.0",
  "electron-builder": "^24.0.0",
  "electron-store": "^8.1.0",
  "axios": "^1.6.0"
}
```

### Target Platforms
- Windows 10/11 (64-bit)
- macOS 12+ (Intel & Apple Silicon)

### Build Outputs
- Windows: NSIS installer (.exe)
- macOS: DMG image (.dmg)

---

## Application Architecture

### File Structure
```
outlook-ai-assistant/
├── main.js                      # Electron main process
├── preload.js                   # Context bridge for IPC
├── package.json                 # Project configuration
├── index.html                   # Main window UI
├── settings.html                # Settings window UI
├── renderer.js                  # Main window logic
├── settings-renderer.js         # Settings window logic
├── styles.css                   # Main window styles
├── settings-styles.css          # Settings window styles
├── config/
│   └── default-config.json      # Default configuration
└── build/
    ├── icon.ico                 # Windows icon
    └── icon.icns                # macOS icon
```

---

## Feature Specifications

### 1. Main Window

#### Layout Components

**A. Text Input Area**
- Large textarea for pasting email content
- Minimum height: 250px
- Placeholder text: "Paste your email draft and conversation chain here..."
- Character counter showing current length
- Clear button to reset field

**B. Text Output Area**
- Large textarea (read-only) displaying AI response
- Minimum height: 250px
- Placeholder text: "AI response will appear here..."
- Auto-resizes to match input area height

**C. Quick Action Buttons**
- **Paste from Clipboard** button
  - Keyboard shortcut: `Ctrl/Cmd + Shift + V`
  - Pastes clipboard content into input area
- **Copy to Clipboard** button
  - Keyboard shortcut: `Ctrl/Cmd + Shift + C`
  - Copies output area to clipboard
  - Shows "Copied!" confirmation for 2 seconds

**D. Hot Combo Buttons**
- Row of 3 pre-configured combo buttons (configurable in settings)
- Each button displays:
  - Icon (emoji)
  - Combo name
  - Tooltip showing: Model + Prompt + Tone
- Clicking executes the combo (sends to API)
- Visual styling to differentiate from other buttons

**E. Custom Combo Section**
Located below hot combo buttons, arranged horizontally:
```
[Model Dropdown ▼] [Prompt Dropdown ▼] [Tone Dropdown ▼] [Process →] 
```

- **Model Dropdown:** Lists available AI models with names
- **Prompt Dropdown:** Lists available prompts by name
- **Tone Dropdown:** Lists available tones by name
- **Process Button:** Executes the custom combination
  - Keyboard shortcut: `Ctrl/Cmd + Enter`
  - Remembers last-used selection

**F. Status Bar**
- Bottom bar showing:
  - Current status ("Ready", "Processing...", "Success", "Error: ...")
  - Estimated cost (if available from API response)
  - Processing time
  - API model used in last request

**G. Menu Bar**
- **File**
  - Settings (`Ctrl/Cmd + ,`)
  - Quit (`Ctrl/Cmd + Q`)
- **Edit**
  - Undo (`Ctrl/Cmd + Z`) - Restore previous input
  - Clear Input (`Ctrl/Cmd + K`)
  - Clear Output (`Ctrl/Cmd + Shift + K`)
- **View**
  - Toggle Dark Mode
  - Increase Font Size (`Ctrl/Cmd + +`)
  - Decrease Font Size (`Ctrl/Cmd + -`)
  - Reset Font Size (`Ctrl/Cmd + 0`)
- **Help**
  - About
  - OpenRouter Documentation
  - Keyboard Shortcuts

#### UI Behavior

**Loading State**
- When processing:
  - Disable all action buttons
  - Show spinner/progress indicator
  - Display "Processing..." in status bar
  - Allow cancel operation

**Error Handling**
- Display errors in status bar (red background)
- Show retry button for failed requests
- Clear error messages:
  - "API Key not configured" → Link to settings
  - "Rate limit exceeded" → Show retry countdown
  - "Network error" → Show retry button
  - "Invalid API response" → Show error details

**History/Undo**
- Keep last 10 input/output pairs in memory (not persisted)
- `Ctrl/Cmd + Z` cycles through previous inputs
- "Restore Previous" button in UI

---

### 2. Settings Window

#### A. General Tab

**API Configuration**
- **OpenRouter API Key** (password field)
  - Test button to validate key
  - Link to OpenRouter dashboard
  - Save button with confirmation

**Application Preferences**
- **Theme:** Light / Dark / System
- **Font Size:** Slider (10-20px)
- **Window Position:** Save window size/position checkbox
- **Auto-update:** Check for updates on startup checkbox

#### B. Models Tab

**Model List**
- Table showing:
  - Model ID (e.g., `anthropic/claude-3.5-sonnet`)
  - Display Name (e.g., "Claude 3.5 Sonnet")
  - Cost Tier (Low/Medium/High)
  - Enabled checkbox

**Actions**
- Add Custom Model button
- Remove button
- Reset to Defaults button
- Drag to reorder

**Default Models** (pre-configured):
```javascript
[
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', cost: 'Medium' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', cost: 'High' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', cost: 'Low' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', cost: 'High' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', cost: 'Medium' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', cost: 'Low' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', cost: 'Low' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', cost: 'Low' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', cost: 'Low' },
  { id: 'anthropic/claude-2.1', name: 'Claude 2.1', cost: 'Medium' }
]
```

#### C. Prompts Tab

**Prompt List**
- List of prompt templates with:
  - Name
  - Preview (first 50 characters)
  - Edit button
  - Delete button (custom prompts only)
  - Duplicate button

**Prompt Editor** (modal or side panel)
- **Name:** Text input
- **Template Text:** Large textarea with syntax highlighting
- **Variables Supported:**
  - `${content}` - Email content (auto-injected)
  - `${tone}` - Selected tone descriptor
  - `${date}` - Current date
- **Save / Cancel buttons**

**Default Prompts** (pre-configured):
```javascript
{
  improve: {
    name: 'Improve & Polish',
    text: `You are an expert email writing assistant. Analyze the email below and improve it for clarity, professionalism, grammar, and tone ${tone}.

Important: The email may contain the person's draft reply followed by the original email chain (separated by "-----Original Message-----" or email headers). Only improve the person's draft reply at the top - do not modify or include the original email chain.

Return ONLY the improved version of the person's draft reply.

${content}`
  },
  
  professional: {
    name: 'Make Professional',
    text: `Rewrite the person's draft reply in a ${tone} professional and formal business tone. Only rewrite the draft reply at the top - do not include the original email chain.

Return ONLY the rewritten professional version.

${content}`
  },
  
  friendly: {
    name: 'Make Friendly',
    text: `Rewrite the person's draft reply in a ${tone} warmer, friendlier tone while remaining professional. Only rewrite the draft reply at the top.

Return ONLY the rewritten version.

${content}`
  },
  
  concise: {
    name: 'Make Concise',
    text: `Make the person's draft reply more concise ${tone} while preserving all key points. Only process the draft reply at the top.

Return ONLY the concise version.

${content}`
  },
  
  expand: {
    name: 'Expand Details',
    text: `Expand the person's draft reply ${tone} with more detail and clarity. Only expand the draft reply at the top.

Return ONLY the expanded version.

${content}`
  },
  
  reply: {
    name: 'Draft Reply',
    text: `Based on the email chain, draft a ${tone} professional reply. The content shows preliminary thoughts (if any) followed by the email chain.

Return ONLY the draft reply.

${content}`
  },
  
  summarize: {
    name: 'Summarize Email',
    text: `Summarize the key points of this email conversation in a ${tone} brief, clear manner.

${content}`
  }
}
```

#### D. Tones Tab

**Tone List**
- List of tone descriptors with:
  - Name
  - Description text (what it does)
  - Edit button
  - Delete button (custom tones only)

**Tone Editor** (modal or side panel)
- **Name:** Text input (e.g., "Professional", "Friendly")
- **Description:** Text that gets injected into prompt
  - Example: "in a professional, formal manner"
  - Example: "while maintaining a warm, friendly tone"
- **Save / Cancel buttons**

**Default Tones** (pre-configured):
```javascript
[
  {
    id: 'neutral',
    name: 'Neutral',
    description: ''
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'in a highly professional and formal manner'
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'while maintaining a warm and friendly tone'
  },
  {
    id: 'concise',
    name: 'Concise',
    description: 'being brief and to-the-point'
  },
  {
    id: 'detailed',
    name: 'Detailed',
    description: 'with comprehensive detail and thoroughness'
  },
  {
    id: 'apologetic',
    name: 'Apologetic',
    description: 'with an apologetic and understanding tone'
  },
  {
    id: 'assertive',
    name: 'Assertive',
    description: 'with confidence and assertiveness'
  },
  {
    id: 'empathetic',
    name: 'Empathetic',
    description: 'showing empathy and understanding'
  },
  {
    id: 'urgent',
    name: 'Urgent',
    description: 'conveying urgency and importance'
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'in a casual, conversational manner'
  }
]
```

#### E. Hot Combos Tab

**Hot Combo Configuration**
- Configure 3 hot combo buttons
- Each combo has:
  - **Name:** Text input (e.g., "Quick Polish")
  - **Icon:** Emoji picker (e.g., ✨, 👔, 💬, ⚡, 📝)
  - **Model:** Dropdown of available models
  - **Prompt:** Dropdown of available prompts
  - **Tone:** Dropdown of available tones
  - **Position:** 1, 2, or 3 (order on main window)

**Default Hot Combos:**
```javascript
[
  {
    name: 'Quick Polish',
    icon: '✨',
    model: 'openai/gpt-4o',
    prompt: 'improve',
    tone: 'neutral',
    position: 1
  },
  {
    name: 'Professional Email',
    icon: '👔',
    model: 'anthropic/claude-3.5-sonnet',
    prompt: 'professional',
    tone: 'professional',
    position: 2
  },
  {
    name: 'Draft Reply',
    icon: '💬',
    model: 'anthropic/claude-3.5-sonnet',
    prompt: 'reply',
    tone: 'friendly',
    position: 3
  }
]
```

**Actions**
- Save Changes button
- Reset to Defaults button
- Test Combo button (uses sample email)

#### F. Advanced Tab

**Cost Tracking**
- Display current session cost
- Display monthly spending (if tracking enabled)
- Reset counters button

**Privacy**
- Clear history on exit checkbox
- Don't save window position checkbox

**Export/Import**
- Export Settings button (saves JSON file)
- Import Settings button (loads JSON file)

**About**
- Version number
- Credits
- License information
- Links to GitHub/documentation

---

### 3. Data Storage

**Configuration File Location**
- Windows: `%APPDATA%/outlook-ai-assistant/config.json`
- macOS: `~/Library/Application Support/outlook-ai-assistant/config.json`

**Configuration Schema**
```javascript
{
  "apiKey": "sk-or-v1-...",
  
  "models": [
    {
      "id": "anthropic/claude-3.5-sonnet",
      "name": "Claude 3.5 Sonnet",
      "cost": "Medium",
      "enabled": true
    }
    // ... more models
  ],
  
  "prompts": {
    "improve": {
      "name": "Improve & Polish",
      "text": "...",
      "isDefault": true
    }
    // ... more prompts
  },
  
  "tones": [
    {
      "id": "neutral",
      "name": "Neutral",
      "description": "",
      "isDefault": true
    }
    // ... more tones
  ],
  
  "hotCombos": [
    {
      "name": "Quick Polish",
      "icon": "✨",
      "model": "openai/gpt-4o",
      "prompt": "improve",
      "tone": "neutral",
      "position": 1
    }
    // ... 2 more combos
  ],
  
  "lastUsed": {
    "model": "anthropic/claude-3.5-sonnet",
    "prompt": "improve",
    "tone": "neutral"
  },
  
  "preferences": {
    "theme": "light",
    "fontSize": 14,
    "saveWindowPosition": true,
    "checkUpdates": true,
    "clearHistoryOnExit": false
  },
  
  "windowBounds": {
    "width": 1000,
    "height": 800,
    "x": 100,
    "y": 100
  },
  
  "statistics": {
    "totalCalls": 0,
    "totalCost": 0,
    "monthlyCost": 0,
    "lastResetDate": "2024-01-01"
  }
}
```

---

### 4. API Integration

**OpenRouter API Endpoint**
```
POST https://openrouter.ai/api/v1/chat/completions
```

**Request Headers**
```javascript
{
  "Authorization": "Bearer sk-or-v1-...",
  "HTTP-Referer": "https://outlook-ai-assistant.local",
  "X-Title": "Compose Booster",
  "Content-Type": "application/json"
}
```

**Request Body**
```javascript
{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [
    {
      "role": "user",
      "content": "[PROCESSED PROMPT WITH TONE + EMAIL CONTENT]"
    }
  ]
}
```

**Prompt Construction Logic**
```javascript
function buildPrompt(promptTemplate, tone, emailContent) {
  // Get tone description
  const toneDescription = tone.description || '';
  
  // Replace variables in template
  let processedPrompt = promptTemplate
    .replace('${tone}', toneDescription)
    .replace('${content}', emailContent)
    .replace('${date}', new Date().toLocaleDateString());
  
  return processedPrompt;
}
```

**Response Handling**
```javascript
{
  "choices": [
    {
      "message": {
        "content": "AI generated response"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  },
  // Cost info may be in custom header or response
}
```

**Error Handling**
- Network errors: Show retry button
- 401 Unauthorized: Invalid API key → Link to settings
- 429 Rate Limit: Show cooldown timer
- 402 Payment Required: Insufficient credits
- 500 Server Error: Show error message

---

### 5. Keyboard Shortcuts

**Global Shortcuts**
- `Ctrl/Cmd + ,` - Open Settings
- `Ctrl/Cmd + Q` - Quit Application

**Main Window**
- `Ctrl/Cmd + V` or `Ctrl/Cmd + Shift + V` - Paste from clipboard
- `Ctrl/Cmd + C` or `Ctrl/Cmd + Shift + C` - Copy to clipboard
- `Ctrl/Cmd + Enter` - Process with custom combo
- `Ctrl/Cmd + 1` - Execute Hot Combo 1
- `Ctrl/Cmd + 2` - Execute Hot Combo 2
- `Ctrl/Cmd + 3` - Execute Hot Combo 3
- `Ctrl/Cmd + Z` - Undo (restore previous input)
- `Ctrl/Cmd + K` - Clear input
- `Ctrl/Cmd + Shift + K` - Clear output
- `Ctrl/Cmd + +` - Increase font size
- `Ctrl/Cmd + -` - Decrease font size
- `Ctrl/Cmd + 0` - Reset font size
- `Esc` - Cancel current operation (if processing)

---

### 6. Visual Design Guidelines

**Color Palette**
- Primary: `#0078D4` (Microsoft blue)
- Success: `#107C10` (green)
- Error: `#E81123` (red)
- Warning: `#FFB900` (yellow)
- Background Light: `#FFFFFF`
- Background Dark: `#1E1E1E`
- Text Light: `#000000`
- Text Dark: `#FFFFFF`

**Typography**
- Font Family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`
- Base Size: 14px (user-configurable)
- Headings: 18px, 16px, 14px

**Spacing**
- Base unit: 8px
- Padding: 16px, 24px, 32px
- Margins: 8px, 16px, 24px

**Components**
- Border radius: 6px
- Button padding: 10px 20px
- Input padding: 12px
- Shadow: `0 2px 8px rgba(0,0,0,0.1)`

---

### 7. Development Priorities

**Phase 1: MVP (Core Functionality)**
- ✅ Main window UI with input/output areas
- ✅ Custom combo (model + prompt + tone dropdowns)
- ✅ OpenRouter API integration
- ✅ Basic settings window (API key configuration)
- ✅ Copy/paste functionality
- ✅ Error handling

**Phase 2: Hot Combos**
- ✅ Hot combo buttons on main window
- ✅ Hot combo configuration in settings
- ✅ Default combos pre-configured

**Phase 3: Advanced Settings**
- ✅ Full settings panels (Models, Prompts, Tones)
- ✅ Custom prompt editor
- ✅ Tone management
- ✅ Import/export settings

**Phase 4: Polish**
- ✅ Keyboard shortcuts
- ✅ Dark mode
- ✅ Font size adjustment
- ✅ Window position saving
- ✅ History/undo functionality
- ✅ Loading states and animations

**Phase 5: Production**
- ✅ Application icons
- ✅ Build scripts for Windows/Mac
- ✅ Auto-update mechanism
- ✅ Error reporting
- ✅ Documentation

---

### 8. Testing Requirements

**Functional Tests**
- [ ] API key validation works
- [ ] All hot combos execute correctly
- [ ] Custom combo processes correctly
- [ ] Settings persist across restarts
- [ ] Keyboard shortcuts work
- [ ] Copy/paste functions work
- [ ] Error messages display correctly

**Edge Cases**
- [ ] Empty input handling
- [ ] Very long emails (10,000+ characters)
- [ ] Network disconnection during processing
- [ ] Invalid API key
- [ ] Rate limiting
- [ ] Malformed prompt templates

**Cross-Platform**
- [ ] Windows 10/11 functionality
- [ ] macOS Intel functionality
- [ ] macOS Apple Silicon functionality
- [ ] Window sizing on different screen resolutions

---

### 9. Security Considerations

**API Key Storage**
- Use `electron-store` with encryption
- Never log API key
- Clear API key on export (optional setting)

**User Privacy**
- No telemetry by default
- No cloud sync
- All processing happens via user's OpenRouter account
- Option to clear history on exit

**Input Validation**
- Sanitize prompt templates before processing
- Validate model IDs against known list
- Prevent prompt injection attacks

---

### 10. Future Enhancements (Post-MVP)

**Nice to Have**
- Multiple language support
- Batch processing (multiple emails)
- Email templates library
- Response comparison (generate multiple versions)
- Cost estimation before processing
- Usage analytics dashboard
- Browser extension integration
- Mobile app (React Native)
- Team/organization features

---

## Success Metrics

**User Satisfaction**
- Processing time < 5 seconds for typical email
- UI response time < 100ms
- Zero data loss
- Clear error messages

**Performance**
- Application startup < 2 seconds
- Memory usage < 200MB
- Build size < 150MB

**Quality**
- Zero critical bugs at launch
- 95%+ of prompts work as expected
- Cross-platform feature parity

---

## License & Distribution

**License:** MIT (open source)  
**Distribution:** GitHub releases + optional website  
**Updates:** Electron auto-updater checking GitHub releases

---

## Appendix: Sample User Workflow

### Scenario: Improving a draft email

1. User composes preliminary reply in Outlook:
   ```
   Hi Sarah,
   
   Thanks for your email. I think we can do that. Let me know when works.
   
   Best,
   John
   
   -----Original Message-----
   From: Sarah Johnson
   ...
   ```

2. User copies entire content (including email chain)

3. User opens Compose Booster

4. User pastes into input area (or clicks "Paste" button)

5. User clicks "Quick Polish" hot combo button (GPT-4o + Improve + Neutral tone)

6. Application sends to OpenRouter API:
   ```
   Prompt: "Improve this email for clarity and professionalism..."
   Content: [pasted email]
   ```

7. Output area displays:
   ```
   Hi Sarah,
   
   Thank you for reaching out. I'd be happy to help with this request. 
   Please let me know what dates and times work best for your schedule, 
   and I'll make the necessary arrangements.
   
   Best regards,
   John
   ```

8. User clicks "Copy" button

9. User pastes back into Outlook, replacing original draft

10. User sends email
