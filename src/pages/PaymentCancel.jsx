import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamId = searchParams.get('team_id');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <XCircle size={28} className="text-red-400" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">Pago cancelado</h1>
        <p className="text-sm text-gray-400 mb-6">No se ha realizado ningún cargo. Tu inscripción queda en estado pendiente — puedes intentarlo de nuevo.</p>
        <div className="flex flex-col gap-2">
          {teamId && (
            <button
              onClick={() => navigate(-2)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          )}
          <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
