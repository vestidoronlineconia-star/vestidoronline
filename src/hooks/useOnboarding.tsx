import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type OnboardingStep = 
  | 'welcome'
  | 'branding'
  | 'domains'
  | 'categories'
  | 'sizes'
  | 'test'
  | 'install'
  | 'complete';

export const ONBOARDING_STEPS: { id: OnboardingStep; title: string; description: string }[] = [
  { id: 'welcome', title: 'Bienvenida', description: 'Introducción al widget' },
  { id: 'branding', title: 'Marca', description: 'Logo y colores' },
  { id: 'domains', title: 'Dominios', description: 'URLs autorizadas' },
  { id: 'categories', title: 'Categorías', description: 'Tipos de prendas' },
  { id: 'sizes', title: 'Talles', description: 'Guía de talles (opcional)' },
  { id: 'test', title: 'Probar', description: 'Sandbox de prueba' },
  { id: 'install', title: 'Instalar', description: 'Código de integración' },
  { id: 'complete', title: 'Listo', description: 'Configuración completa' },
];

interface OnboardingProgress {
  id: string;
  client_id: string;
  completed_steps: OnboardingStep[];
  current_step: OnboardingStep;
  is_complete: boolean;
  last_step_at: string;
  created_at: string;
}

export const useOnboarding = (clientId: string | null) => {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const fetchProgress = useCallback(async () => {
    if (!clientId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const typedData = {
          ...data,
          completed_steps: (data.completed_steps as OnboardingStep[]) || [],
          current_step: (data.current_step as OnboardingStep) || 'welcome',
        };
        setProgress(typedData);
        const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === typedData.current_step);
        setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
      } else {
        // Create new onboarding progress
        const { data: newProgress, error: createError } = await supabase
          .from('onboarding_progress')
          .insert({
            client_id: clientId,
            completed_steps: [],
            current_step: 'welcome',
            is_complete: false,
          })
          .select()
          .single();

        if (createError) throw createError;

        const typedNewProgress = {
          ...newProgress,
          completed_steps: (newProgress.completed_steps as OnboardingStep[]) || [],
          current_step: (newProgress.current_step as OnboardingStep) || 'welcome',
        };
        setProgress(typedNewProgress);
        setCurrentStepIndex(0);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const completeStep = async (step: OnboardingStep) => {
    if (!progress || !clientId) return;

    const completedSteps = progress.completed_steps.includes(step)
      ? progress.completed_steps
      : [...progress.completed_steps, step];

    const nextStepIndex = currentStepIndex + 1;
    const nextStep = ONBOARDING_STEPS[nextStepIndex]?.id || 'complete';
    const isComplete = nextStep === 'complete';

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .update({
          completed_steps: completedSteps,
          current_step: nextStep,
          is_complete: isComplete,
          last_step_at: new Date().toISOString(),
        })
        .eq('client_id', clientId);

      if (error) throw error;

      setProgress(prev => prev ? {
        ...prev,
        completed_steps: completedSteps,
        current_step: nextStep,
        is_complete: isComplete,
      } : null);
      setCurrentStepIndex(nextStepIndex);
    } catch (err) {
    }
  };

  const goToStep = async (step: OnboardingStep) => {
    if (!progress || !clientId) return;

    const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === step);
    if (stepIndex < 0) return;

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .update({
          current_step: step,
          last_step_at: new Date().toISOString(),
        })
        .eq('client_id', clientId);

      if (error) throw error;

      setProgress(prev => prev ? { ...prev, current_step: step } : null);
      setCurrentStepIndex(stepIndex);
    } catch (err) {
    }
  };

  const previousStep = async () => {
    if (currentStepIndex <= 0) return;
    const prevStep = ONBOARDING_STEPS[currentStepIndex - 1];
    if (prevStep) {
      await goToStep(prevStep.id);
    }
  };

  const skipStep = async () => {
    if (!progress) return;
    const nextStepIndex = currentStepIndex + 1;
    const nextStep = ONBOARDING_STEPS[nextStepIndex]?.id || 'complete';
    await goToStep(nextStep);
  };

  const markComplete = async () => {
    if (!progress || !clientId) return;

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .update({
          is_complete: true,
          current_step: 'complete',
          last_step_at: new Date().toISOString(),
        })
        .eq('client_id', clientId);

      if (error) throw error;

      setProgress(prev => prev ? { ...prev, is_complete: true, current_step: 'complete' } : null);
    } catch (err) {
    }
  };

  const resetOnboarding = async () => {
    if (!clientId) return;

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .update({
          completed_steps: [],
          current_step: 'welcome',
          is_complete: false,
          last_step_at: new Date().toISOString(),
        })
        .eq('client_id', clientId);

      if (error) throw error;

      setProgress(prev => prev ? {
        ...prev,
        completed_steps: [],
        current_step: 'welcome',
        is_complete: false,
      } : null);
      setCurrentStepIndex(0);
    } catch (err) {
    }
  };

  const isStepCompleted = (step: OnboardingStep) => {
    return progress?.completed_steps.includes(step) || false;
  };

  const canAccessStep = (step: OnboardingStep) => {
    const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === step);
    // Can access current step or any completed step
    return stepIndex <= currentStepIndex || isStepCompleted(step);
  };

  return {
    progress,
    loading,
    currentStep: ONBOARDING_STEPS[currentStepIndex],
    currentStepIndex,
    totalSteps: ONBOARDING_STEPS.length,
    isComplete: progress?.is_complete || false,
    completeStep,
    goToStep,
    previousStep,
    skipStep,
    markComplete,
    resetOnboarding,
    isStepCompleted,
    canAccessStep,
    steps: ONBOARDING_STEPS,
  };
};
