import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { startConnectOnboard } from '../api/organizations';
import AppLayout from '../layouts/AppLayout';

// Stripe redirects here when the onboarding link expires.
// We automatically generate a fresh link and redirect the user.
const ConnectRefresh = () => {
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get('org_id');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orgId) { setError('Falta el identificador de organización.'); return; }
    startConnectOnboard(orgId)
      .then((res) => { window.location.href = res.data.url; })
      .catch(() => setError('No se pudo generar un nuevo enlace. Vuelve a intentarlo desde Ajustes.'));
  }, [orgId]);

  return (
    <AppLayout title="Cuenta bancaria">
      <div className="max-w-md mx-auto mt-10">
        <div className="card p-10 text-center">
          {!error ? (
            <>
              <Loader2 size={28} className="animate-spin text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Generando nuevo enlace de verificación…</p>
            </>
          ) : (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ConnectRefresh;
