import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Centro de acopio Plaza O`leary',
  description: 'Inventario y donaciones solidarias para comunidades.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
