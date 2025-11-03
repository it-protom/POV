'use client';

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

import { 
  ChevronDown, 
  LogOut, 
  User, 
  FileText, 
  BarChart2, 
  Settings, 
  Users, 
  Home,
  MessageSquare,
  Menu,
  X,
  Plus,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Badge } from './ui/badge';
import { authenticatedFetch } from '../lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

const adminNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Forms",
    href: "/admin/forms",
    icon: FileText,
    children: [
      {
        title: "Tutti i Forms",
        href: "/admin/forms",
        icon: FileText,
      },
      {
        title: "Nuovo Form",
        href: "/admin/forms/new",
        icon: Plus,
      },
    ],
  },
  {
    title: "Risposte",
    href: "/admin/responses",
    icon: BarChart2,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: TrendingUp,
  },
  {
    title: "Utenti",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Impostazioni",
    href: "/admin/settings",
    icon: Settings,
  },
];

function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const pathname = location.pathname;
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [responsesCount, setResponsesCount] = useState<number | null>(null);

  // Auto-expand Forms if we're on a forms page
  useEffect(() => {
    if (pathname?.startsWith('/admin/forms')) {
      setExpandedItems(prev => prev.includes('/admin/forms') ? prev : [...prev, '/admin/forms']);
    }
  }, [pathname]);

  // Fetch responses count
  useEffect(() => {
    const fetchResponsesCount = async () => {
      try {
        const response = await authenticatedFetch('/api/analytics', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setResponsesCount(data.overview?.totalResponses || 0);
        }
      } catch (error) {
        console.error('Error fetching responses count:', error);
      }
    };
    
    fetchResponsesCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchResponsesCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed left-0 top-16 bottom-0 w-80 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl z-50"
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200/50">
              <div>
                <div className="text-xl font-bold text-gray-800">Admin Panel</div>
                <div className="text-sm text-gray-500">Gestione Sistema</div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-6 overflow-y-auto">
              <nav className="space-y-2">
                {adminNavigation.map((item) => (
                  <div key={item.href}>
                    {/* Main nav item */}
                    <div className="flex">
                      <Link
                        to={item.href}
                        onClick={item.children ? undefined : onClose}
                        className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 flex-1 ${
                          pathname === item.href || (item.children && pathname?.startsWith(item.href + '/'))
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="flex-1 ml-3">{item.title}</span>
                        <div className="flex items-center space-x-2">
                          {item.href === '/admin/responses' && responsesCount !== null && (
                            <Badge variant="secondary" className="h-5 px-2 text-xs bg-yellow-400 text-black font-medium">
                              {responsesCount}
                            </Badge>
                          )}
                          {item.badge && item.href !== '/admin/responses' && (
                            <Badge variant="secondary" className="h-5 px-2 text-xs bg-yellow-400 text-black font-medium">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      </Link>
                      
                      {/* Expand/collapse button for items with children */}
                      {item.children && (
                        <button
                          onClick={() => toggleExpanded(item.href)}
                          className={`ml-2 p-2 rounded-lg transition-all duration-200 ${
                            pathname === item.href || pathname?.startsWith(item.href + '/')
                              ? 'text-white hover:bg-white/20' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <motion.div
                            animate={{ rotate: expandedItems.includes(item.href) ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </motion.div>
                        </button>
                      )}
                    </div>
                    
                    {/* Sub-navigation with animation */}
                    {item.children && (
                      <AnimatePresence>
                        {expandedItems.includes(item.href) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-8 mt-2 space-y-1">
                              {item.children.map((child) => (
                                <Link
                                  key={child.href}
                                  to={child.href}
                                  onClick={onClose}
                                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                    pathname === child.href
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }`}
                                >
                                  <child.icon className="h-4 w-4 mr-2" />
                                  {child.title}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                ))}
              </nav>
            </div>
            
            {/* Quick Stats */}
            <div className="p-6 border-t border-gray-200/50">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4">
                <div className="text-sm font-semibold text-gray-800 mb-3">Quick Stats</div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Forms Attivi</span>
                    <span className="font-semibold text-gray-800">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Risposte Oggi</span>
                    <span className="font-semibold text-gray-800">47</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completamento</span>
                    <span className="font-semibold text-green-600">94%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function NavbarContent() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if we're in admin area
  const isAdminArea = pathname?.startsWith('/admin');

  // Enhanced auto-hide navbar on scroll with reappear on scroll stop
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      if (currentScrollY < 10) {
        // Always show at top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Hide when scrolling down
        setIsVisible(false);
        setDropdownOpen(false);
        setMobileMenuOpen(false);
        setAdminSidebarOpen(false);
      } else if (currentScrollY < lastScrollY) {
        // Show when scrolling up
        setIsVisible(true);
      }
      
      // Set timeout to show navbar when scrolling stops
      const newTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 150);
      
      setScrollTimeout(newTimeout);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [lastScrollY, scrollTimeout]);

  // Helper per iniziali
  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase();
  };

  // Chiudi dropdown se clicchi fuori
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const userName = user?.name || user?.email?.split('@')[0] || 'Utente';
  const userEmail = user?.email || '';
  const isAdmin = user?.role === 'ADMIN';

  // Navigation links based on user role - only show for non-admin areas
  const getNavLinks = () => {
    if (!user || isAdminArea) return [];
    
    if (isAdmin) {
      return [
        { href: '/admin/dashboard', label: 'Admin Dashboard', icon: Home },
      ];
    } else {
      return [
        { href: '/user/forms', label: 'Form Disponibili', icon: FileText },
        { href: '/user/responses', label: 'Le Mie Risposte', icon: MessageSquare },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/5"
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          background: 'rgba(255, 255, 255, 0.85)',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo + Hamburger for admin */}
            <div className="flex items-center gap-4">
              {/* Hamburger menu for admin */}
              {isAdminArea && (
                <button
                  onClick={() => setAdminSidebarOpen(!adminSidebarOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-700" />
                </button>
              )}
              
              {/* Logo */}
              <Link 
                to={user ? (isAdmin ? "/admin/dashboard" : "/user/forms") : "/"} 
                className="flex items-center gap-3 group"
              >
                <img
                  src="/logo_pov.png"
                  alt="POV Logo"
                  className="h-10 w-10 transition-transform group-hover:scale-105 object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-800 group-hover:text-[#FFCD00] transition-colors">
                    pov
                  </span>
                  <span className="text-xs text-gray-500 -mt-1">
                    by Protom Group
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - only show for non-admin areas */}
            {!isAdminArea && (
              <div className="hidden md:flex items-center space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-2 text-gray-600 hover:text-[#FFCD00] font-medium transition-colors"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {/* User menu */}
                  <div className="relative">
            <button
                      className="flex items-center gap-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
            >
                      <span className="hidden md:block font-medium text-gray-700">{userName}</span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFCD00] to-[#FFD700] flex items-center justify-center text-black font-bold text-sm shadow-md">
              {getInitials(userName)}
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

                    <AnimatePresence>
            {dropdownOpen && (
                        <motion.div
                          ref={dropdownRef}
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 py-2 overflow-hidden"
                          style={{
                            backdropFilter: 'blur(20px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                          }}
                        >
                          {/* User info */}
                          <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 aspect-square flex-shrink-0 rounded-full bg-gradient-to-br from-[#FFCD00] to-[#FFD700] flex items-center justify-center text-black font-bold">
                      {getInitials(userName)}
                              </div>
                    <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-800 truncate">{userName}</div>
                                <div className="text-sm text-gray-500 truncate">{userEmail}</div>
                                {isAdmin && (
                                  <div className="text-xs text-blue-600 font-medium">Amministratore</div>
                                )}
                    </div>
                  </div>
                </div>

                          {/* Menu items */}
                          <div className="py-2">
                            <a
                              href="https://myaccount.microsoft.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setDropdownOpen(false)}
                            >
                              <User className="w-4 h-4" />
                              Profilo
                            </a>
                            
                            {isAdmin && (
                              <Link
                                to="/admin/dashboard"
                                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => setDropdownOpen(false)}
                              >
                                <Settings className="w-4 h-4" />
                                Pannello Admin
                              </Link>
                            )}
                            
                            <button
                              onClick={async () => {
                                setDropdownOpen(false);
                                await logout();
                              }}
                              className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                            >
                              <LogOut className="w-4 h-4" />
                              Logout
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => signIn()}
                    className="px-4 py-2 text-gray-700 hover:text-[#FFCD00] font-medium transition-colors"
                  >
                    Accedi
                  </button>
                </div>
              )}

              {/* Mobile menu button - only show for non-admin areas */}
              {!isAdminArea && (
                <button
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
              </div>
          </div>

          {/* Mobile menu - only show for non-admin areas */}
          {!isAdminArea && (
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="md:hidden border-t border-gray-200 py-4"
                >
                  <div className="space-y-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        )}
      </div>
      </motion.nav>

      {/* Admin Sidebar */}
      {isAdminArea && (
        <AdminSidebar 
          isOpen={adminSidebarOpen} 
          onClose={() => setAdminSidebarOpen(false)} 
        />
      )}
    </>
  );
}

export default function Navbar() {
  return <NavbarContent />;
} 
