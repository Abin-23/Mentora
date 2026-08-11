
import AdminLayout from '../components/layout/AdminLayout';
import StatCard from '../components/ui/StatCard';
import ActionCard from '../components/ui/ActionCard';

import { useAuthUser } from '../hooks/useAuthUser';

export default function AdminDashboard() {
  const user = useAuthUser(true);

  if (!user) return null;

  return (
    <AdminLayout user={user}>
      {/* Welcome Section */}
      <section className="mb-12">
        <h1 className="font-display-xl text-5xl md:text-6xl tracking-tight mb-2">
          System Overview
        </h1>
        <p className="font-body-md text-text-secondary">
          Monitor platform health, user activity, and administrative alerts.
        </p>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon="group" title="Total Users" value="1,248" />
        <StatCard icon="school" title="Active Courses" value="84" />
        <StatCard icon="attach_money" title="Revenue (30d)" value="₹12.4k" />
        <StatCard icon="warning" title="System Alerts" value="3" bgColorClass="bg-card-coral" />
      </section>

      {/* Action Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard 
          bgColorClass="bg-card-mint"
          icon="person_add"
          title="Pending Approvals"
          description="There are 12 new instructor applications waiting for your review."
          buttonText="Review Applications"
        />
        <ActionCard 
          bgColorClass="bg-card-lavender"
          icon="cloud_done"
          title="System Status"
          description="All systems operational. Last database backup was 2 hours ago."
          buttonText="View Server Logs"
          buttonStyleClass="self-start bg-white text-primary border border-primary/20 font-label-mono text-label-mono px-6 py-2 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer"
        />
      </section>
    </AdminLayout>
  );
}
