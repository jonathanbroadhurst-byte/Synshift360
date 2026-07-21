import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Shield, Building2, Coins, Users } from 'lucide-react';

export default function OwnerDashboard() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-md flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-amber-400" /> Platform Owner Command Center
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Manage global client provisioning, allocate Quantum Tokens, and oversee multi-tenant platform metrics.
              </p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase">Provisioned Organizations</span>
                <p className="text-2xl font-bold text-gray-900">6</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase">Active Quantum Credits</span>
                <p className="text-2xl font-bold text-gray-900">9,999</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium uppercase">Total Registered Users</span>
                <p className="text-2xl font-bold text-gray-900">18</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center text-gray-500 text-sm">
            Platform Provisioning & Credit Distribution Tools Active
          </div>
        </div>
      </main>
    </div>
  );
}
