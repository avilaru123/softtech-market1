import React from 'react';
import { Screen } from '../types';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  itemCount: number;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  orderNumber,
  customerName,
  customerEmail,
  totalAmount,
  itemCount,
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-success-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        style={{
          backgroundColor: '#0B192C',
          borderColor: '#00FFFF',
        }}
        className="relative w-full max-w-xl border-2 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto text-white"
      >
        <div className="w-16 h-16 bg-[#00FFFF]/20 text-[#00FFFF] border-2 border-[#00FFFF] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[36px]" aria-hidden="true">verified</span>
        </div>

        <div className="text-center">
          <span className="px-3.5 py-1 bg-[#FACC15] text-[#0B192C] text-xs font-mono font-black rounded-lg">
            PEDIDO #{orderNumber}
          </span>
          <h2 id="order-success-title" className="text-2xl font-black text-white mt-3 mb-1">
            ¡Pago Confirmado y Pedido en Preparación!
          </h2>
          <p className="text-sm text-slate-300">
            Gracias por confiar en SoftTech Market, <strong className="text-[#00FFFF]">{customerName}</strong>.
          </p>
        </div>

        <div className="my-6 bg-[#070F1E] border-2 border-[#1E3A5F] rounded-xl p-4 text-xs space-y-3">
          <div className="flex justify-between border-b border-[#1E3A5F] pb-2">
            <span className="text-slate-300">Total Transacción:</span>
            <span className="font-black text-[#FACC15] text-sm font-mono">{totalAmount}</span>
          </div>
          <div className="flex justify-between border-b border-[#1E3A5F] pb-2">
            <span className="text-slate-300">Productos adquiridos:</span>
            <span className="font-bold text-white">{itemCount} solución(es) asistiva(s)</span>
          </div>
          <div className="flex justify-between border-b border-[#1E3A5F] pb-2">
            <span className="text-slate-300">Confirmación enviada a:</span>
            <span className="font-mono text-[#00FFFF] font-bold">{customerEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Entrega asegurada & adaptada:</span>
            <span className="font-bold text-[#00FFFF]">24-48 horas laborables (Gratis)</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#112240] border-2 border-[#1E3A5F] rounded-xl text-xs text-slate-200 mb-6 flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] text-[#00FFFF] shrink-0" aria-hidden="true">info</span>
          <p className="leading-relaxed">
            Hemos emitido tu <strong className="text-white">factura electrónica en formato accesible PDF/UA</strong> junto con las licencias y claves de activación de software. El hardware será preparado en nuestro laboratorio con rotulado en braille y perfiles de voz preinstalados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate('catalog');
            }}
            aria-label="Botón: Volver al Catálogo, explorar más productos asistivos"
            data-speech="Botón: Volver al Catálogo, explorar más productos asistivos"
            style={{
              backgroundColor: '#00FFFF',
              color: '#0B192C',
              borderColor: '#00FFFF',
            }}
            className="flex-1 py-3.5 px-4 border-2 font-black rounded-xl text-sm text-center focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer shadow-md transition-all hover:brightness-105 active:scale-[0.99]"
          >
            Volver al Catálogo
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate('support');
            }}
            aria-label="Botón: Centro de Asistencia, resolver dudas sobre el pedido"
            data-speech="Botón: Centro de Asistencia, resolver dudas sobre el pedido"
            className="py-3.5 px-5 bg-[#112240] text-[#FACC15] hover:bg-[#1B3A60] font-black rounded-xl text-sm text-center border-2 border-[#1E3A5F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer transition-colors"
          >
            Centro de Asistencia
          </button>
        </div>
      </div>
    </div>
  );
};
