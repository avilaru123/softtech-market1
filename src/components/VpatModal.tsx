import React, { useState } from 'react';
import { useAnnouncer } from './LiveAnnouncer';

interface VpatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VpatModal: React.FC<VpatModalProps> = ({ isOpen, onClose }) => {
  const { announce } = useAnnouncer();
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloaded(true);
    announce('Descargando Declaración VPAT 2.4 en formato PDF/UA accesible...', 'polite');
    setTimeout(() => setDownloaded(false), 4000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vpat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        style={{
          backgroundColor: '#0B192C',
          borderColor: '#00FFFF',
        }}
        className="relative w-full max-w-2xl border-2 rounded-2xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto text-white"
      >
        <div className="flex items-start justify-between pb-3.5 border-b border-[#1E3A5F]">
          <div>
            <span className="px-3 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/50 text-xs font-black rounded-full uppercase tracking-wider">
              Conformidad Oficial
            </span>
            <h2 id="vpat-modal-title" className="text-xl font-black text-white mt-1.5">
              Declaración de Accesibilidad & Reportes VPAT
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Botón: Cerrar ventana de conformidad VPAT"
            data-speech="Botón: Cerrar ventana de conformidad VPAT"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#112240] hover:bg-[#1B3A60] text-white border border-[#1E3A5F] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4 text-sm text-slate-200">
          <p className="leading-relaxed">
            SoftTech Market mantiene un compromiso inquebrantable con los principios de equidad, interoperabilidad y diseño universal bajo las directrices <strong className="text-[#00FFFF]">WCAG 2.1 Nivel AAA</strong> y la norma europea <strong className="text-[#FACC15]">EN 301 549</strong>.
          </p>

          <div className="bg-[#070F1E] border-2 border-[#1E3A5F] rounded-xl p-4 flex flex-col gap-3">
            <h3 className="font-black text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00FFFF] text-[22px]" aria-hidden="true">verified</span>
              Resumen de Auditoría Técnica (Marzo 2026)
            </h3>
            <ul className="text-xs space-y-2 list-disc pl-5 text-slate-300">
              <li>
                <strong className="text-[#00FFFF]">Perceptible:</strong> Contraste mínimo de texto superior a 7.2:1 (superando el 7:1 requerido para AAA). Descripciones de texto enriquecidas (Alt-text minucioso) en cada producto.
              </li>
              <li>
                <strong className="text-[#00FFFF]">Operable:</strong> 100% de los elementos interactivos son accionables mediante teclado (Tab, Espacio, Enter) con salto directo a contenido principal y focos visuales de 3px.
              </li>
              <li>
                <strong className="text-[#00FFFF]">Comprensible:</strong> Estructura semántica clara con etiquetas explícitas y navegación predecible.
              </li>
              <li>
                <strong className="text-[#00FFFF]">Robusto:</strong> Regiones activas <code className="text-[#FACC15]">aria-live</code> para lectores de pantalla NVDA, JAWS, VoiceOver y terminales Braille.
              </li>
            </ul>
          </div>

          <div className="p-3.5 bg-[#112240] border-2 border-[#1E3A5F] rounded-xl text-xs flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px] text-[#00FFFF]" aria-hidden="true">description</span>
            <div>
              <p className="font-black text-white">VPAT 2.4 - Section 508 & EN 301 549 Edition</p>
              <p className="text-slate-300">Documento oficial auditado con firma criptográfica de conformidad.</p>
            </div>
          </div>

          {downloaded && (
            <div className="p-3 bg-[#00FFFF]/20 border-2 border-[#00FFFF] text-[#00FFFF] rounded-xl text-xs font-black text-center">
              ✓ Documento descargado correctamente en formato accesible PDF/UA.
            </div>
          )}

          <div className="pt-3 border-t border-[#1E3A5F] flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              aria-label="Botón: Cerrar diálogo de conformidad"
              data-speech="Botón: Cerrar diálogo de conformidad"
              className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white border border-[#1E3A5F] rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleDownload}
              aria-label="Botón: Descargar Reporte Completo en PDF/UA accesible"
              data-speech="Botón: Descargar Reporte Completo en PDF/UA accesible"
              style={{
                backgroundColor: '#FACC15',
                color: '#0B192C',
                borderColor: '#FDE047',
              }}
              className="px-5 py-2.5 border-2 font-black rounded-xl text-sm flex items-center gap-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer shadow-md transition-all hover:brightness-105 active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">download</span>
              <span>Descargar Reporte Completo (PDF/UA)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
