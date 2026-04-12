import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

const PublicLayout = ({ orgId, orgName, orgLogo, orgColor, title, children }) => {
  const color = orgColor || '#0b1d12';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 4px accent strip */}
      <div className="h-1 flex-shrink-0" style={{ backgroundColor: color }} />

      {/* White nav bar */}
      <header className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center gap-2">
          <Link
            to={`/organizations/${orgId}/public`}
            state={{ org: { name: orgName, logo: orgLogo, primaryColor: color } }}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity flex-shrink-0"
          >
            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden"
                 style={{ backgroundColor: `${color}20` }}>
              {orgLogo
                ? <img src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
                : <Building2 size={13} style={{ color }} />
              }
            </div>
            <span className="font-semibold text-gray-800 text-sm">{orgName}</span>
          </Link>

          {title && (
            <>
              <span className="text-gray-300 text-sm select-none flex-shrink-0">/</span>
              <span className="text-sm text-gray-500 truncate min-w-0">{title}</span>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default PublicLayout;
