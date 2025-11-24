import type { Metadata } from 'next';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { Header } from '@/components/organisms/Header';
import { UserProvider } from '@/lib/context';
import { I18nProvider } from '@/lib/i18n';
import { OnboardingHandler } from '@/components/organisms/OnboardingHandler';
import theme from '@/lib/theme';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: 'EduForge - Task Creator',
  description: 'Create educational tasks based on curriculum topics',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <UserProvider>
              <I18nProvider>
                <CssBaseline />
                <OnboardingHandler />
                <Header />
                <main>{children}</main>
              </I18nProvider>
            </UserProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
