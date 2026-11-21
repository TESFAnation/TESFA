// A stable browser destination is also used for email links opened from the APK.
// Add this URL under Supabase Authentication > URL Configuration > Redirect URLs.
export const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL || 'https://tesfa-app-zeta.vercel.app').replace(/\/$/, '');

export function authRedirect(path: '/auth' | '/reset-password') {
  return siteUrl + path;
}
