import React from 'react';
import { Screen, UserSession } from '../types';
import { useAnnouncer } from './LiveAnnouncer';

interface HeaderProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  cartCount: number;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  fontSizePercentage: number;
  onChangeFontSize: (delta: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  currentUser?: UserSession | null;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  cartCount,
  isHighContrast,
  onToggleHighContrast,
  fontSizePercentage,
  onChangeFontSize,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  currentUser,
  isLoggedIn = false,
  onLogout,
}) => {
  const { announce } = useAnnouncer();

  // COLORES DEL ENCABEZADO: modifica bg-white, text-slate-900 y border-slate-200 para cambiar la barra superior.
  return (
    <header className="fixed top-0 w-full z-40 bg-white text-slate-900 shadow-md border-b border-slate-200">
      {/* Top Accessibility Bar */}
      <div className="bg-indigo-50 border-b border-indigo-100 px-4 md:px-8">
        <div className="w-full flex items-center justify-between py-1.5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="text-xs uppercase font-black tracking-wider text-indigo-700">
              Accesibilidad AAA:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-contrast-toggle"
                type="button"
                aria-pressed={isHighContrast}
                onClick={onToggleHighContrast}
                aria-label="Botón: Alto Contraste, alternar modo de máximo contraste"
                data-speech="Botón: Alto Contraste, alternar modo de máximo contraste"
                className={`px-3 py-1 text-xs font-black rounded-lg cursor-pointer transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 ${
                  isHighContrast
                    ? 'bg-[#ffff00] text-[#000000] border-2 border-[#000000]'
                    : 'bg-white text-indigo-700 hover:bg-indigo-100 border-2 border-indigo-400'
                }`}
              >
                {isHighContrast ? 'Modo Normal' : 'Alto Contraste'}
              </button>

              <div
                role="group"
                aria-label="Controles de tamaño del texto"
                className="flex items-center gap-1"
              >
                <button
                  id="btn-font-dec"
                  type="button"
                  aria-label="Botón: Disminuir tamaño de texto, reducir escala de fuentes"
                  data-speech="Botón: Disminuir tamaño de texto, reducir escala de fuentes"
                  onClick={() => onChangeFontSize(-10)}
                  disabled={fontSizePercentage <= 80}
                  className="px-2.5 py-0.5 bg-white text-slate-700 font-mono text-xs font-bold rounded-lg hover:bg-indigo-50 border border-indigo-200 disabled:opacity-40 cursor-pointer focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2"
                >
                  A-
                </button>
                <span className="text-[11px] font-mono text-indigo-600 px-1 select-none font-black" aria-hidden="true">
                  {fontSizePercentage}%
                </span>
                <button
                  id="btn-font-inc"
                  type="button"
                  aria-label="Botón: Aumentar tamaño de texto, incrementar escala de fuentes"
                  data-speech="Botón: Aumentar tamaño de texto, incrementar escala de fuentes"
                  onClick={() => onChangeFontSize(10)}
                  disabled={fontSizePercentage >= 150}
                  className="px-2.5 py-0.5 bg-white text-slate-700 font-mono text-xs font-bold rounded-lg hover:bg-indigo-50 border border-indigo-200 disabled:opacity-40 cursor-pointer focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2"
                >
                  A+
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-bold hidden sm:flex">
              <span className="material-symbols-outlined text-[16px] text-indigo-500" aria-hidden="true">
                verified_user
              </span>
              <span>Soporte Oficial Certificado WCAG 2.1 AAA</span>
            </span>

            <button
              type="button"
              onClick={() => {
                onNavigate('admin');
                announce('Accediendo al Panel de Administración');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-400/40 rounded-lg text-[11px] font-extrabold cursor-pointer transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[15px] text-indigo-200">shield_person</span>
              <span>Modo Administrador</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="h-20 w-full px-4 md:px-8 flex items-center justify-between gap-6 max-w-7xl mx-auto">
        {/* Brand Logo */}
        <div className="flex items-center shrink-0">
          <button
            id="header-brand-logo-btn"
            type="button"
            onClick={() => {
              onNavigate('home');
              announce('Navegando a la página de inicio');
            }}
            aria-label="Logotipo de SoftTech Market. Volver al inicio"
            data-speech="Logotipo de SoftTech Market. Volver al inicio"
            className="flex items-center gap-3 text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 rounded-xl cursor-pointer p-1.5 transition-all hover:opacity-90"
          >
            <div className="flex items-center gap-3">
              <svg
                width="48"
                height="48"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Logotipo de SoftTech Market"
                className="shrink-0"
              >
                {/* Fondo circular blanco/índigo con borde índigo */}
                <circle cx="50" cy="50" r="46" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="4" />
                {/* Símbolo de tecnología y accesibilidad */}
                <circle cx="50" cy="28" r="8" fill="#4F46E5" /> {/* Cabeza */}
                <path d="M30 45 C 30 40, 70 40, 70 45 L62 78 C 62 82, 38 82, 38 78 Z" fill="#059669" /> {/* Cuerpo */}
                {/* Brazo izquierdo/Onda de tecnología */}
                <path d="M25 48 Q 15 50 20 62" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" />
                {/* Brazo derecho/Onda de audio */}
                <path d="M75 48 Q 85 50 80 62" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div className="flex flex-col text-left">
                <span className="text-2xl font-extrabold tracking-wide text-slate-900 leading-tight">
                  Soft<span className="text-indigo-600">Tech</span>
                </span>
                <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase leading-tight">
                  Market • Accesible
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Accessible Search Form */}
        <form
          role="search"
          onSubmit={onSearchSubmit}
          className="flex-1 max-w-xl mx-2 sm:mx-6 flex flex-col justify-center"
        >
          <label
            htmlFor="site-search"
            className="sr-only"
          >
            Buscar productos asistivos
          </label>
          <div className="relative flex items-center w-full">
            <input
              id="site-search"
              name="q"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar software, licencias o accesibilidad..."
              aria-label="Campo interactivo: Buscar productos asistivos, ingresar término de búsqueda"
              data-speech="Campo interactivo: Buscar productos asistivos, ingresar término de búsqueda"
              className="w-full h-11 pl-4 pr-12 bg-slate-50 text-slate-900 text-sm sm:text-base rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-indigo-500 placeholder:text-slate-400 font-medium transition-all shadow-inner"
            />
            <button
              type="submit"
              aria-label="Botón: Buscar productos asistivos, realizar consulta en catálogo"
              data-speech="Botón: Buscar productos asistivos, realizar consulta en catálogo"
              className="absolute right-1.5 w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                search
              </span>
            </button>
          </div>
        </form>

        {/* User, Cart and Admin Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Botón Administrador */}
          <button
            id="btn-header-admin"
            type="button"
            onClick={() => {
              onNavigate('admin');
              announce('Abriendo panel de administración de la tienda');
            }}
            aria-label="Botón: Panel de Administración, acceder a la gestión de tienda"
            data-speech="Botón: Panel de Administración, acceder a la gestión de tienda"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs sm:text-sm rounded-xl border border-indigo-300/40 shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              admin_panel_settings
            </span>
            <span>Admin</span>
          </button>

          {/* Botón de Carrito */}
          <button
            id="btn-header-cart"
            type="button"
            onClick={() => {
              onNavigate('checkout');
              announce(`Abriendo carrito de compras con ${cartCount} productos`);
            }}
            aria-label={`Botón: Carrito de compras, ${cartCount} productos acumulados`}
            data-speech={`Botón: Carrito de compras, ${cartCount} productos acumulados`}
            className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs sm:text-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-slate-800 cursor-pointer shadow-md transition-all border-2 border-amber-400"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              shopping_bag
            </span>
            <span className="hidden sm:inline">Carrito</span>
            <span
              aria-live="polite"
              className="ml-0.5 px-2 py-0.5 bg-white text-amber-600 font-black text-xs rounded-full min-w-[20px] text-center shadow-xs"
            >
              {cartCount}
              <span className="sr-only"> productos en el carrito</span>
            </span>
          </button>

          {isLoggedIn && (
            <>
              {/* Usuario identificado */}
              {currentUser && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-slate-800">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600" aria-hidden="true">person</span>
                  <span className="font-bold text-emerald-700 truncate max-w-[120px]">{currentUser.name}</span>
                </div>
              )}
              {/* Botón "Cerrar Sesión" */}
              {onLogout && (
                <button
                  id="btn-header-logout"
                  type="button"
                  onClick={() => {
                    onLogout();
                    announce('Has cerrado sesión correctamente.');
                  }}
                  aria-label="Botón: Cerrar Sesión, desconectar cuenta de usuario"
                  data-speech="Botón: Cerrar Sesión, desconectar cuenta de usuario"
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all focus-visible:outline focus-visible:outline-3 focus-visible:outline-slate-800 cursor-pointer shadow-sm border border-rose-400/40 hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    logout
                  </span>
                  <span className="hidden sm:inline whitespace-nowrap">Cerrar Sesión</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav
        aria-label="Navegación principal"
        className="w-full border-t border-slate-100 bg-white px-4 py-2 shadow-sm md:px-8 lg:fixed lg:bottom-0 lg:left-0 lg:top-36 lg:z-40 lg:w-64 lg:overflow-y-auto lg:border-r lg:border-t-0 lg:px-4 lg:py-5"
      >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 overflow-x-auto lg:flex-col lg:items-stretch lg:justify-start lg:overflow-x-visible">
            <button
              type="button"
              onClick={() => {
                onNavigate('home');
                announce('Navegando a Inicio');
              }}
              aria-current={currentScreen === 'home' ? 'page' : undefined}
              aria-label="Enlace: Inicio, sección Navegación principal"
              data-speech="Enlace: Inicio, sección Navegación principal"
              className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-xl text-xs sm:text-sm text-center justify-center cursor-pointer whitespace-nowrap focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 transition-all lg:w-full lg:flex-none lg:text-left lg:justify-start ${
                currentScreen === 'home'
                  ? 'bg-indigo-600 text-white font-black shadow-md border-2 border-indigo-600'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold border-2 border-transparent'
              }`}
            >
              Inicio
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('catalog');
                announce('Navegando al Catálogo');
              }}
              aria-current={currentScreen === 'catalog' ? 'page' : undefined}
              aria-label="Enlace: Catálogo, sección Navegación principal"
              data-speech="Enlace: Catálogo, sección Navegación principal"
              className={`flex-1 min-w-[100px] py-1.5 px-3 rounded-xl text-xs sm:text-sm text-center justify-center cursor-pointer whitespace-nowrap focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 transition-all lg:w-full lg:flex-none lg:text-left lg:justify-start ${
                currentScreen === 'catalog'
                  ? 'bg-indigo-600 text-white font-black shadow-md border-2 border-indigo-600'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold border-2 border-transparent'
              }`}
            >
              Catálogo
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('checkout');
                announce('Navegando a Carrito y Checkout');
              }}
              aria-current={currentScreen === 'checkout' ? 'page' : undefined}
              aria-label="Enlace: Carrito y Checkout, sección Navegación principal"
              data-speech="Enlace: Carrito y Checkout, sección Navegación principal"
              className={`flex-1 min-w-[130px] py-1.5 px-3 rounded-xl text-xs sm:text-sm text-center justify-center cursor-pointer whitespace-nowrap focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 transition-all lg:w-full lg:flex-none lg:text-left lg:justify-start ${
                currentScreen === 'checkout'
                  ? 'bg-indigo-600 text-white font-black shadow-md border-2 border-indigo-600'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold border-2 border-transparent'
              }`}
            >
              Carrito y Checkout
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('support');
                announce('Navegando a Soporte');
              }}
              aria-current={currentScreen === 'support' ? 'page' : undefined}
              aria-label="Enlace: Soporte, sección Navegación principal"
              data-speech="Enlace: Soporte, sección Navegación principal"
              className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-xl text-xs sm:text-sm text-center justify-center cursor-pointer whitespace-nowrap focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 transition-all lg:w-full lg:flex-none lg:text-left lg:justify-start ${
                currentScreen === 'support'
                  ? 'bg-indigo-600 text-white font-black shadow-md border-2 border-indigo-600'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold border-2 border-transparent'
              }`}
            >
              Soporte
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('auth');
                announce('Navegando a Mi Cuenta');
              }}
              aria-current={currentScreen === 'auth' ? 'page' : undefined}
              aria-label="Enlace: Mi Cuenta, sección Navegación principal"
              data-speech="Enlace: Mi Cuenta, sección Navegación principal"
              className={`flex-1 min-w-[110px] py-1.5 px-3 rounded-xl text-xs sm:text-sm text-center justify-center cursor-pointer whitespace-nowrap focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 transition-all lg:w-full lg:flex-none lg:text-left lg:justify-start ${
                currentScreen === 'auth'
                  ? 'bg-indigo-600 text-white font-black shadow-md border-2 border-indigo-600'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold border-2 border-transparent'
              }`}
            >
              {currentUser ? 'Mi Cuenta' : 'Iniciar Sesión / Registro'}
            </button>
          </div>
      </nav>
    </header>
  );
};
