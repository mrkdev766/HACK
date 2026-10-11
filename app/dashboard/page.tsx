import { MobileShell } from '@/components/layout/mobile-shell';
import { TripDashboard } from '@/components/trip/trip-dashboard';

export const metadata = {
  title: 'Adventures Dashboard | Wanderly',
  description: 'Manage and explore all your real-world travel quests and unlocked milestones.',
};

export default function DashboardPage() {
  return (
    <MobileShell theme="forest">
      <TripDashboard />
    </MobileShell>
  );
}
