# Distribution Information

This document provides legal text and disclaimers for publishing Compose Booster to app stores and within the application itself.

---

## Section 1: App Store Description Disclaimer

Use this text in your Apple App Store, Microsoft Store, or other distribution platform descriptions:

### Disclaimer Text (Copy-Paste Ready)

```
OPEN SOURCE & FREE SOFTWARE

Compose Booster is free and open-source software released under the Mozilla Public License 2.0 (MPL-2.0). The complete source code is available at https://github.com/your-username/compose-booster

NO WARRANTY DISCLAIMER: This software is provided "AS IS" without warranty of any kind, express or implied. The software is developed and maintained by an individual developer, not a corporation. By downloading and using this application, you acknowledge that you use it entirely at your own risk. The author assumes no liability for any damages, data loss, or issues arising from the use of this software. No guarantees are provided regarding fitness for any particular purpose, support, updates, or bug fixes.

TRADEMARK NOTICE: "Compose Booster" and associated logos are trademarks of Stephen Le. This software may be freely used and modified under MPL-2.0, but derivative works must be rebranded with a distinct name and identity.

REQUIRES OPENROUTER API KEY: This application requires an OpenRouter API account (https://openrouter.ai) to function. API usage is billed separately by OpenRouter according to their pricing. The developer of Compose Booster is not affiliated with or responsible for OpenRouter's services or charges.
```

### Additional Notes for App Store Submissions

**Privacy Policy:** You may need to create a privacy policy document. Since Compose Booster stores API keys locally and doesn't collect user data, a simple statement will suffice:

```
Privacy Policy: Compose Booster does not collect, transmit, or store any user data on external servers. All configuration, including API keys, is stored locally on your device using encrypted storage. API requests are sent directly to OpenRouter (https://openrouter.ai) and are subject to their privacy policy.
```

**Support URL:** Point to your GitHub Issues page: `https://github.com/your-username/compose-booster/issues`

**Age Rating:** Suitable for all ages (4+/Everyone)

**Category:** Productivity / Developer Tools

---

## Section 2: In-App "About" Screen Text

This text should appear in your application's Help → About menu or About dialog to comply with MPL 2.0 source code disclosure requirements.

### About Screen Text (Copy-Paste Ready)

```
Compose Booster v1.0.0
Copyright (c) 2025 Stephen Le

An AI-powered email composition assistant.

LICENSE
This software is licensed under the Mozilla Public License 2.0 (MPL-2.0).
You are free to use, modify, and distribute this software under the terms
of the MPL-2.0 license.

SOURCE CODE
The complete source code for this application is available at:
https://github.com/your-username/compose-booster

You have the right to:
• View and download the source code
• Modify the code for your own use
• Distribute modified versions (with proper attribution and rebranding)
• Use the code in commercial projects (following MPL-2.0 terms)

NO WARRANTY
THIS SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND.
See the full license for details.

THIRD-PARTY SERVICES
This application uses OpenRouter (https://openrouter.ai) for AI model access.
OpenRouter is a third-party service with separate terms and pricing.

TRADEMARKS
"Compose Booster" and associated logos are trademarks of Stephen Le.

---

For license details, bug reports, or contributions, visit:
https://github.com/your-username/compose-booster
```

### Implementation Recommendations

1. **Create an About Dialog:**
   - Add menu item: Help → About Compose Booster
   - Display the above text in a scrollable dialog window
   - Include a "View License" button that opens LICENSE file in default text editor
   - Include a "Visit GitHub" button that opens the repository in browser

2. **Keyboard Shortcut:**
   - Consider adding a keyboard shortcut (e.g., F1 or Ctrl/Cmd+H) to open the About dialog

3. **First Run Welcome Screen:**
   - On first launch, show a welcome screen with the NO WARRANTY disclaimer
   - Require user acknowledgment before proceeding
   - Checkbox: "I understand this software is provided AS IS with no warranty"

---

## Section 3: Additional Legal Considerations

### For Microsoft Store Submission

Microsoft may require:
- A more detailed privacy policy (even if it states "no data collection")
- Declaration that you're an individual publisher
- Tax information (W-9 or equivalent)

### For Apple App Store Submission

Apple requires:
- Privacy nutrition labels (select "We do not collect data")
- App Review Notes: Mention that an OpenRouter API key is required for testing
- Provide a test API key with limited credits for app review purposes

### For Website/Landing Page

If you create a marketing website, include:
- Link to GitHub repository prominently
- MPL 2.0 badge/notice
- NO WARRANTY disclaimer in footer
- Link to OpenRouter for API signup

---

## Section 4: Handling User Support

Since you're an individual developer releasing AS IS software, set clear expectations:

### GitHub Issue Template Suggestion

```markdown
## Issue Guidelines

This is free, open-source software provided AS IS with no warranty or guaranteed support.

**Before submitting an issue:**
- [ ] I have checked existing issues
- [ ] I understand this software has no warranty
- [ ] I understand the developer is not obligated to fix my issue
- [ ] I am willing to contribute a fix if possible

Bug reports and feature requests are welcome, but please be patient as this is
a volunteer project maintained by an individual developer.
```

### Auto-Response Template

Consider setting up a GitHub Action to auto-respond to new issues:

```markdown
Thank you for opening an issue! Please note that Compose Booster is free,
open-source software provided AS IS with no warranty or guaranteed support.
I'll review this when I have time, but as an individual developer, I cannot
guarantee timeline or fixes. Contributions via pull requests are always welcome!
```

---

## Section 5: Updating Copyright Year

The copyright year in LEGAL_HEADER.txt is currently set to 2025.

**Best Practice:** Update to the current year when making significant updates:
- Copyright (c) 2025 Stephen Le
- Copyright (c) 2025-2026 Stephen Le (if updated in 2026)

The Python script `add_license_headers.py` can be updated to use the current
year automatically.

---

## Section 6: Checklist Before Publishing

- [ ] LICENSE file present in repository root
- [ ] LEGAL_HEADER.txt created
- [ ] License headers added to all source files (run add_license_headers.py)
- [ ] README.md updated with License & Legal section
- [ ] GitHub repository URL updated in all files (replace placeholder)
- [ ] About dialog implemented in app
- [ ] App store description includes disclaimer
- [ ] Privacy policy created (if required by platform)
- [ ] Test build created and verified
- [ ] All third-party dependencies reviewed for license compatibility

---

**Note:** Remember to replace `https://github.com/your-username/compose-booster`
with your actual GitHub repository URL throughout these documents before publishing.
