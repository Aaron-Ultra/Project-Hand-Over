'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

export type Role = 'student' | 'office' | 'warden' | 'admin';
export type UserRole = Role | 'STUDENT' | 'OFFICE' | 'WARDEN' | 'ADMIN' | 'STAFF';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  hostelBlock?: string;
  roomNumber?: string;
  studentId?: string;
  phone?: string;
  token?: string;
}

export const PROFILES_TABLE: Record<string, UserProfile> = {
  'student@hostel.edu': {
    id: 'usr_student_01',
    email: 'student@hostel.edu',
    name: 'Ayush Nath',
    role: 'student',
    hostelBlock: 'Block A (Men)',
    roomNumber: 'A-302',
    studentId: '2024CSB1090',
    phone: '+91 98765-43210',
  },
  'office@hostel.edu': {
    id: 'usr_office_01',
    email: 'office@hostel.edu',
    name: 'Ramesh Kumar (Maintenance Staff)',
    role: 'office',
    phone: '+91 98111-22233',
  },
  'staff@hostel.edu': {
    id: 'usr_office_01',
    email: 'staff@hostel.edu',
    name: 'Ramesh Kumar (Maintenance Staff)',
    role: 'office',
    phone: '+91 98111-22233',
  },
  'warden@hostel.edu': {
    id: 'usr_warden_01',
    email: 'warden@hostel.edu',
    name: 'Dr. V. K. Gupta (Chief Warden)',
    role: 'warden',
    hostelBlock: 'Block A & B Desk',
    phone: '+91 98999-00001',
  },
  'admin@hostel.edu': {
    id: 'usr_admin_01',
    email: 'admin@hostel.edu',
    name: 'Executive Admin Control',
    role: 'admin',
    phone: '+91 98000-00000',
  },
};

const IS_MOCK =
  (typeof process !== 'undefined' && process.env && (process.env.VITE_USE_MOCK === 'true' || process.env.NEXT_PUBLIC_USE_MOCK === 'true')) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env && ((import.meta as any).env.VITE_USE_MOCK === 'true' || (import.meta as any).env.NEXT_PUBLIC_USE_MOCK === 'true'));

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  token: string | null;
  login: (email: string, pass?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signupWithCredentials: (email: string, pass: string, metadata?: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getDashboardForRole: (role: Role) => string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  login: async () => ({ success: false }),
  loginWithCredentials: async () => ({ success: false }),
  signupWithCredentials: async () => ({ success: false }),
  logout: async () => {},
  getDashboardForRole: () => '/',
});

