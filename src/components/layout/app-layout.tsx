// Main application layout with responsive navigation

'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  BookOpen, 
  Trophy, 
  User, 
  Menu, 
  X,
  TrendingUp,
  Wallet,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser, useLogout } from '@/lib/hooks/use-api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  current?: boolean;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();
  const logout = useLogout();

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Trading', href: '/trade', icon: TrendingUp },
    { name: 'Portfolio', href: '/portfolio', icon: Wallet },
    { name: 'Education', href: '/education', icon: BookOpen },
    { name: 'Achievements', href: '/achievements', icon: Trophy },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  // Update current state based on pathname
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: pathname === item.href
  }));

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (userError || !currentUser?.success) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Authentication Required</h1>
          <p className="mt-2 text-gray-600">Please log in to access the trading game.</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 flex z-40 md:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <MobileSidebar navigation={updatedNavigation} user={currentUser.user} onLogout={handleLogout} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <DesktopSidebar navigation={updatedNavigation} user={currentUser.user} onLogout={handleLogout} />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

// Mobile sidebar component
function MobileSidebar({ navigation, user, onLogout }: {
  navigation: NavigationItem[];
  user: any;
  onLogout: () => void;
}) {
  return (
    <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
      <div className="flex-shrink-0 flex items-center px-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Bitcoin Game</h1>
          </div>
        </div>
      </div>
      
      <nav className="mt-8 flex-1 px-2 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              item.current
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
            )}
          >
            <item.icon
              className={cn(
                item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                'mr-3 h-5 w-5'
              )}
            />
            {item.name}
          </Link>
        ))}
      </nav>

      <UserProfile user={user} onLogout={onLogout} isMobile={true} />
    </div>
  );
}

// Desktop sidebar component  
function DesktopSidebar({ navigation, user, onLogout }: {
  navigation: NavigationItem[];
  user: any;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">Bitcoin Game</h1>
            </div>
          </div>
        </div>
        
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                item.current
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
              )}
            >
              <item.icon
                className={cn(
                  item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                  'mr-3 h-5 w-5'
                )}
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <UserProfile user={user} onLogout={onLogout} isMobile={false} />
    </div>
  );
}

// User profile section
function UserProfile({ user, onLogout, isMobile }: {
  user: any;
  onLogout: () => void;
  isMobile: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
      <div className="flex items-center w-full">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.username}
          </p>
          <p className="text-xs text-gray-500 truncate">
            Level {user.gameLevel} • {user.experience} XP
          </p>
        </div>
        
        <div className="relative">
          <button
            type="button"
            className="flex-shrink-0 bg-white rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowMenu(!showMenu)}
          >
            <Settings className="h-5 w-5" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowMenu(false)}
              >
                <Settings className="inline h-4 w-4 mr-2" />
                Settings
              </Link>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onLogout();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="inline h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}