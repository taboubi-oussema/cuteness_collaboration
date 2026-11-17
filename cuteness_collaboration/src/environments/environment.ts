export const environment = {
  production: false,
  apiUrl: (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.())
    ? 'http://10.0.2.2:8081/api'
    : 'http://localhost:8081/api',
};
