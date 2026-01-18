import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding, OnboardingStep as OnboardingStepType, ONBOARDING_STEPS } from '@/hooks/useOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { WelcomeStep } from '@/components/onboarding/steps/WelcomeStep';
import { BrandingStep } from '@/components/onboarding/steps/BrandingStep';
import { DomainsStep } from '@/components/onboarding/steps/DomainsStep';
import { CategoriesStep } from '@/components/onboarding/steps/CategoriesStep';
import { SizesStep } from '@/components/onboarding/steps/SizesStep';
import { TestStep } from '@/components/onboarding/steps/TestStep';
import { InstallStep } from '@/components/onboarding/steps/InstallStep';
import { CompleteStep } from '@/components/onboarding/steps/CompleteStep';

interface EmbedClient {
  id: string;
  name: string;
  slug: string;
  api_key: string;
  allowed_domains: string[];
  primary_color: string | null;
  secondary_color: string | null;
  background_color: string | null;
  text_color: string | null;
  logo_url: string | null;
  custom_title: string;
  cta_text: string;
  enabled_categories: string[];
  show_size_selector: boolean;
  show_fit_result: boolean;
}

// Stepper component
const Stepper = ({ steps, currentStepIndex, completedSteps }: { 
  steps: typeof ONBOARDING_STEPS; 
  currentStepIndex: number;
  completedSteps: OnboardingStepType[];
}) => {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = completedSteps.includes(step.id);
        const isPast = index < currentStepIndex;
        
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" :
                  isCompleted || isPast ? "bg-primary/20 text-primary" :
                  "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted || isPast ? '✓' : index + 1}
              </div>
              <span className={cn(
                "text-xs mt-1 text-center max-w-16",
                isActive ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "h-0.5 flex-1 mx-2",
                isPast || isCompleted ? "bg-primary/40" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const ClientPortalOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  
  const [client, setClient] = useState<EmbedClient | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { 
    progress, 
    loading: progressLoading, 
    currentStep,
    currentStepIndex,
    completeStep, 
    previousStep,
    skipStep,
    markComplete,
    steps,
  } = useOnboarding(clientId || '');

  // Local form state
  const [showSizeSelector, setShowSizeSelector] = useState(true);
  const [showFitResult, setShowFitResult] = useState(true);

  useEffect(() => {
    loadClient();
  }, [clientId, user]);

  useEffect(() => {
    if (client) {
      setShowSizeSelector(client.show_size_selector);
      setShowFitResult(client.show_fit_result);
    }
  }, [client]);

  const loadClient = async () => {
    if (!user || !clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('embed_clients')
        .select('*')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Cliente no encontrado');
        navigate('/client-portal');
        return;
      }
      setClient(data as EmbedClient);
    } catch (e) {
      toast.error('Error al cargar cliente');
      navigate('/client-portal');
    } finally {
      setLoading(false);
    }
  };

  const saveClientData = async (data: Partial<EmbedClient>) => {
    if (!client) return;
    
    try {
      const { error } = await supabase
        .from('embed_clients')
        .update(data)
        .eq('id', client.id);
      
      if (error) throw error;
      setClient({ ...client, ...data });
    } catch (e) {
      toast.error('Error al guardar');
      throw e;
    }
  };

  const handleNext = async () => {
    await completeStep(currentStep?.id as OnboardingStepType);
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleSkip = () => {
    skipStep();
  };

  const handleComplete = async () => {
    await markComplete();
    toast.success('¡Onboarding completado!');
    navigate(`/client-portal/settings/${clientId}`);
  };

  const handleGoToSettings = () => {
    navigate(`/client-portal/settings/${clientId}`);
  };

  if (loading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) return null;

  const currentStepId = currentStep?.id || 'welcome';
  const completedSteps = (progress?.completed_steps as OnboardingStepType[]) || [];

  const renderStep = () => {
    switch (currentStepId) {
      case 'welcome':
        return (
          <WelcomeStep 
            onNext={handleNext}
          />
        );
      case 'branding':
        return (
          <BrandingStep
            clientData={{
              name: client.name,
              logo_url: client.logo_url,
              primary_color: client.primary_color,
              secondary_color: client.secondary_color,
              text_color: client.text_color,
              background_color: client.background_color,
            }}
            onUpdate={async (data) => {
              await saveClientData(data);
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 'domains':
        return (
          <DomainsStep
            domains={client.allowed_domains}
            onUpdate={async (domains) => {
              await saveClientData({ allowed_domains: domains });
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 'categories':
        return (
          <CategoriesStep
            enabledCategories={client.enabled_categories}
            onUpdate={async (categories) => {
              await saveClientData({ enabled_categories: categories });
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 'sizes':
        return (
          <SizesStep
            showSizeSelector={showSizeSelector}
            showFitResult={showFitResult}
            onUpdate={async (data) => {
              setShowSizeSelector(data.show_size_selector);
              setShowFitResult(data.show_fit_result);
              await saveClientData({
                show_size_selector: data.show_size_selector,
                show_fit_result: data.show_fit_result,
              });
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
          />
        );
      case 'test':
        return (
          <TestStep
            slug={client.slug}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 'install':
        return (
          <InstallStep
            slug={client.slug}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 'complete':
        return (
          <CompleteStep
            clientId={client.id}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="bg-ambient" />
      <div className="min-h-screen p-4 md:p-8 relative">
        <div className="max-w-3xl mx-auto">
          <Stepper 
            steps={steps} 
            currentStepIndex={currentStepIndex}
            completedSteps={completedSteps} 
          />
          
          <Card className="mt-8 p-6">
            {renderStep()}
          </Card>
        </div>
      </div>
    </>
  );
};

export default ClientPortalOnboarding;
