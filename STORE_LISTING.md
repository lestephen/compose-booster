# Store Listing Information

This document contains the app store listing information for Compose Booster submissions to Microsoft Store and Mac App Store.

---

## App Name

Compose Booster

## Short Description (Promotional Text)

AI-powered email assistant - improve, polish, and customize your emails with advanced AI models

## Description

Transform your email writing with Compose Booster, an intelligent desktop assistant that helps you craft professional, polished emails in seconds.

**Key Features:**

- **Multiple AI Models** - Choose from leading AI models including Claude, GPT-4, Gemini, and more through OpenRouter
- **Quick Actions** - One-click buttons for common tasks: Improve, Make Professional, or Make Concise
- **Custom Prompts** - Create and save your own writing prompts for repeated use
- **Tone Control** - Adjust the tone of your emails from formal to friendly, assertive to empathetic
- **Light & Dark Themes** - Comfortable writing experience in any lighting condition
- **Privacy-Focused** - Your API key is encrypted locally; emails are only sent to your chosen AI provider

**How It Works:**

1. Paste your email draft
2. Select an AI model, prompt, and tone
3. Click a quick action or "Boost" button
4. Copy the improved result

**Requirements:**

- OpenRouter API key (free to sign up at openrouter.ai)
- Pay only for what you use - typically fractions of a cent per email

Perfect for professionals, customer service teams, and anyone who wants to communicate more effectively.

## Keywords (Mac App Store - 100 character limit)

email,writing,AI,assistant,compose,professional,productivity,GPT,Claude,editor

## What's New (Version 1.0.1)

Initial release of Compose Booster for macOS.

- Multiple AI model support via OpenRouter
- Quick action buttons for common email improvements
- Custom prompts and tones
- Light and dark theme support
- Encrypted API key storage

## Category

- **Primary:** Productivity
- **Secondary:** Business

## Age Rating

- **Rating:** 4+ (Mac App Store) / Everyone (Microsoft Store)
- **No objectionable content**

## Support Information

- **Support URL:** https://github.com/lestephen/compose-booster/issues
- **Marketing URL:** https://github.com/lestephen/compose-booster
- **Privacy Policy URL:** https://github.com/lestephen/compose-booster/blob/master/PRIVACY.md

## Copyright

© 2025 Stephen Le

## Screenshots Required

### Mac App Store

| Size | Description |
|------|-------------|
| 1280 x 800 | Required for all Mac apps |
| 1440 x 900 | Required for all Mac apps |
| 2560 x 1600 | Required for Retina displays |
| 2880 x 1800 | Required for Retina displays |

### Microsoft Store

| Size | Description |
|------|-------------|
| 1366 x 768 | Desktop screenshot |
| 2560 x 1440 | Optional high-res |

## Screenshot Suggestions

1. **Main window - Light theme** - Show the app with sample email text and output
2. **Main window - Dark theme** - Same view in dark mode
3. **Settings - Models tab** - Show AI model selection
4. **Settings - Quick Actions** - Show customization options
5. **Processing state** - Show the app actively improving an email

---

## Store-Specific Notes

### Mac App Store

- App uses App Sandbox
- Requires network access for API calls
- No in-app purchases
- Free app (users pay for API usage separately via OpenRouter)

### Microsoft Store

- MSIX package format
- No special capabilities required beyond internet access
- Free app

---

## Review Notes (For App Store Reviewers)

To test this app, you will need an OpenRouter API key:

1. Sign up for free at https://openrouter.ai
2. Create an API key in your dashboard
3. Enter the API key in the app's Settings > API tab
4. Add credits to your OpenRouter account (minimum $5)

The app sends email text to the selected AI model via OpenRouter's API and returns the improved version. No data is stored on external servers beyond what's required for the API call.
