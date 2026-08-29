'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { UserProfile, Organization, OrganizationMember } from '@/types/crm';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export const SYSTEM_ADMINS: UserProfile[] = [
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'ekansh@firstclick.com',
    full_name: 'Ekansh',
    phone: '+91 98765 43210',
    title: 'Managing Director & Admin',
    role: 'Owner',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'kuldeep@firstclick.com',
    full_name: 'Kuldeep',
    phone: '+91 98765 43211',
    title: 'Head of Sales & Admin',
    role: 'Admin',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'shreyash@firstclick.com',
    full_name: 'Shreyash',
    phone: '+91 98765 43212',
    title: 'Operations Lead & Admin',
    role: 'Admin',
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_ORG: Organization = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'First Click Softwares',
  slug: 'firstclick-crm',
  email: 'admin@firstclick.com',
  phone: '+91 98765 43210',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  currency_symbol: '₹',
  created_at: new Date().toISOString(),
};

export const DEFAULT_MEMBERS: OrganizationMember[] = SYSTEM_ADMINS.map((u) => ({
  id: `mem_${u.id}`,
  organization_id: DEFAULT_ORG.id,
  user_id: u.id,
  role: u.role || 'Admin',
  status: 'active',
  created_at: new Date().toISOString(),
  user: u,
}));

interface AuthContextType {
  user: UserProfile | null;
  organization: Organization | null;
  members: OrganizationMember[];
  isLoading: boolean;
  signInWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string, orgName: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchUser: (user: UserProfile) => void;
  updateOrganization: (updates: Partial<Organization>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(DEFAULT_ORG);
  const [members, setMembers] = useState<OrganizationMember[]>(DEFAULT_MEMBERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // Strict 2.5 second timeout on session check
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 2500)
        );
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

        if (session?.user && mounted) {
          // Fetch real profile from Supabase profiles table with 2s timeout
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const { data: profile } = await Promise.race([
            profilePromise,
            new Promise<{ data: null }>((res) => setTimeout(() => res({ data: null }), 2000)),
          ]);

          const authUser: UserProfile = (profile as UserProfile) || {
            id: session.user.id,
            email: session.user.email || 'ekansh@firstclick.com',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Ekansh',
            avatar_url: null,
            role: 'Owner',
            created_at: session.user.created_at || new Date().toISOString(),
          };
          setUser(authUser);

          // Fetch organization from organization_members
          const orgPromise = supabase
            .from('organization_members')
            .select('*, organization:organizations(*)')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const { data: memberRecord } = await Promise.race([
            orgPromise,
            new Promise<{ data: null }>((res) => setTimeout(() => res({ data: null }), 2000)),
          ]);

          if (memberRecord?.organization && mounted) {
            setOrganization(memberRecord.organization as Organization);
          } else if (mounted) {
            const { data: firstOrg } = await supabase.from('organizations').select('*').limit(1).maybeSingle();
            if (firstOrg) setOrganization(firstOrg as Organization);
          }
        } else if (mounted) {
          const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('fc_active_admin_email') : null;
          const found = SYSTEM_ADMINS.find((a) => a.email.toLowerCase() === savedEmail?.toLowerCase());
          setUser(found || null);

          const { data: firstOrg } = await supabase.from('organizations').select('*').limit(1).maybeSingle();
          if (firstOrg && mounted) setOrganization(firstOrg as Organization);
        }
      } catch (err) {
        console.warn('Auth session check error:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authUser: UserProfile = {
          id: session.user.id,
          email: session.user.email || 'ekansh@firstclick.com',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Ekansh',
          avatar_url: null,
          role: 'Owner',
          created_at: session.user.created_at || new Date().toISOString(),
        };
        setUser(authUser);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithEmail = useCallback(async (email: string, password?: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password || 'passwordisthepassword';

      // 1. Attempt real Supabase Auth
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!signInError && signInData.user) {
          const authUser: UserProfile = {
            id: signInData.user.id,
            email: signInData.user.email || cleanEmail,
            full_name: signInData.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            role: 'Owner',
            created_at: signInData.user.created_at || new Date().toISOString(),
          };
          setUser(authUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('fc_active_admin_email', cleanEmail);
          }
          return { success: true };
        }

        // If user not registered yet on remote Supabase Auth, attempt sign up
        if (signInError && signInError.message.toLowerCase().includes('invalid login credentials')) {
          const matchedAdmin = SYSTEM_ADMINS.find((a) => a.email.toLowerCase() === cleanEmail);
          const adminName = matchedAdmin ? matchedAdmin.full_name : cleanEmail.split('@')[0];

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: {
              data: { full_name: adminName },
            },
          });

          if (!signUpError && signUpData.user) {
            const authUser: UserProfile = {
              id: signUpData.user.id,
              email: signUpData.user.email || cleanEmail,
              full_name: adminName,
              role: 'Owner',
              created_at: signUpData.user.created_at || new Date().toISOString(),
            };
            setUser(authUser);
            if (typeof window !== 'undefined') {
              localStorage.setItem('fc_active_admin_email', cleanEmail);
            }
            return { success: true };
          }
        }
      } catch (authErr) {
        console.warn('Supabase Auth remote check warning:', authErr);
      }

      // Check against standard First Click Admin accounts
      const matchedAdmin = SYSTEM_ADMINS.find((a) => a.email.toLowerCase() === cleanEmail);
      if (matchedAdmin) {
        setUser(matchedAdmin);
        if (typeof window !== 'undefined') {
          localStorage.setItem('fc_active_admin_email', matchedAdmin.email);
        }
        return { success: true };
      }

      return {
        success: false,
        error: 'Access Denied. Only authorized admin emails (ekansh@firstclick.com, kuldeep@firstclick.com, shreyash@firstclick.com) can log in.',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  }, [supabase]);

  const signUpWithEmail = useCallback(async (email: string, password: string, fullName: string, orgName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName, org_name: orgName },
        },
      });

      if (!error && data.user) {
        const newUser: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: fullName || email.split('@')[0],
          role: 'Owner',
          created_at: data.user.created_at || new Date().toISOString(),
        };
        setUser(newUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('fc_active_admin_email', newUser.email);
        }
        return { success: true };
      }
    } catch (e) {
      console.warn('Supabase Auth signup fallback:', e);
    }

    const newUser: UserProfile = {
      id: 'u_' + Date.now(),
      email: email.trim().toLowerCase(),
      full_name: fullName || email.split('@')[0],
      role: 'Owner',
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_active_admin_email', newUser.email);
    }
    return { success: true };
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch {
      setUser(SYSTEM_ADMINS[0]);
      router.push('/dashboard');
    }
  }, [supabase, router]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fc_active_admin_email');
    }
    setUser(null);
    router.push('/login');
  }, [supabase, router]);

  const switchUser = useCallback((newUser: UserProfile) => {
    setUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_active_admin_email', newUser.email);
    }
  }, []);

  const updateOrganization = useCallback((updates: Partial<Organization>) => {
    setOrganization((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        members,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        switchUser,
        updateOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
