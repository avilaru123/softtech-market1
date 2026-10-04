import React from 'react';
import { Screen } from '../types';

interface FooterProps {
  onNavigate: (screen: Screen) => void;
  onOpenVpatModal: () => void;
  isLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenVpatModal, isLoggedIn = false }) => {
  return (
    <footer className="w-full bg-slate-800 border-t-4 border-indigo-600 py-10 mt-12 text-white">
      <div className="w-full px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {/* Company Column */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white tracking-tight">SoftTech Market</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Plataforma líder de licenciamiento y adquisición de soluciones digitales con accesibilidad nativa.
          </p>
        </div>

        {/* Navigation Column */}
        <div>
          <h2 className="text-xs font-black text-amber-400 mb-3 uppercase tracking-wider">
            Navegación
          </h2>
          <ul className="flex flex-col gap-2 p-0 list-none">
            {isLoggedIn ? (
              <>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('catalog')}
                    aria-label="Enlace: Catálogo Completo, sección Navegación del pie de página"
                    data-speech="Enlace: Catálogo Completo, sección Navegación del pie de página"
                    className="text-xs sm:text-sm text-slate-300 hover:text-indigo-300 hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                  >
                    Catálogo Completo
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('catalog')}
                    aria-label="Enlace: Lector de Pantallas y Herramientas, sección Navegación del pie de página"
                    data-speech="Enlace: Lector de Pantallas y Herramientas, sección Navegación del pie de página"
                    className="text-xs sm:text-sm text-slate-300 hover:text-indigo-300 hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                  >
                    Lector de Pantallas &amp; Herramientas
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('checkout')}
                    aria-label="Enlace: Carrito y Checkout, sección Navegación del pie de página"
                    data-speech="Enlace: Carrito y Checkout, sección Navegación del pie de página"
                    className="text-xs sm:text-sm text-slate-300 hover:text-indigo-300 hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
                  >
                    Carrito y Checkout
                  </button>
                </li>
              </>
            ) : null}
            <li>
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                aria-label={isLoggedIn ? "Enlace: Mi Cuenta, sección Navegación del pie de página" : "Enlace: Iniciar Sesión o Registro, sección Navegación del pie de página"}
                data-speech={isLoggedIn ? "Enlace: Mi Cuenta, sección Navegación del pie de página" : "Enlace: Iniciar Sesión o Registro, sección Navegación del pie de página"}
                className="text-xs sm:text-sm text-slate-300 hover:text-indigo-300 hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
              >
                {isLoggedIn ? 'Mi Cuenta' : 'Iniciar Sesión / Registro'}
              </button>
            </li>
          </ul>
        </div>

        {/* WCAG Compliance Column */}
        <div>
          <h2 className="text-xs font-black text-amber-400 mb-3 uppercase tracking-wider">
            Conformidad WCAG
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mb-3 leading-relaxed">
            Diseñado bajo las pautas WCAG 2.1 AAA para garantizar equidad en la navegación asistida.
          </p>
          <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-xs font-black rounded-lg shadow-md">
            Nivel AAA Certificado
          </span>
        </div>

        {/* Contact Column */}
        <div>
          <h2 className="text-xs font-black text-amber-400 mb-3 uppercase tracking-wider">
            Contacto y Ayuda
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mb-2">
            Atención técnica especializada 24/7 disponible.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('support')}
            aria-label="Enlace: Centro de Asistencia, sección Contacto y Ayuda"
            data-speech="Enlace: Centro de Asistencia, sección Contacto y Ayuda"
            className="text-xs sm:text-sm text-indigo-300 font-bold underline hover:text-indigo-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 cursor-pointer"
          >
            Centro de Asistencia
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full px-4 md:px-8 mt-10 pt-6 border-t border-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        <p className="text-xs text-slate-400">
          © 2026 SoftTech Market. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('support')}
            aria-label="Enlace: Términos y Condiciones, sección Legal del pie de página"
            data-speech="Enlace: Términos y Condiciones, sección Legal del pie de página"
            className="text-xs text-slate-300 hover:text-indigo-300 cursor-pointer hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
          >
            Términos y Condiciones
          </button>
          <button
            type="button"
            onClick={onOpenVpatModal}
            aria-label="Enlace: Declaración de Accesibilidad VPAT, sección Legal del pie de página"
            data-speech="Enlace: Declaración de Accesibilidad VPAT, sección Legal del pie de página"
            className="text-xs text-slate-300 hover:text-indigo-300 cursor-pointer hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
          >
            Declaración de Accesibilidad (VPAT)
          </button>
        </div>
      </div>
    </footer>
  );
};
