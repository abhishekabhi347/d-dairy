import { type PropsWithChildren } from 'react';

import { AppProvider, useApp } from '@/context/AppProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';

function Ready({ children }: PropsWithChildren) {
  const { status } = useApp();
  return status === 'ready' ? <>{children}</> : null;
}

export function TestProviders({ children }: PropsWithChildren) {
  return (
    <AppProvider>
      <ThemeProvider>
        <Ready>{children}</Ready>
      </ThemeProvider>
    </AppProvider>
  );
}
