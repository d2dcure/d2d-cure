import React, { ReactNode } from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import LoadingSpinner from './LoadingSpinner';

interface LayoutProps {
  children: ReactNode;
  loading?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, loading = false }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        {children}
        <LoadingSpinner isOpen={loading} />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
