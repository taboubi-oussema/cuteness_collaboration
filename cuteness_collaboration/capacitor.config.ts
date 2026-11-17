import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:     'tn.cuteness.collaboration',
  appName:   'Cuteness Collaboration',
  webDir:    'dist/cuteness_collaboration/browser',
  server: {
    androidScheme: 'http'
  }
};

export default config;