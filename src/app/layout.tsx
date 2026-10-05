import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'HostelDesk - Hostel Complaint & Operations Portal',
  description: 'Operational workspace for campus residents, wardens, office staff, and admins.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-container">
            <Sidebar />
            <div className="main-wrapper">
              <Navbar />
              <main className="page-content">{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
