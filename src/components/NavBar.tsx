import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/UserProvider';
import { Avatar } from 'flowbite-react'; // Import Flowbite components
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useRouter } from 'next/router';
import { 
  Database, 
  Upload, 
  ClipboardEdit,
  FileText, 
  Search, 
  BookOpen,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';

const NavBar = () => {
  const { user, setUser } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const router = useRouter();

  // Add new state for nested dropdowns
  const [activeNestedDropdown, setActiveNestedDropdown] = useState<string | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setActiveDropdown(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      // Navigate directly to home page with the logout parameter
      router.push({
        pathname: '/',
        query: { justLoggedOut: 'true' }
      });
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  // Helper function to determine if a link is active
  const isActiveLink = (href: string) => {
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  // Add delay for dropdown closing
  const closeTimeout = useRef<NodeJS.Timeout>();
  
  const handleDropdownEnter = (dropdown: string) => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }
    setActiveDropdown(dropdown);
  };

  const handleDropdownLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 100); // 100ms delay before closing
  };

  // Add handlers for nested dropdowns
  const handleNestedDropdownEnter = (dropdown: string) => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
    }
    setActiveNestedDropdown(dropdown);
  };

  const handleNestedDropdownLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setActiveNestedDropdown(null);
    }, 100);
  };

  // Update the Database dropdown section with nested items
  const databaseDropdownContent = (
    <div className="p-1">
      <div
        className="relative"
        onMouseEnter={() => handleNestedDropdownEnter('characterization')}
        onMouseLeave={handleNestedDropdownLeave}
      >
        <Link 
          href="/database/BglB_characterization"
          className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-[#06B7DB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 gap-2"
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 stroke-[1.5]" />
            <span>BglB Characterization</span>
          </div>
        </Link>

        {/* Nested Dropdown */}
        
      </div>

      {/* Submit Data with nested dropdown */}
      {user?.status && (
        <div
          className="relative"
          onMouseEnter={() => handleNestedDropdownEnter('submit')}
          onMouseLeave={handleNestedDropdownLeave}
        >
          <Link 
            href="/submit"
            className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-[#06B7DB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 gap-2"
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 stroke-[1.5]" />
              <span>Analyze/Submit Data</span>
            </div>
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </Link>

          <div
            className={`absolute left-full top-0 w-56 ml-0.5 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 transform origin-top-left ${
              activeNestedDropdown === 'submit'
                ? 'opacity-100 scale-100 translate-x-0'
                : 'opacity-0 scale-95 -translate-x-2 pointer-events-none'
            }`}
          >
            <div className="p-1">
              <Link 
                href="/submit"
                className="flex items-center w-full px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-[#06B7DB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 gap-2"
              >
                <span>Single Variant</span>
              </Link>
              <Link 
                href="/submit"
                className="flex items-center w-full px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-[#06B7DB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 gap-2"
              >
                <span>Wildtype</span>
              </Link>
              <Link 
                href="/submit/gel_image_upload"
                className="flex items-center w-full px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-[#06B7DB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 gap-2"
              >
                <span>Gel Image</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Keep the existing Curate Data link */}
      {(user?.status === "professor" || user?.status === "ADMIN") && (
        <Link 
          href="/curate" 
          className="flex items-center w-full px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-[#06B7DB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 gap-2"
        >
          <ClipboardEdit className="w-4 h-4 stroke-[1.5]" />
          <span>Curate Data</span>
        </Link>
      )}
    </div>
  );

  return (
    <nav ref={navRef} className="bg-white py-4 border-b border-gray-200 dark:bg-gray-900 relative z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left side: Logo and Navigation links */}
          <div className="flex items-center space-x-8 w-full">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <img src="/resources/images/D2D_Logo.svg" className="h-12" alt="D2D Logo" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 ml-8">
              {user && (
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActiveLink('/dashboard')
                      ? 'text-[#06B7DB] bg-gray-100 dark:bg-gray-800'
                      : 'text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800'
                  }`}
                >
                  Dashboard
                </Link>
              )}
              {/* Database Dropdown - Updated with box hover and clickable link */}
              <div 
                className="relative group"
                onMouseEnter={() => handleDropdownEnter('database')}
                onMouseLeave={handleDropdownLeave}
              >
                <Link
                  href="/database"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActiveLink('/database')
                      ? 'text-[#06B7DB] bg-gray-100 dark:bg-gray-800'
                      : 'text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800'
                  }`}
                >
                  <span>Database</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeDropdown === 'database' ? 'rotate-180' : ''
                    }`}
                  />
                </Link>

                <div
                  className={`absolute top-full left-0 w-56 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 transform origin-top-left z-50 ${
                    activeDropdown === 'database'
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}
                >
                  {databaseDropdownContent}
                </div>
              </div>

              {/* Resources Dropdown - Updated with box hover and clickable link */}
              <div 
                className="relative group"
                onMouseEnter={() => handleDropdownEnter('resources')}
                onMouseLeave={handleDropdownLeave}
              >
                <Link
                  href="/resources"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActiveLink('/resources')
                      ? 'text-[#06B7DB] bg-gray-100 dark:bg-gray-800'
                      : 'text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800'
                  }`}
                >
                  <span>Resources</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeDropdown === 'resources' ? 'rotate-180' : ''
                    }`}
                  />
                </Link>

                <div
                  className={`absolute top-full left-0 w-56 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 transform origin-top-left z-50 ${
                    activeDropdown === 'resources'
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}
                >
                  <div className="p-1">
                    <Link 
                      href="/resources/StructuredFiles" 
                      className="flex items-center w-full px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-[#06B7DB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 gap-2"
                    >
                      <FileText className="w-4 h-4 stroke-[1.5]" />
                      <span>Structured Files</span>
                    </Link>
                    <Link 
                      href="/resources/oligosearch" 
                      className="flex items-center w-full px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-[#06B7DB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 gap-2"
                    >
                      <Search className="w-4 h-4 stroke-[1.5]" />
                      <span>Oligo Search</span>
                    </Link>
                    <Link 
                      href="/resources/publications" 
                      className="flex items-center w-full px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-[#06B7DB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 gap-2"
                    >
                      <BookOpen className="w-4 h-4 stroke-[1.5]" />
                      <span>Publications</span>
                    </Link>
                  </div>
                </div>
              </div>

              <Link
                href="/about"
                className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActiveLink('/about')
                    ? 'text-[#06B7DB] bg-gray-100 dark:bg-gray-800'
                    : 'text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800'
                }`}
              >
                About
              </Link>
              <Link
                href="/contact"
                className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActiveLink('/contact')
                    ? 'text-[#06B7DB] bg-gray-100 dark:bg-gray-800'
                    : 'text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800'
                }`}
              >
                Contact us
              </Link>
            </div>
          </div>

          {/* Right Side - Profile or Login */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div 
                className="relative group"
                onMouseEnter={() => handleDropdownEnter('user')}
                onMouseLeave={handleDropdownLeave}
              >
                <div className="p-1 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <Avatar
                    alt="User profile"
                    img={user.profilePic || undefined}
                    rounded={true}
                    className="w-10 h-10"
                  />
                </div>

                <div
                  className={`absolute top-full right-0 w-56 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 transform origin-top-right z-50 ${
                    activeDropdown === 'user'
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}
                >
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link 
                      href="/user-settings" 
                      className="flex items-center w-full px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:text-[#06B7DB] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 gap-2"
                    >
                      <Settings className="w-4 h-4 stroke-[1.5]" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2 text-sm rounded-md text-red-600/80 dark:text-red-400/80 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 gap-2"
                    >
                      <LogOut className="w-4 h-4 stroke-[1.5]" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 font-semibold bg-[#06B7DB] text-white rounded-lg hover:bg-[#05a5c6] transition-colors duration-200"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
        >
          <div className="pt-2 pb-4 space-y-1">
            {/* Add Dashboard link for mobile */}
            {user && (
              <Link
                href="/dashboard"
                className={`block px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isActiveLink('/dashboard')
                    ? 'text-[#06B7DB] bg-gray-100 dark:bg-gray-800'
                    : 'text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800'
                }`}
              >
                Dashboard
              </Link>
            )}

            {/* Mobile Database Dropdown */}
            <div>
              <button
                onClick={() => setActiveDropdown('mobile-database')}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isActiveLink('/database') || isActiveLink('/submit') || isActiveLink('/curate')
                    ? 'text-[#06B7DB] bg-gray-100 dark:bg-gray-800'
                    : 'text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>Database</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'mobile-database' ? 'rotate-180' : ''}`} />
              </button>

              <div className={`transition-all duration-200 ${activeDropdown === 'mobile-database' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <Link 
                  href="/database/BglB_characterization" 
                  className="flex items-center gap-2 px-8 py-2 text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                >
                  <Database className="w-4 h-4 stroke-[1.5]" />
                  <span>BglB Characterization</span>
                </Link>
                {user?.status && (
                  <Link 
                    href="/submit" 
                    className="flex items-center gap-2 px-8 py-2 text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                  >
                    <Upload className="w-4 h-4 stroke-[1.5]" />
                    <span>Analyze/Submit Data</span>
                  </Link>
                )}
                {(user?.status === "professor" || user?.status === "ADMIN") && (
                  <Link 
                    href="/curate" 
                    className="flex items-center gap-2 px-8 py-2 text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                  >
                    <ClipboardEdit className="w-4 h-4 stroke-[1.5]" />
                    <span>Curate Data</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Resources Dropdown */}
            <div>
              <button
                onClick={() => setActiveDropdown('mobile-resources')}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isActiveLink('/resources')
                    ? 'text-[#06B7DB] bg-gray-100 dark:bg-gray-800'
                    : 'text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>Resources</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'mobile-resources' ? 'rotate-180' : ''}`} />
              </button>

              <div className={`transition-all duration-200 ${activeDropdown === 'mobile-resources' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <Link 
                  href="/resources/StructuredFiles" 
                  className="flex items-center gap-2 px-8 py-2 text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                >
                  <FileText className="w-4 h-4 stroke-[1.5]" />
                  <span>Structured Files</span>
                </Link>
                <Link 
                  href="/resources/oligosearch" 
                  className="flex items-center gap-2 px-8 py-2 text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                >
                  <Search className="w-4 h-4 stroke-[1.5]" />
                  <span>Oligo Search</span>
                </Link>
                <Link 
                  href="/resources/publications" 
                  className="flex items-center gap-2 px-8 py-2 text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800"
                >
                  <BookOpen className="w-4 h-4 stroke-[1.5]" />
                  <span>Publications</span>
                </Link>
              </div>
            </div>

            {/* Mobile About and Contact links - without icons */}
            <Link
              href="/about"
              className={`block px-4 py-2 rounded-lg transition-colors duration-200 ${
                isActiveLink('/about')
                  ? 'text-[#06B7DB] bg-gray-100 dark:bg-gray-800'
                  : 'text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800'
              }`}
            >
              About
            </Link>
            <Link
              href="/contact"
              className={`block px-4 py-2 rounded-lg transition-colors duration-200 ${
                isActiveLink('/contact')
                  ? 'text-[#06B7DB] bg-gray-100 dark:bg-gray-800'
                  : 'text-gray-900 hover:text-[#06B7DB] hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800'
              }`}
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
