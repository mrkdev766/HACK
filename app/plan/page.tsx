import { Suspense } from 'react';
import { MobileShell } from '@/components/layout/mobile-shell';
import { PlanForm } from '@/components/trip/plan-form';

export const metadata = {
  title: 'Plan Your Trip | Wanderly',
  description: 'Tell us your budget and available travel time. We will craft your mystery adventure.',
};

export default function PlanPage() {
  return (
    <MobileShell theme="cream">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-8 text-xs font-bold text-muted">
            Loading planner...
          </div>
        }
      >
        <PlanForm />
      </Suspense>
    </MobileShell>
  );
}
