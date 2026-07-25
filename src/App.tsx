import React, { useState, useEffect, useCallback } from 'react';
import { BrandingBox } from './components/common/BrandingBox';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { WorkflowManager } from './components/workflows/WorkflowManager';
import { InstanceMonitor } from './components/runtime/InstanceMonitor';
import { TicketQueue } from './components/tickets/TicketQueue';
import { OfficeManager } from './components/offices/OfficeManager';
import { GraphValidator } from './components/validation/GraphValidator';
import { ApiInspector } from './components/api-console/ApiInspector';
import { TackleManager } from './components/tackle/TackleManager';

import {
  Office, Title, Task, Outcome, Workflow, Instance, Ticket, Receipt, Role
} from './types/wind';
import { ThemeMode, getThemeStyles } from './types/theme';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const isDark = themeMode !== 'light';
  const styles = getThemeStyles(themeMode);

  // Core Schema Data State
  const [offices, setOffices] = useState<Office[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // Navigation Deep Links
  const [selectedInstanceIdForMonitor, setSelectedInstanceIdForMonitor] = useState<string>('');

  const loadAllData = useCallback(async () => {
    try {
      const [offs, ttls, tsks, outs, wfs, insts, tkts, rcpts, rls] = await Promise.all([
        api.getOffices(),
        api.getTitles(),
        api.getTasks(),
        api.getOutcomes(),
        api.getWorkflows(),
        api.getInstances(),
        api.getTickets(),
        api.getReceipts(),
        api.getVRoles()
      ]);

      setOffices(offs || []);
      setTitles(ttls || []);
      setTasks(tsks || []);
      setOutcomes(outs || []);
      setWorkflows(wfs || []);
      setInstances(insts || []);
      setTickets(tkts || []);
      setReceipts(rcpts || []);
      setRoles(rls || []);
    } catch (err) {
      console.error('Error loading API data', err);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleToggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'steel' : 'light');
  };

  const handleQuickStartInstance = async (versionId: string) => {
    try {
      const created = await api.startInstance({ workflow_version_id: versionId });
      await loadAllData();
      setSelectedInstanceIdForMonitor(created.id);
      setActiveTab('instances');
    } catch (e: any) {
      alert(e.message || 'Failed to start workflow instance');
    }
  };

  const handleNavigateInstance = (instanceId: string) => {
    setSelectedInstanceIdForMonitor(instanceId);
    setActiveTab('instances');
  };

  // Compute current REST route path for address bar
  const getPathForTab = (tab: ActiveTab): string => {
    switch (tab) {
      case 'dashboard': return '/health';
      case 'tackle': return '/config/ai';
      case 'workflows': return '/api/workflows';
      case 'instances': return '/api/instances';
      case 'tickets': return '/api/tickets';
      case 'offices': return '/api/offices';
      case 'validation': return '/api/validate';
      case 'api-console': return '/api/logs';
      default: return '/api';
    }
  };

  const pendingTickets = tickets.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const activeInstances = instances.filter(i => i.status === 'ACTIVE').length;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${styles.bg}`}>
      {/* Top Address bar & Branding box */}
      <BrandingBox
        currentPath={getPathForTab(activeTab)}
        themeMode={themeMode}
        onChangeTheme={setThemeMode}
        onOpenConsole={() => setActiveTab('api-console')}
        onRefreshData={loadAllData}
      />

      {/* Main IDE Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          themeMode={themeMode}
          pendingTicketCount={pendingTickets}
          activeInstanceCount={activeInstances}
        />

        {/* Main Content View Container */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          {activeTab === 'dashboard' && (
            <OverviewDashboard
              instances={instances}
              tickets={tickets}
              workflows={workflows}
              receipts={receipts}
              isDark={isDark}
              themeMode={themeMode}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onQuickStartInstance={handleQuickStartInstance}
            />
          )}

          {activeTab === 'tackle' && (
            <TackleManager
              isDark={isDark}
              onRefreshAll={loadAllData}
            />
          )}

          {activeTab === 'workflows' && (
            <WorkflowManager
              workflows={workflows}
              tasks={tasks}
              isDark={isDark}
              onRefresh={loadAllData}
              onStartInstance={handleQuickStartInstance}
            />
          )}

          {activeTab === 'instances' && (
            <InstanceMonitor
              instances={instances}
              tasks={tasks}
              isDark={isDark}
              onRefresh={loadAllData}
              initialSelectedInstanceId={selectedInstanceIdForMonitor}
            />
          )}

          {activeTab === 'tickets' && (
            <TicketQueue
              tickets={tickets}
              titles={titles}
              tasks={tasks}
              isDark={isDark}
              onRefresh={loadAllData}
              onNavigateInstance={handleNavigateInstance}
            />
          )}

          {activeTab === 'offices' && (
            <OfficeManager
              offices={offices}
              titles={titles}
              tasks={tasks}
              outcomes={outcomes}
              roles={roles}
              isDark={isDark}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'validation' && (
            <GraphValidator
              workflows={workflows}
              isDark={isDark}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'api-console' && (
            <ApiInspector
              isDark={isDark}
              onRefreshAll={loadAllData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
