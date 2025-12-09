// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2025 Stephen Le

// Help Link Constants
// URLs to documentation sections for in-app help buttons

const BASE_URL = 'https://github.com/lestephen/compose-booster/blob/master/USER_GUIDE.md';

/**
 * Help documentation links mapped to sections in USER_GUIDE.md
 */
export const HELP_LINKS = {
  // Main sections
  GETTING_STARTED: `${BASE_URL}#getting-started`,
  MAIN_INTERFACE: `${BASE_URL}#main-interface`,
  QUICK_ACTIONS: `${BASE_URL}#quick-actions`,
  CUSTOM_PROCESSING: `${BASE_URL}#custom-processing`,
  STYLE_PROFILES: `${BASE_URL}#style-profiles`,
  RESPONSE_REGENERATION: `${BASE_URL}#response-regeneration`,
  OUTPUT_FORMAT: `${BASE_URL}#output-format-options`,
  CONTEXT_WARNINGS: `${BASE_URL}#context-window-warnings`,
  KEYBOARD_SHORTCUTS: `${BASE_URL}#keyboard-shortcuts`,
  TROUBLESHOOTING: `${BASE_URL}#troubleshooting-guide`,

  // Settings sections
  SETTINGS: `${BASE_URL}#settings`,
  SETTINGS_GENERAL: `${BASE_URL}#general-settings`,
  SETTINGS_MODELS: `${BASE_URL}#models-tab`,
  SETTINGS_PROMPTS: `${BASE_URL}#prompts-tab`,
  SETTINGS_TONES: `${BASE_URL}#tones-tab`,
  SETTINGS_STYLES: `${BASE_URL}#styles-tab`,
  SETTINGS_QUICK_ACTIONS: `${BASE_URL}#quick-actions-tab`,
  SETTINGS_ADVANCED: `${BASE_URL}#advanced-tab`,

  // Subsections
  API_KEY: `${BASE_URL}#setting-up-your-api-key`,
  SELECTING_MODEL: `${BASE_URL}#selecting-a-model`,
  CHOOSING_PROMPT: `${BASE_URL}#choosing-a-prompt`,
  SETTING_TONE: `${BASE_URL}#setting-the-tone`,
  CREATING_STYLE: `${BASE_URL}#creating-a-style-profile`,
  BEST_PRACTICES_SAMPLES: `${BASE_URL}#best-practices-for-samples`,
  REDUCING_TOKEN_USAGE: `${BASE_URL}#reducing-token-usage`,
} as const;

export type HelpLinkKey = keyof typeof HELP_LINKS;
