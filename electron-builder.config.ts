import type { Configuration } from 'electron-builder'

const config: Configuration = {
  appId: 'com.churchlights.app',
  productName: 'Church Lights',
  directories: {
    output: 'dist-electron',
  },
  mac: {
    category: 'public.app-category.utilities',
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    icon: 'resources/icon.icns',
  },
  files: [
    'out/**/*',
  ],
  extraResources: [],
}

export default config
