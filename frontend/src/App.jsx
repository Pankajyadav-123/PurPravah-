import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import PasswordAuthPage from '@/components/auth-page';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getGetProfileQueryKey, useAuthLogout, useGetProfile, useGetSession, useGetSetupStatus } from '@/lib/api-client-react';
import { queryClient } from '@/lib/query-client';
import { AppShell, LoadingPage } from '@/components/app-shared';
import { AuthPrompt, NotFoundPage, ProfileGate, ProfileSetupError, RoleRedirect, ServicesUnavailableGate } from '@/components/route-gates';
import { Landing } from '@/pages/landing';
import { CitizenDashboard } from '@/pages/citizen-dashboard';
import { NewComplaint } from '@/pages/new-complaint';
import { ComplaintDetail } from '@/pages/complaint-detail';
import { DepartmentWork } from '@/pages/department';
import { AdminWorkspace } from '@/pages/admin';
import { NotificationsPage } from '@/pages/notifications';
import { ProfilePage } from '@/pages/profile';
import { AboutPage } from '@/pages/about';
import { ContactPage } from '@/pages/contact';
import { PublicDashboardPage } from '@/pages/public-dashboard';
import { ScrollAnimations } from '@/components/scroll-animations';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
function AuthPage({
  mode
}) {
  return _jsx(PasswordAuthPage, {
    mode
  });
}
function RoutedApp() {
  const [location, navigate] = useLocation();
  const session = useGetSession({
    query: {
      retry: false
    }
  });
  const isSignedIn = session.data?.authenticated === true;
  const sessionLoading = session.isLoading;
  const logout = useAuthLogout();
  const setup = useGetSetupStatus();
  const profileQuery = useGetProfile({
    query: {
      enabled: !!isSignedIn && setup.data?.ready === true,
      queryKey: getGetProfileQueryKey(),
      retry: false
    }
  });
  const profile = profileQuery.data;
  const signOut = async () => {
    await logout.mutateAsync();
    queryClient.clear();
    navigate('/');
  };
  const protectedPage = (node, roles) => {
    if (sessionLoading) return _jsx(LoadingPage, {});
    if (session.isError) return _jsx(ProfileSetupError, {
      retry: () => session.refetch()
    });
    if (!isSignedIn) return _jsx(AuthPrompt, {
      returnTo: location
    });
    if (setup.isLoading) return _jsx(LoadingPage, {});
    if (!setup.data?.ready) return _jsx(ServicesUnavailableGate, {
      onSignOut: signOut
    });
    if (profileQuery.isLoading) return _jsx(LoadingPage, {});
    if (profileQuery.isError || !profile) return _jsx(ProfileSetupError, {
      retry: () => profileQuery.refetch()
    });
    if (profile.role === 'citizen' && (!profile.name || !profile.phone) && location !== '/profile') return _jsx(ProfileGate, {
      returnTo: location
    });
    if (roles && profile.role && !roles.includes(profile.role)) return _jsx(RoleRedirect, {
      role: profile.role
    });
    return _jsx(AppShell, {
      profile: profile,
      onSignOut: signOut,
      children: node
    });
  };
  return _jsx(ErrorBoundary, {
    resetKey: typeof window !== 'undefined' ? window.location.pathname : '',
    children: _jsxs(Switch, {
      children: [_jsx(Route, {
        path: "/",
        children: () => {
          if (!isSignedIn) return _jsx(Landing, {
            signedIn: false
          });
          return _jsx(Landing, {
            signedIn: true,
            profile: profile
          });
        }
      }), _jsx(Route, {
        path: "/about",
        children: () => _jsx(AboutPage, {
          signedIn: isSignedIn,
          profile: profile
        })
      }), _jsx(Route, {
        path: "/contact",
        children: () => _jsx(ContactPage, {
          signedIn: isSignedIn,
          profile: profile
        })
      }), _jsx(Route, {
        path: "/public-dashboard",
        children: () => _jsx(PublicDashboardPage, {
          signedIn: isSignedIn,
          profile: profile
        })
      }), _jsx(Route, {
        path: "/sign-in/*?",
        children: () => _jsx(AuthPage, {
          mode: "sign-in"
        })
      }), _jsx(Route, {
        path: "/sign-up/*?",
        children: () => _jsx(AuthPage, {
          mode: "sign-up"
        })
      }), _jsx(Route, {
        path: "/citizen",
        children: () => protectedPage(_jsx(CitizenDashboard, {
          profile: profile
        }), ['citizen'])
      }), _jsx(Route, {
        path: "/complaints/new",
        children: () => protectedPage(_jsx(NewComplaint, {}), ['citizen'])
      }), _jsx(Route, {
        path: "/complaints/:id",
        children: () => protectedPage(_jsx(ComplaintDetail, {}))
      }), _jsx(Route, {
        path: "/department",
        children: () => protectedPage(_jsx(DepartmentWork, {
          profile: profile
        }), ['department_staff'])
      }), _jsx(Route, {
        path: "/admin",
        children: () => protectedPage(_jsx(AdminWorkspace, {}), ['admin'])
      }), _jsx(Route, {
        path: "/notifications",
        children: () => protectedPage(_jsx(NotificationsPage, {}))
      }), _jsx(Route, {
        path: "/profile",
        children: () => protectedPage(_jsx(ProfilePage, {
          profile: profile
        }))
      }), _jsx(Route, {
        component: NotFoundPage
      })]
    })
  });
}
function App() {
  const content = _jsx(RoutedApp, {});
  return _jsx(QueryClientProvider, {
    client: queryClient,
    children: _jsx(TooltipProvider, {
      children: _jsx(WouterRouter, {
        base: import.meta.env.BASE_URL.replace(/\/$/, ''),
        children: _jsxs(_Fragment, {
          children: [_jsx(ScrollAnimations, { children: content }), _jsx(Toaster, {})]
        })
      })
    })
  });
}
export default App;
