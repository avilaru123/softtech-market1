import React, { useState } from 'react';
import { useAnnouncer } from './LiveAnnouncer';

interface SpecialistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpecialistModal: React.FC<SpecialistModalProps> = ({ isOpen, onClose }) => {
  const { announce } = useAnnouncer();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('braille');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    announce('Solicitud de asesoría técnica enviada con éxito. Un ingeniero de accesibilidad se pondrá en contacto en menos de 24 horas.', 'assertive');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="specialist-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        style={{
          backgroundColor: '#0B192C',
          borderColor: '#00FFFF',
        }}
        className="relative w-full max-w-xl border-2 rounded-2xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto text-white"
      >
        <div className="flex items-start justify-between pb-3.5 border-b border-[#1E3A5F]">
          <div>
            <span className="px-3 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/50 text-xs font-black rounded-full uppercase tracking-wider">
              Soporte Asistivo Certificado
            </span>
            <h2 id="specialist-modal-title" className="text-xl font-black text-white mt-1.5">
              Asesoramiento Técnico Personalizado
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Botón: Cerrar diálogo de asesoría técnica"
            data-speech="Botón: Cerrar diálogo de asesoría técnica"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#112240] hover:bg-[#1B3A60] text-white border border-[#1E3A5F] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-[#00FFFF]/20 text-[#00FFFF] border-2 border-[#00FFFF] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[36px]" aria-hidden="true">check_circle</span>
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              ¡Solicitud Registrada con Éxito!
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
              Gracias, <strong className="text-[#FACC15]">{name}</strong>. Un especialista en tecnología accesible de SoftTech analizará tus necesidades y se comunicará contigo vía <strong className="text-[#00FFFF]">{email}</strong> o teléfono en menos de 24 horas laborables.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              aria-label="Botón: Cerrar y Volver a la Tienda"
              data-speech="Botón: Cerrar y Volver a la Tienda"
              style={{
                backgroundColor: '#FACC15',
                color: '#0B192C',
                borderColor: '#FDE047',
              }}
              className="px-6 py-3 border-2 font-black text-sm rounded-xl transition-all hover:brightness-105 active:scale-[0.99] focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer shadow-md"
            >
              Cerrar y Volver a la Tienda
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Nuestros ingenieros de accesibilidad te asesoran gratuitamente para seleccionar la solución adaptada a tu entorno laboral, académico o doméstico.
            </p>

            <div>
              <label htmlFor="spec-name" className="block text-xs font-black uppercase text-slate-200 mb-1 tracking-wider">
                Nombre y Apellidos <span className="text-[#00FFFF]" aria-hidden="true">*</span>
              </label>
              <input
                id="spec-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Laura Gómez"
                aria-label="Campo interactivo: Nombre y Apellidos"
                data-speech="Campo interactivo: Nombre y Apellidos"
                style={{ backgroundColor: '#070F1E' }}
                className="w-full h-11 px-3.5 border-2 border-[#1E3A5F] rounded-xl focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF] text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="spec-email" className="block text-xs font-black uppercase text-slate-200 mb-1 tracking-wider">
                  Correo Electrónico <span className="text-[#00FFFF]" aria-hidden="true">*</span>
                </label>
                <input
                  id="spec-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@ejemplo.com"
                  aria-label="Campo interactivo: Correo Electrónico"
                  data-speech="Campo interactivo: Correo Electrónico"
                  style={{ backgroundColor: '#070F1E' }}
                  className="w-full h-11 px-3.5 border-2 border-[#1E3A5F] rounded-xl focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF] text-sm text-white"
                />
              </div>

              <div>
                <label htmlFor="spec-phone" className="block text-xs font-black uppercase text-slate-200 mb-1 tracking-wider">
                  Teléfono de Contacto
                </label>
                <input
                  id="spec-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  aria-label="Campo interactivo: Teléfono de Contacto"
                  data-speech="Campo interactivo: Teléfono de Contacto"
                  style={{ backgroundColor: '#070F1E' }}
                  className="w-full h-11 px-3.5 border-2 border-[#1E3A5F] rounded-xl focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF] text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="spec-category" className="block text-xs font-black uppercase text-slate-200 mb-1 tracking-wider">
                Área de Interés Principal
              </label>
              <select
                id="spec-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Selector interactivo: Área de Interés Principal"
                data-speech="Selector interactivo: Área de Interés Principal"
                style={{ backgroundColor: '#070F1E' }}
                className="w-full h-11 px-3.5 border-2 border-[#1E3A5F] rounded-xl focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF] text-sm text-white"
              >
                <option value="braille">Líneas y Displays Braille</option>
                <option value="screen-reader">Lectores de Pantalla y Software de Voz</option>
                <option value="input">Teclados Adaptados y Pulsadores</option>
                <option value="eye-gaze">Control Ocular (Eye-tracking)</option>
                <option value="ceapat">Tramitación de Subvenciones Públicas (CEAPAT)</option>
              </select>
            </div>

            <div>
              <label htmlFor="spec-message" className="block text-xs font-black uppercase text-slate-200 mb-1 tracking-wider">
                Detalles o Necesidades Específicas
              </label>
              <textarea
                id="spec-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Indica el sistema operativo, lector de pantalla actual o requerimientos de accesibilidad..."
                aria-label="Campo interactivo: Detalles o Necesidades Específicas"
                data-speech="Campo interactivo: Detalles o Necesidades Específicas"
                style={{ backgroundColor: '#070F1E' }}
                className="w-full p-3.5 border-2 border-[#1E3A5F] rounded-xl focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF] text-sm text-white"
              />
            </div>

            <div className="pt-3 border-t border-[#1E3A5F] flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                aria-label="Botón: Cancelar solicitud"
                data-speech="Botón: Cancelar solicitud"
                className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white border border-[#1E3A5F] rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                aria-label="Botón: Solicitar Asesoría Gratuita, enviar formulario de consulta"
                data-speech="Botón: Solicitar Asesoría Gratuita, enviar formulario de consulta"
                style={{
                  backgroundColor: '#00FFFF',
                  color: '#0B192C',
                  borderColor: '#00FFFF',
                }}
                className="px-6 py-2.5 border-2 font-black rounded-xl text-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer shadow-md transition-all hover:brightness-105 active:scale-[0.99]"
              >
                Solicitar Asesoría Gratuita
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
