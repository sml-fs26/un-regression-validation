/*
 * Storybook preview config — globals, decorators, viewports.
 *
 * The three viewport presets below match DESIGN.md §Test discipline
 * line 106: "Visual regression: Playwright snapshots at 1x, 2x, and
 * 480px for every adopted signature frame." Story writers pick one
 * viewport per story by tagging `parameters.viewport`.
 */

import type { Preview } from '@storybook/svelte';

// The project's design tokens and type utility classes — load once so
// every story inherits the exact same CSS variables the production
// pages use.
import '../src/lib/styles/tokens.css';
import '../src/lib/styles/typography.css';
import '../src/lib/styles/role-palette.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    backgrounds: {
      default: 'cream',
      values: [
        { name: 'cream', value: '#F5F1E8' },
        { name: 'indigo', value: '#1A1A2E' }
      ]
    },
    viewport: {
      // Three named viewports; Playwright selects these by story parameter.
      viewports: {
        desktop1x: {
          name: 'Desktop 1x (1280x800)',
          styles: { width: '1280px', height: '800px' },
          type: 'desktop'
        },
        desktop2x: {
          name: 'Desktop 2x (2560x1600 @ dpr=2)',
          styles: { width: '1280px', height: '800px' },
          type: 'desktop'
        },
        mobile480: {
          name: 'Mobile 480px',
          styles: { width: '480px', height: '720px' },
          type: 'mobile'
        }
      },
      defaultViewport: 'desktop1x'
    }
  }
};

export default preview;