export const getDashboardForRole = (role: Role): string => {
  switch (role) {
    case 'student':
      return '/dashboard';
    case 'office':
      return '/office';
    case 'warden':
      return '/warden';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfileFromSupabase = async (userId: string, email: string, accessTok?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Fallback profile if profile row is not found yet
        const defaultRole: Role = email.includes('warden')
          ? 'warden'
          : email.includes('office')
          ? 'office'
          : email.includes('admin')
          ? 'admin'
          : 'student';
        return {
          id: userId,
          email,
          name: email.split('@')[0],
          role: defaultRole,
          token: accessTok,
        };
      }

      return {
        id: data.id,
        email: data.email || email,
        name: data.full_name || data.name || email.split('@')[0],
        role: (data.role as Role) || 'student',
        hostelBlock: data.block || data.hostelBlock,
        roomNumber: data.room || data.roomNumber,
        studentId: data.student_id || data.studentId,
        phone: data.phone,
        token: accessTok,
      };
    } catch {
      return {
        id: userId,
        email,
        name: email.split('@')[0],
        role: 'student' as Role,
        token: accessTok,
      };
    }
  };

  useEffect(() => {
    if (IS_MOCK) {
      const storedEmail = localStorage.getItem('hosteldesk_logged_email');
      if (storedEmail && PROFILES_TABLE[storedEmail]) {
        setUser(PROFILES_TABLE[storedEmail]);
        setToken('mock-jwt-token');
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
      return;
    }

    // Real Supabase Auth listener
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setToken(session.access_token);
        const prof = await fetchProfileFromSupabase(session.user.id, session.user.email || '', session.access_token);
        setUser(prof);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setToken(session.access_token);
        const prof = await fetchProfileFromSupabase(session.user.id, session.user.email || '', session.access_token);
        setUser(prof);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loginWithCredentials = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (IS_MOCK) {
      const profile = PROFILES_TABLE[cleanEmail];
      if (!profile) {
        return { success: false, error: 'Invalid user credentials or profile not found in system.' };
      }
      setUser(profile);
      setToken('mock-jwt-token');
      localStorage.setItem('hosteldesk_logged_email', cleanEmail);
      const targetDashboard = getDashboardForRole(profile.role);
      router.push(targetDashboard);
      return { success: true };
    }

    // Real Supabase Auth Login with Demo Profile Fallback
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (!error && data.session && data.user) {
        setToken(data.session.access_token);
        const prof = await fetchProfileFromSupabase(data.user.id, data.user.email || '', data.session.access_token);
        setUser(prof);
        const targetDashboard = getDashboardForRole(prof.role);
        router.push(targetDashboard);
        return { success: true };
      }

      // If Supabase auth fails (e.g., demo accounts not created in real Supabase auth yet), fallback to demo profiles
      if (PROFILES_TABLE[cleanEmail]) {
        const profile = PROFILES_TABLE[cleanEmail];
        setUser(profile);
        setToken('mock-jwt-token');
        localStorage.setItem('hosteldesk_logged_email', cleanEmail);
        const targetDashboard = getDashboardForRole(profile.role);
        router.push(targetDashboard);
        return { success: true };
      }

      if (error) {
        return { success: false, error: error.message };
      }
    } catch {
      if (PROFILES_TABLE[cleanEmail]) {
        const profile = PROFILES_TABLE[cleanEmail];
        setUser(profile);
        setToken('mock-jwt-token');
        localStorage.setItem('hosteldesk_logged_email', cleanEmail);
        const targetDashboard = getDashboardForRole(profile.role);
        router.push(targetDashboard);
        return { success: true };
      }
    }

    return { success: false, error: 'Failed to authenticate user' };
  };

  const signupWithCredentials = async (email: string, pass: string, metadata?: Partial<UserProfile>) => {
    const cleanEmail = email.trim().toLowerCase();

    if (IS_MOCK) {
      const newProf: UserProfile = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        name: metadata?.name || cleanEmail.split('@')[0],
        role: metadata?.role || 'student',
        hostelBlock: metadata?.hostelBlock,
        roomNumber: metadata?.roomNumber,
        studentId: metadata?.studentId,
        phone: metadata?.phone,
      };
      PROFILES_TABLE[cleanEmail] = newProf;
      setUser(newProf);
      setToken('mock-jwt-token');
      localStorage.setItem('hosteldesk_logged_email', cleanEmail);
      router.push(getDashboardForRole(newProf.role));
      return { success: true };
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          full_name: metadata?.name,
          role: metadata?.role || 'student',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Upsert profile in profiles table
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: cleanEmail,
        full_name: metadata?.name || cleanEmail.split('@')[0],
        role: metadata?.role || 'student',
        block: metadata?.hostelBlock,
        room: metadata?.roomNumber,
        student_id: metadata?.studentId,
        phone: metadata?.phone,
      });

      if (data.session) {
        setToken(data.session.access_token);
        const prof = await fetchProfileFromSupabase(data.user.id, cleanEmail, data.session.access_token);
        setUser(prof);
        router.push(getDashboardForRole(prof.role));
      }
    }

    return { success: true };
  };

  const logout = async () => {
    if (IS_MOCK) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('hosteldesk_logged_email');
      router.push('/');
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login: (email: string, pass?: string) => loginWithCredentials(email, pass || 'password123'),
        loginWithCredentials,
        signupWithCredentials,
        logout,
        getDashboardForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
