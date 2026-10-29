import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Home, AlertCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 rounded-full bg-rose-950/40 border border-rose-800 text-rose-400">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold text-slate-100">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md">
        The operational screen or route you requested does not exist in the E-Waste Route Simulator.
      </p>
      <Link to="/">
        <Button variant="primary" icon={<Home className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
