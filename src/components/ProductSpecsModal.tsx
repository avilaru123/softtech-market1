import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useAnnouncer } from './LiveAnnouncer';
import { speakSpanish, stopSpeech, getProductSpeechText } from '../utils/speech';

interface ProductSpecsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ProductSpecsModal: React.FC<ProductSpecsModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const { announce } = useAnnouncer();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const handleToggleSpeak = () => {
    if (!product) return;
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      announce('Lectura detenida');
    } else {
      const text = getProductSpeechText(product);
      announce(`Leyendo en voz alta la ficha técnica de ${product.name}`);
      setIsSpeaking(true);
      speakSpanish(text, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  if (!product) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="specs-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        style={{
          backgroundColor: '#0B192C',
          borderColor: '#00FFFF',
        }}
        className="relative w-full max-w-3xl border-2 rounded-2xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto text-white"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#1E3A5F] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/50 text-xs font-black rounded-full uppercase tracking-wider">
                {product.badge}
              </span>
              <span className="px-3 py-0.5 bg-[#FACC15] text-[#0B192C] font-black text-xs rounded-md">
                {product.subBadge}
              </span>
            </div>
            <h2 id="specs-modal-title" className="text-2xl font-black text-white">
              {product.name}
            </h2>
            <p className="text-xs uppercase font-black tracking-wider text-[#00FFFF] mt-1">
              {product.categoryLabel} • {product.priceType}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              announce('Ficha de especificaciones cerrada');
            }}
            aria-label="Botón: Cerrar ficha de especificaciones técnicas"
            data-speech="Botón: Cerrar ficha de especificaciones técnicas"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#112240] hover:bg-[#1B3A60] text-white border border-[#1E3A5F] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6">
          {/* Image preview */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="h-56 bg-[#070F1E] rounded-xl overflow-hidden border-2 border-[#1E3A5F] flex items-center justify-center">
              <img
                src={product.image}
                alt={product.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3.5 bg-[#070F1E] rounded-xl border border-[#1E3A5F] text-xs">
              <p className="font-black text-[#00FFFF] mb-1">Certificación Asistiva</p>
              <p className="text-slate-300">
                Auditado conforme a la norma europea EN 301 549 y pautas WCAG 2.1 nivel AAA.
              </p>
            </div>
          </div>

          {/* Details & Specs */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#00FFFF] mb-1">
                Descripción Funcional
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed mb-4">
                {product.description}
              </p>

              <h3 className="text-xs font-black uppercase tracking-wider text-[#FACC15] mb-2">
                Ficha Técnica Certificada
              </h3>
              <dl className="grid grid-cols-1 gap-2 bg-[#070F1E] p-3.5 rounded-xl border border-[#1E3A5F] text-xs">
                {product.specs.map((s, idx) => (
                  <div key={idx} className="flex justify-between border-b border-[#1E3A5F] pb-1.5 last:border-0 last:pb-0">
                    <dt className="font-bold text-white">{s.label}:</dt>
                    <dd className="text-[#00FFFF] font-mono text-right">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Price & Action */}
            <div className="pt-6 mt-4 border-t border-[#1E3A5F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-2xl font-black text-[#FACC15] block font-mono">
                  {product.priceFormatted}
                </span>
                <span className="text-xs text-slate-300">
                  IVA (21%) incluido • Factura deducible
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleSpeak}
                  aria-label={isSpeaking ? "Botón: Detener lectura en voz alta" : "Botón: Escuchar descripción en voz alta con síntesis de voz en español"}
                  data-speech={isSpeaking ? "Botón: Detener lectura en voz alta" : `Botón: Escuchar descripción en voz alta de ${product.name}`}
                  className={`px-4 py-3 rounded-xl font-black text-xs flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer transition-colors border-2 ${
                    isSpeaking
                      ? 'bg-[#112240] text-[#00FFFF] border-[#00FFFF]'
                      : 'bg-[#112240] hover:bg-[#1B3A60] text-white border-[#1E3A5F]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {isSpeaking ? 'stop_circle' : 'volume_up'}
                  </span>
                  <span>{isSpeaking ? 'Detener audio' : 'Escuchar ficha'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  aria-label={`Botón: Añadir ${product.name} al Carrito de compra`}
                  data-speech={`Botón: Añadir ${product.name} al Carrito de compra`}
                  style={{
                    backgroundColor: '#00FFFF',
                    color: '#0B192C',
                    borderColor: '#00FFFF',
                  }}
                  className="px-5 py-3 border-2 font-black rounded-xl flex items-center gap-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer shadow-md transition-all hover:brightness-105 active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add_shopping_cart</span>
                  <span>Añadir al Carrito</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
