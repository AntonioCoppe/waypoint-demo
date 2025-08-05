import '../styles/globals.css';

export const metadata = { title: 'Waypoint Demo' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="h-screen w-screen">
        {children}
      </body>
    </html>
  );
}
