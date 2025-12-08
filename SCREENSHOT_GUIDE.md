# Screenshot Guide for Microsoft Store

## Window Size Setup

For consistent screenshots, resize your windows to these dimensions:
- **Main Window**: 1400 x 900 pixels
- **Settings Window**: 1200 x 800 pixels

**Tip**: You can use PowerToys FancyZones or a window resizer tool, or manually resize and check with Win+Shift+S snipping tool which shows dimensions.

---

## Screenshot 1: Main Window - Empty State (Light Mode)

**Setup:**
1. Start the app with `npm start`
2. Make sure theme is set to "Light" in Settings
3. Clear both input and output areas
4. Close DevTools if open (View menu > Toggle Developer Tools, or just resize window to hide it)

**What to capture:**
- Clean main window showing Quick Action buttons
- Empty input/output text areas
- Model/Prompt/Tone dropdowns visible

---

## Screenshot 2: Main Window - With Content (Light Mode)

**Setup:**
1. Keep the app in Light mode
2. Paste the INPUT TEXT below into the input area (left/top)
3. Paste the OUTPUT TEXT below into the output area (right/bottom)
4. The status bar should show something like "Ready" or you can leave it as-is

### INPUT TEXT (paste this into the input area):
```
Hi John,

I wanted to follow up on our meeting last week. I think we should move forward with the project but I'm not sure about the timeline. Can we discuss? Also the budget might be an issue.

Let me know when works for you.

Thanks
Sarah
```

### OUTPUT TEXT (paste this into the output area):
```
Hi John,

Thank you for taking the time to meet with me last week. I wanted to follow up on our discussion regarding the project.

After reviewing our conversation, I believe we should proceed with the initiative. However, I'd like to discuss two key considerations:

1. **Timeline**: I want to ensure we establish realistic milestones that align with our team's capacity.
2. **Budget**: There may be some constraints we need to address before moving forward.

Would you be available for a brief call this week to discuss these points? I'm flexible and happy to work around your schedule.

Best regards,
Sarah
```

---

## Screenshot 3: Main Window - Dark Mode

**Setup:**
1. Go to Settings > Theme > Select "Dark"
2. Save and close Settings
3. Use the same INPUT and OUTPUT text from Screenshot 2
4. Capture the dark mode version

---

## Screenshot 4: Settings - General Tab

**Setup:**
1. Open Settings (gear icon or File > Settings)
2. Stay on the "General" tab
3. Make sure the API key field shows bullets (has a value, or put a fake one like "sk-or-xxxxxxxxxxxx")
4. Theme should be visible
5. Checkboxes should show reasonable defaults

**What to capture:**
- The General settings tab with API key field, theme selector, and preferences

---

## Screenshot 5: Settings - Models Tab

**Setup:**
1. In Settings, click the "Models" tab
2. You should see the default models listed (Claude, GPT, Gemini)
3. Some should be checked as enabled

**What to capture:**
- The Models tab showing available AI models with checkboxes

---

## Screenshot 6 (Optional): Settings - Quick Actions Tab

**Setup:**
1. Click the "Quick Actions" tab
2. Shows the three default quick action buttons configuration

**What to capture:**
- Quick Actions configuration with the preset buttons

---

## Capture Tips

1. **Use Windows Snipping Tool**: Press `Win + Shift + S`
2. **Select "Window" mode** for clean captures
3. **Save as PNG** for best quality
4. **Naming convention**:
   - `screenshot-1-main-empty.png`
   - `screenshot-2-main-content.png`
   - `screenshot-3-main-dark.png`
   - `screenshot-4-settings-general.png`
   - `screenshot-5-settings-models.png`

## Store Requirements

- **Minimum size**: 1366 x 768 pixels
- **Maximum size**: 3840 x 2160 pixels
- **Format**: PNG or JPG
- **Required**: At least 1 screenshot
- **Recommended**: 4-5 screenshots showing key features

---

## After Capturing

Save your screenshots and let me know - I'll help you with the MSIX package build next!
