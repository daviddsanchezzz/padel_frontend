import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

// Returns white or dark text color depending on background luminance
const getContrastColor = (hex) => {
  if (!hex) return '#ffffff';
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!rgb) return '#ffffff';
  const luminance = (0.299 * parseInt(rgb[1], 16) + 0.587 * parseInt(rgb[2], 16) + 0.114 * parseInt(rgb[3], 16)) / 255;
  return luminance > 0.55 ? '#1a1a1a' : '#ffffff';
};

const PublicLayout = ({ orgId, orgName, orgLogo, orgColor, title, children }) => {
  const color = orgColor || '#0b1d12';
  const textColor = getContrastColor(color);
  const isDark = textColor === '#ffffff';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header style={{ backgroundColor: color }} className="flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to={`/organizations/${orgId}/public`}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
            >
              {orgLogo
                ? <img src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
                : <Trophy size={14} style={{ color: textColor }} />
              }
            </div>
            <span className="font-bold text-[15px] tracking-tight" style={{ color: textColor }}>
              {orgName}
            </span>
          </Link>
          {title && (
            <>
              <span style={{ color: textColor, opacity: 0.4 }} className="text-sm">/</span>
              <span className="text-sm font-medium truncate" style={{ color: textColor, opacity: 0.75 }}>
                {title}
              </span>
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
};

export default PublicLayout;
