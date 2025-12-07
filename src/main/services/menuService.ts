// Menu Service
// Creates and manages the application menu

import { Menu, app, shell } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';

export function createApplicationMenu(onOpenSettings: () => void): Menu {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    // App Menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              {
                label: 'Settings',
                accelerator: 'Cmd+,',
                click: onOpenSettings,
              },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        ...(!isMac
          ? [
              {
                label: 'Settings',
                accelerator: 'Ctrl+,',
                click: onOpenSettings,
              },
              { type: 'separator' as const },
            ]
          : []),
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
        { type: 'separator' as const },
        {
          label: 'Clear Input',
          accelerator: isMac ? 'Cmd+K' : 'Ctrl+K',
          registerAccelerator: false, // Handled by renderer
        },
        {
          label: 'Clear Output',
          accelerator: isMac ? 'Cmd+Shift+K' : 'Ctrl+Shift+K',
          registerAccelerator: false, // Handled by renderer
        },
      ],
    },

    // Process Menu
    {
      label: 'Process',
      submenu: [
        {
          label: 'Process Email',
          accelerator: isMac ? 'Cmd+Enter' : 'Ctrl+Enter',
          registerAccelerator: false, // Handled by renderer
        },
        { type: 'separator' as const },
        {
          label: 'Quick Polish',
          accelerator: isMac ? 'Cmd+1' : 'Ctrl+1',
          registerAccelerator: false, // Handled by renderer
        },
        {
          label: 'Professional',
          accelerator: isMac ? 'Cmd+2' : 'Ctrl+2',
          registerAccelerator: false, // Handled by renderer
        },
        {
          label: 'Friendly',
          accelerator: isMac ? 'Cmd+3' : 'Ctrl+3',
          registerAccelerator: false, // Handled by renderer
        },
        { type: 'separator' as const },
        {
          label: 'Cancel',
          accelerator: 'Esc',
          registerAccelerator: false, // Handled by renderer
        },
      ],
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
      ],
    },

    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },

    // Help Menu
    {
      role: 'help' as const,
      submenu: [
        {
          label: 'OpenRouter Documentation',
          click: async () => {
            await shell.openExternal('https://openrouter.ai/docs');
          },
        },
        {
          label: 'GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com');
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}
