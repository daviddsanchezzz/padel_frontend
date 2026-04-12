import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { getConnectStatus } from '../api/organizations';
import AppLayout from '../layouts/AppLayout';

const ConnectReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orgId = searchParams.get('org_id');

  const [status, setStatus] = useState(null); // null | 'active' | 'pending'

  useEffect(() => {
    if (!orgId) return;
    getConnectStatus(orgId)
      .then((res) => setStatus(res.data.status))
      .catch(() => setStatus('pending'));
  }, [orgId]);

  return (
    <AppLayout title="Cuenta bancaria">
      <div className="max-w-md mx-auto mt-10">
        <div className="card p-10 text-center">
          {status === null && (
            <Loader2 size={28} className="animate-spin text-gray-300 mx-auto mb-4" />
          )}
          {status === 'active' && (
            <>
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">¡Cuenta conectada!</h2>
              <p className="text-sm text-gray-400 mb-6">
                Los pagos de inscripción se ingresarán directamente en tu cuenta bancaria.
              </p>
              <button
                onClick={() => navigate('/organization/settings')}
                className="btn-primary"
              >
                Volver a ajustes
              </button>
            </>
          )}
          {status === 'pending' && (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Verificación en proceso</h2>
              <p className="text-sm text-gray-400 mb-6">
                Stripe está revisando tu información. Recibirás una confirmación cuando esté lista.
              </p>
              <button
                onClick={() => navigate('/organization/settings')}
                className="btn-secondary"
              >
                Volver a ajustes
              </button>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ConnectReturn;
