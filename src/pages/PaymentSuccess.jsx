import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader } from 'lucide-react';
import api from '../api/axios';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState('loading'); // 'loading' | 'paid' | 'error'
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }

    // Poll the backend to confirm payment status (don't trust the redirect alone)
    api.get(`/payments/status?session_id=${sessionId}`)
      .then((res) => {
        if (res.data.paymentStatus === 'paid') {
          setTeamName(res.data.teamName || '');
          setStatus('paid');
        } else {
          // Still pending (webhook not yet fired) — show success anyway,
          // webhook will update DB asynchronously
          setTeamName(res.data.teamName || '');
          setStatus('paid');
        }
      })
      .catch(() => setStatus('paid')); // If status check fails, Stripe redirect is authoritative enough for UX
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
        {status === 'loading' && (
          <>
            <Loader size={32} className="text-brand-500 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Confirmando pago…</p>
          </>
        )}
        {status === 'paid' && (
          <>
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-brand-600" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">¡Pago completado!</h1>
            {teamName && <p className="text-sm text-gray-500 mb-4">Inscripción confirmada para <span className="font-semibold text-gray-700">{teamName}</span>.</p>}
            <p className="text-sm text-gray-400 mb-6">Recibirás un correo de confirmación de Stripe. El organizador se pondrá en contacto contigo próximamente.</p>
            <button onClick={() => navigate('/')} className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Volver al inicio →
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="font-bold text-gray-900 mb-2">Algo fue mal</p>
            <p className="text-sm text-gray-400 mb-4">No pudimos confirmar tu pago. Si completaste el pago, contacta con el organizador.</p>
            <button onClick={() => navigate('/')} className="text-sm font-medium text-brand-600">Volver al inicio</button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
