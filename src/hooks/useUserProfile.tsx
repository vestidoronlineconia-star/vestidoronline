import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  birth_date: string | null;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
  selfie_url: string | null;
  body_photo_url: string | null;
  free_uses_remaining: number;
  created_at: string;
  updated_at: string;
}

interface CreateProfileData {
  full_name: string;
  birth_date?: string;
  gender?: UserProfile['gender'];
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data as UserProfile | null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (data: CreateProfileData) => {
    if (!user) return null;
    try {
      const { data: created, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          full_name: data.full_name,
          birth_date: data.birth_date || null,
          gender: data.gender || null,
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(created as UserProfile);
      return created as UserProfile;
    } catch {
      return null;
    }
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'full_name' | 'birth_date' | 'gender' | 'selfie_url' | 'body_photo_url'>>) => {
    if (!user || !profile) return false;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch {
      return false;
    }
  };

  const decrementUse = async () => {
    if (!user || !profile || profile.free_uses_remaining <= 0) return false;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ free_uses_remaining: profile.free_uses_remaining - 1 })
        .eq('user_id', user.id);

      if (error) throw error;
      setProfile(prev => prev ? { ...prev, free_uses_remaining: prev.free_uses_remaining - 1 } : null);
      return true;
    } catch {
      return false;
    }
  };

  const needsOnboarding = profile && (!profile.selfie_url || !profile.body_photo_url);
  const hasFreeUses = profile ? profile.free_uses_remaining > 0 : false;

  return {
    profile,
    loading,
    needsOnboarding,
    hasFreeUses,
    createProfile,
    updateProfile,
    decrementUse,
    refetch: fetchProfile,
  };
}
