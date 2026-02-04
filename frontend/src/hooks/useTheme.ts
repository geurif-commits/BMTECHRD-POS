import { useStore } from '../stores/useStore';
import { useMemo } from 'react';

export function useTheme() {
  const business = useStore((s) => s.business);

  const theme = useMemo(() => ({
    primaryColor: business?.primaryColor || '#2563eb',
    secondaryColor: business?.secondaryColor || '#1e40af',
    accentColor: business?.accentColor || '#0ea5e9',
    logoUrl: business?.logoUrl,
    businessName: business?.name || 'BMTECHRD',
  }), [business?.primaryColor, business?.secondaryColor, business?.accentColor, business?.logoUrl, business?.name]);

  return theme;
}
