/**
 * Detects if the current browser is an in-app browser (Instagram, Facebook, etc.)
 */
export const isInAppBrowser = (): boolean => {
  const ua = navigator.userAgent || (navigator as any).vendor || '';
  return /Instagram|FBAN|FBAV|Twitter|LinkedInApp|Snapchat|musical_ly|BytedanceWebview|Line\//i.test(ua);
};

/**
 * Returns the name of the in-app browser if detected
 */
export const getInAppBrowserName = (): string => {
  const ua = navigator.userAgent || (navigator as any).vendor || '';
  
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV/i.test(ua)) return 'Facebook';
  if (/Twitter/i.test(ua)) return 'X (Twitter)';
  if (/LinkedInApp/i.test(ua)) return 'LinkedIn';
  if (/Snapchat/i.test(ua)) return 'Snapchat';
  if (/musical_ly|BytedanceWebview/i.test(ua)) return 'TikTok';
  if (/Line\//i.test(ua)) return 'LINE';
  
  return 'this app';
};

/**
 * Detects if the device is iOS
 */
export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};
