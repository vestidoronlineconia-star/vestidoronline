import { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStepProps {
  stepNumber: number;
  title: string;
  description: string;
  children: ReactNode;
  isActive: boolean;
  isCompleted: boolean;
}

export const OnboardingStep = ({
  stepNumber,
  title,
  description,
  children,
  isActive,
  isCompleted,
}: OnboardingStepProps) => {
  return (
    <div className={cn(
      'transition-all duration-300',
      isActive ? 'opacity-100' : 'opacity-50 pointer-events-none'
    )}>
      <div className="flex items-start gap-4 mb-6">
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors',
          isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}>
          {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <div className="ml-14">
        {children}
      </div>
    </div>
  );
};

interface StepperProps {
  steps: { id: string; title: string }[];
  currentStepIndex: number;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
}

export const Stepper = ({ steps, currentStepIndex, completedSteps, onStepClick }: StepperProps) => {
  return (
    <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = index === currentStepIndex;
        const isClickable = isCompleted || index <= currentStepIndex;
        
        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick?.(step.id)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center gap-1 min-w-[80px] transition-all',
                isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                isCompleted ? 'bg-green-500 text-white' : 
                isCurrent ? 'bg-primary text-primary-foreground' : 
                'bg-muted text-muted-foreground'
              )}>
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={cn(
                'text-xs text-center transition-colors',
                isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}>
                {step.title}
              </span>
            </button>
            
            {index < steps.length - 1 && (
              <div className={cn(
                'h-0.5 w-8 mx-1 transition-colors',
                isCompleted ? 'bg-green-500' : 'bg-muted'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
};
