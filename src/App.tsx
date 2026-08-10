import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { EventManager } from './components/events/EventManager';
import { ToastContainer } from './components/common/ToastContainer';
import { Toast, ToastType } from './types/toast';

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
  const [statusFilterForMonitor, setStatusFilterForMonitor] = useState<string>('');

  const handleNavigateTabWithFilter = (tab: ActiveTab, statusFilter?: string, instanceId?: string) => {
    if (statusFilter !== undefined) {
      setStatusFilterForMonitor(statusFilter);
    }
    if (instanceId) {
      setSelectedInstanceIdForMonitor(instanceId);
    }
    setActiveTab(tab);
  };

  // Toast Notifications State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const knownTicketIdsRef = useRef<Set<string>>(new Set());
  const knownFailedInstanceIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  const addToast = useCallback((toastData: Omit<Toast, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newToast: Toast = {
      ...toastData,
      id,
      timestamp
    };

    setToasts(prev => [newToast, ...prev].slice(0, 5)); // Keep max 5

    // Auto-dismiss after 7 seconds
    setTimeout(() => {
      removeToast(id);
    }, toastData.autoDismissMs || 7000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

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

      const fetchedTickets = tkts || [];
      const fetchedInstances = insts || [];

      if (isInitialLoadRef.current) {
        // Populate initial sets without firing background alerts on initial page boot
        fetchedTickets.forEach(t => knownTicketIdsRef.current.add(t.id));
        fetchedInstances.filter(i => i.status === 'FAILED').forEach(i => knownFailedInstanceIdsRef.current.add(i.id));
        isInitialLoadRef.current = false;
      } else {
        // Check for newly assigned tickets in background
        fetchedTickets.forEach(t => {
          if (!knownTicketIdsRef.current.has(t.id) && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')) {
            knownTicketIdsRef.current.add(t.id);
            addToast({
              type: 'ticket',
              title: 'New Ticket Assigned',
              description: `Ticket #${t.id} ("${t.task_name || 'Workflow Step'}") assigned to role "${t.title_name || 'Title'}"`,
              actionLabel: 'View Queue',
              onAction: () => setActiveTab('tickets')
            });
          }
        });

        // Check for newly failed workflow instances in background
        fetchedInstances.forEach(inst => {
          if (inst.status === 'FAILED' && !knownFailedInstanceIdsRef.current.has(inst.id)) {
            knownFailedInstanceIdsRef.current.add(inst.id);
            addToast({
              type: 'error',
              title: 'Workflow Instance Failed',
              description: `Instance #${inst.id} ("${inst.workflow_name || 'Workflow'}") failed during execution node step`,
              actionLabel: 'Inspect Instance',
              onAction: () => {
                setSelectedInstanceIdForMonitor(inst.id);
                setActiveTab('instances');
              }
            });
          }
        });
      }
    } catch (err) {
      console.error('Error loading API data', err);
    }
  }, [addToast]);

  useEffect(() => {
    loadAllData();

    // Background polling every 8 seconds to detect background changes
    const interval = setInterval(() => {
      loadAllData();
    }, 8000);

    return () => clearInterval(interval);
  }, [loadAllData]);

  // Handlers to trigger simulated alerts for quick testing/demoing
  const handleSimulateFail = () => {
    const mockId = `inst-fail-${Math.floor(Math.random() * 900 + 100)}`;
    addToast({
      type: 'error',
      title: 'Workflow Instance Failed',
      description: `Instance #${mockId} ("Financial Audit Workflow") failed at node "validate_csv_format" due to schema validation error`,
      actionLabel: 'Inspect Instance',
      onAction: () => {
        setActiveTab('instances');
      }
    });
  };

  const handleSimulateTicket = () => {
    const mockTicketId = `tkt-new-${Math.floor(Math.random() * 900 + 100)}`;
    addToast({
      type: 'ticket',
      title: 'New Ticket Assigned',
      description: `Ticket #${mockTicketId} ("Approve Compliance Exception") assigned to title "Chief Compliance Officer"`,
      actionLabel: 'View Queue',
      onAction: () => {
        setActiveTab('tickets');
      }
    });
  };

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
        onSimulateFail={handleSimulateFail}
        onSimulateTicket={handleSimulateTicket}
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
              onNavigateTab={handleNavigateTabWithFilter}
              onQuickStartInstance={handleQuickStartInstance}
            />
          )}

          {activeTab === 'tackle' && (
            <TackleManager
              isDark={isDark}
              themeMode={themeMode}
              onRefreshAll={loadAllData}
            />
          )}

          {activeTab === 'workflows' && (
            <WorkflowManager
              workflows={workflows}
              tasks={tasks}
              instances={instances}
              isDark={isDark}
              themeMode={themeMode}
              onRefresh={loadAllData}
              onStartInstance={handleQuickStartInstance}
            />
          )}

          {activeTab === 'instances' && (
            <InstanceMonitor
              instances={instances}
              tasks={tasks}
              isDark={isDark}
              themeMode={themeMode}
              onRefresh={loadAllData}
              initialSelectedInstanceId={selectedInstanceIdForMonitor}
              initialStatusFilter={statusFilterForMonitor}
            />
          )}

          {activeTab === 'tickets' && (
            <TicketQueue
              tickets={tickets}
              titles={titles}
              tasks={tasks}
              isDark={isDark}
              themeMode={themeMode}
              onRefresh={loadAllData}
              onNavigateInstance={handleNavigateInstance}
            />
          )}

          {activeTab === 'events' && (
            <EventManager
              themeMode={themeMode}
              onNavigateToInstance={(instId) => {
                setSelectedInstanceIdForMonitor(instId);
                setActiveTab('instances');
              }}
              onToast={(msg, type) => {
                addToast({
                  type: type === 'fail' ? 'error' : 'ticket',
                  title: type === 'fail' ? 'Event Error' : 'Event Stream Notification',
                  description: msg
                });
              }}
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
              themeMode={themeMode}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'validation' && (
            <GraphValidator
              workflows={workflows}
              isDark={isDark}
              themeMode={themeMode}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'api-console' && (
            <ApiInspector
              isDark={isDark}
              themeMode={themeMode}
              onRefreshAll={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
        onClearAll={clearAllToasts}
        themeMode={themeMode}
        onSimulateFail={handleSimulateFail}
        onSimulateTicket={handleSimulateTicket}
      />
    </div>
  );
}
