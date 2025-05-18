import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-amber-50 dark:bg-gray-900 font-mono">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="py-4 px-6 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-800">
        <p>© {new Date().getFullYear()} Crate Music Discovery</p>
      </footer>
    </div>
  );
};

export default Layout;
