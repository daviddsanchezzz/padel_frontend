import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

const PublicLayout = ({ orgId, orgName, title, children }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    {/* Top bar */}
    <header className="bg-[#0b1d12] text-white flex-shrink-0">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link
          to={`/organizations/${orgId}/public`}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trophy size={14} className="text-white" />
          </div>
          <span className="font-bold text-[15px] tracking-tight">{orgName}</span>
        </Link>
        {title && (
          <>
            <span className="text-white/30 text-sm">/</span>
            <span className="text-white/70 text-sm font-medium truncate">{title}</span>
          </>
        )}
      </div>
    </header>

    {/* Content */}
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
      {children}
    </main>
  </div>
);

export default PublicLayout;
