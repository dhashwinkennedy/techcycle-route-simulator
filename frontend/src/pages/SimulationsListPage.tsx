import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulationsApi } from '../api';
import { SimulationListItem, SimulationRun } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useApp } from '../context/AppContext';
import {
  History,
  PlaySquare,
  Search,
  Filter,
  ArrowRight,
  Route,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react';

export const SimulationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [simulations, setSimulations] = useState<SimulationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'executed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadSimulations = async () => {
    setIsLoading(true);
    try {
      const data = await simulationsApi.list();
      setSimulations(data);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load simulations history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSimulations();
  }, []);

  const filteredRuns = simulations.filter((run) => {
    const matchesSearch = run.run_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            <span>Simulation History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit log of generated route plans, execution snapshots and performance outcomes.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/simulations/new')}
          icon={<PlaySquare className="w-4 h-4" />}
        >
          New Route Plan
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Run ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 whitespace-nowrap">Status:</span>
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              {(['all', 'planned', 'executed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                    statusFilter === filter
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Runs List Table */}
      {isLoading ? (
        <LoadingSpinner label="Loading simulation runs audit log..." size="lg" />
      ) : filteredRuns.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
          <Route className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No simulation runs found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'No runs match your search filters.'
              : 'Generate your first simulation plan to establish route baselines.'}
          </p>
          <Button variant="primary" size="sm" onClick={() => navigate('/simulations/new')}>
            Create Route Plan
          </Button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-5">Simulation Run ID</th>
                  <th className="py-3.5 px-5">Created At</th>
                  <th className="py-3.5 px-5">Execution Status</th>
                  <th className="py-3.5 px-5 text-right">Details & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRuns.slice().reverse().map((run) => (
                  <tr
                    key={run.run_id}
                    onClick={() => navigate(`/simulations/${run.run_id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono font-bold text-slate-200 text-sm">
                          {run.run_id}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(run.created_at).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <Badge status={run.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/simulations/${run.run_id}`);
                        }}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Inspect Run
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
