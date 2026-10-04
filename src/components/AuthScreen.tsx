import React, { useState, useRef, useEffect } from 'react';
import { Screen, UserSession } from '../types';
import { api } from '../services/api';
import { useAnnouncer } from './LiveAnnouncer';

interface AuthScreenProps {
  onNavigate: (screen: Screen) => void;
  currentUser: UserSession | null;
  onLoginSuccess: (user: UserSession) => void;
  onLogout: () => void;
}

type AuthMode = 'login' | 'register' | 'recovery';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onNavigate,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const { announce } = useAnnouncer();
  const [mode, setMode] = useState<AuthMode>('login');

  // Login form state - prefilled with demo account for immediate accessible testing
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRemember, setLoginRemember] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAssistiveTech, setRegAssistiveTech] = useState('nvda');
  const [regHighContrast, setRegHighContrast] = useState(false);
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Recovery form state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccessMessage, setRecoverySuccessMessage] = useState<string | null>(null);

  // Alert and error states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus ref for error alerts and headings
  const errorAlertRef = useRef<HTMLDivElement>(null);
  const successAlertRef = useRef<HTMLDivElement>(null);
  const loginEmailInputRef = useRef<HTMLInputElement>(null);
  const regNameInputRef = useRef<HTMLInputElement>(null);
  const recoveryEmailInputRef = useRef<HTMLInputElement>(null);

  // Focus management on mode switch
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setRecoverySuccessMessage(null);

    if (mode === 'login') {
      loginEmailInputRef.current?.focus();
    } else if (mode === 'register') {
      regNameInputRef.current?.focus();
    } else if (mode === 'recovery') {
      recoveryEmailInputRef.current?.focus();
    }
  }, [mode]);

  // Handle mode switch with voice announcement
  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    if (newMode === 'login') {
      announce('Cambiado a formulario de Inicio de Sesión');
    } else if (newMode === 'register') {
      announce('Cambiado a formulario de Registro de Nueva Cuenta');
    } else if (newMode === 'recovery') {
      announce('Cambiado a formulario de Recuperación de Contraseña');
    }
  };

  // Helper validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Prioridad de Audio: Cancelar inmediatamente cualquier audio previo al hacer clic en Iniciar Sesión
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Validation
    if (!loginEmail.trim()) {
      const err = 'Por favor, introduce tu correo electrónico.';
      setErrorMessage(err);
      announce(`Error en el formulario: ${err}`);
      loginEmailInputRef.current?.focus();
      return;
    }

    if (!isValidEmail(loginEmail)) {
      const err = 'El formato del correo electrónico no es válido. Ejemplo: usuario@dominio.com';
      setErrorMessage(err);
      announce(`Error en el formulario: ${err}`);
      loginEmailInputRef.current?.focus();
      return;
    }

    if (!loginPassword) {
      const err = 'Por favor, introduce tu contraseña de acceso.';
      setErrorMessage(err);
      announce(`Error en el formulario: ${err}`);
      return;
    }

    if (loginPassword.length < 8) {
      const err = 'La contraseña debe contener al menos 8 caracteres.';
      setErrorMessage(err);
      announce(`Error en el formulario: ${err}`);
      return;
    }

    setIsSubmitting(true);
    announce('Verificando credenciales accesibles...');
    try {
      const user = await api.login(loginEmail.trim(), loginPassword);
      const succ = `¡Inicio de sesión exitoso! Bienvenido de nuevo, ${user.name}.`;
      setSuccessMessage(succ);
      onLoginSuccess(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
      setErrorMessage(message);
      announce(message, 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim()) {
      const err = 'Por favor, escribe tu nombre completo o de usuario.';
      setErrorMessage(err);
      announce(`Error en el formulario: ${err}`);
      regNameInputRef.current?.focus();
      return;
    }

    if (!regEmail.trim() || !isValidEmail(regEmail)) {
      const err = 'Por favor, introduce una dirección de correo electrónico válida.';
      setErrorMessage(err);
      announce(`Error en el formulario: ${err}`);
      return;
    }

    if (!regPassword || regPassword.length < 8) {
      const err = 'La contraseña debe tener al menos 8 caracteres para garantizar la seguridad.';
      setErrorMessage(err);
      announce(`Error en el formulario: ${err}`);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      const err = 'Las contraseñas no coinciden. Por favor, revísalas.';
      setErrorMessage(err);
      announce(`Error en el formulario: ${err}`);
      return;
    }

    if (!regTermsAccepted) {
      const err = 'Debes aceptar la Declaración de Accesibilidad y los Términos de Servicio para continuar.';
      setErrorMessage(err);
      announce(`Error en el formulario: ${err}`);
      return;
    }

    setIsSubmitting(true);
    announce('Creando cuenta accesible y guardando preferencias...');
    try {
      const user = await api.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        preferredAssistiveTech: regAssistiveTech,
        highContrastDefault: regHighContrast,
      });
      const succ = `¡Registro completado con éxito! Tu cuenta accesible para ${user.name} está lista.`;
      setSuccessMessage(succ);
      announce(succ);
      onLoginSuccess(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
      setErrorMessage(message);
      announce(message, 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Recovery submission
  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setRecoverySuccessMessage(null);

    if (!recoveryEmail.trim() || !isValidEmail(recoveryEmail)) {
      const err = 'Introduce un correo electrónico válido para enviar el enlace de recuperación.';
      setErrorMessage(err);
      announce(`Error: ${err}`);
      recoveryEmailInputRef.current?.focus();
      return;
    }

    const message = 'La recuperación por correo aún no está conectada a un servicio de envío.';
    setRecoverySuccessMessage(message);
    announce(message);
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-5 py-5 px-4 md:px-8 mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Ruta de navegación" className="text-xs flex items-center gap-1.5 border-b border-[#1E3A5F] pb-3 text-slate-300">
        {currentUser ? (
          <>
            <button
              type="button"
              onClick={() => {
                onNavigate('home');
                announce('Navegando a la página de inicio');
              }}
              aria-label="Enlace: Inicio, sección Ruta de navegación"
              data-speech="Enlace: Inicio, sección Ruta de navegación"
              className="hover:text-[#00FFFF] hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] rounded"
            >
              Inicio
            </button>
            <span aria-hidden="true" className="text-[#00FFFF]">/</span>
          </>
        ) : (
          <span className="text-slate-400 font-medium">SoftTech Market Acceso Seguro /</span>
        )}
        <span className="font-black text-[#FACC15]" aria-current="page">
          {mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Registro de Usuario' : 'Recuperar Contraseña'}
        </span>
      </nav>

      {/* Main Form Container Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
          borderRadius: '16px',
          boxShadow: '0 12px 30px -12px rgba(15, 23, 42, 0.24)',
        }}
        className="admin-auth-card border-2 p-5 sm:p-6 transition-all text-slate-900"
      >
        
        {/* If user is already logged in, show authenticated state */}
        {currentUser ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 p-5 bg-[#112240] border-2 border-[#00FFFF] rounded-xl">
              <div className="w-14 h-14 rounded-full bg-[#FACC15] text-[#0B192C] flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="inline-block px-3 py-0.5 bg-[#00FFFF] text-[#0B192C] font-black text-xs rounded-full mb-1 uppercase tracking-wider">
                  Sesión Activa
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Bienvenido, <span className="text-[#FACC15]">{currentUser.name}</span>
                </h1>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  {currentUser.email}
                </p>
                {currentUser.preferredAssistiveTech && (
                  <p className="text-xs text-slate-200 mt-1">
                    <span className="font-bold text-[#FACC15]">Tecnología Asistiva preferida:</span> {currentUser.preferredAssistiveTech}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  onNavigate('catalog');
                  announce('Navegando al catálogo de productos asistivos');
                }}
                aria-label="Botón: Explorar Catálogo Asistivo, ir a sección de productos"
                data-speech="Botón: Explorar Catálogo Asistivo, ir a sección de productos"
                className="py-3.5 px-5 bg-[#112240] hover:bg-[#1B3A60] text-white font-black text-sm rounded-xl border-2 border-[#00FFFF] transition-all focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF] flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[22px] text-[#FACC15]" aria-hidden="true">
                  storefront
                </span>
                Explorar Catálogo Asistivo
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('checkout');
                  announce('Navegando al carrito de compras');
                }}
                aria-label="Botón: Ver Mi Carrito de Compras, revisar pedido actual"
                data-speech="Botón: Ver Mi Carrito de Compras, revisar pedido actual"
                className="py-3.5 px-5 bg-[#FACC15] hover:bg-[#EAB308] text-[#0B192C] font-black text-sm rounded-xl border-2 border-[#FDE047] transition-all focus-visible:outline focus-visible:outline-3 focus-visible:outline-white flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                  shopping_bag
                </span>
                Ver Mi Carrito de Compras
              </button>
            </div>

            <div className="pt-5 border-t border-slate-700/80 flex flex-col sm:flex-row justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  announce('Has cerrado sesión correctamente');
                }}
                aria-label="Botón: Cerrar Sesión, finalizar sesión actual"
                data-speech="Botón: Cerrar Sesión, finalizar sesión actual"
                className="py-2.5 px-4 bg-red-950/80 hover:bg-red-900 text-red-200 border-2 border-red-500 rounded-xl font-bold text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  logout
                </span>
                Cerrar Sesión
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('support');
                  announce('Navegando a Centro de Asistencia');
                }}
                aria-label="Enlace: Centro de Asistencia Técnica, sección Soporte"
                data-speech="Enlace: Centro de Asistencia Técnica, sección Soporte"
                className="text-xs font-bold text-[#FACC15] underline hover:text-[#00FFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] rounded p-1"
              >
                Centro de Asistencia Técnica
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header / Brand of the module */}
            <div className="text-center mb-6">
              <span className="px-3.5 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black rounded-full inline-block mb-3 uppercase tracking-wider shadow-xs">
                Portal de Acceso Accesible WCAG 2.1 AAA
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {mode === 'login' && (
                  <>
                    Iniciar Sesión en <span className="text-indigo-600">SoftTech Market</span>
                  </>
                )}
                {mode === 'register' && (
                  <>
                    Crear Nueva Cuenta <span className="text-indigo-600">Accesible</span>
                  </>
                )}
                {mode === 'recovery' && (
                  <>
                    Recuperación de <span className="text-indigo-600">Contraseña</span>
                  </>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                {mode === 'login' && 'Accede a tu cuenta de cliente o administrador para gestionar tus productos y servicios.'}
                {mode === 'register' && 'Regístrate para guardar tu configuración accesible y acceder a soporte prioritario.'}
                {mode === 'recovery' && 'Indica tu correo electrónico registrado para enviarte un enlace de restablecimiento seguro.'}
              </p>
            </div>

            {/* Mode Switcher Tabs (Login vs Register) */}
            {mode !== 'recovery' && (
              <div
                role="tablist"
                aria-label="Seleccionar modo de acceso o registro"
                className="grid grid-cols-2 p-1.5 bg-slate-100 border-2 border-slate-200 rounded-xl mb-6 gap-1.5"
              >
                <button
                  id="tab-login"
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  aria-controls="auth-panel-login"
                  tabIndex={mode === 'login' ? 0 : -1}
                  onClick={() => handleSwitchMode('login')}
                  aria-label="Botón: Pestaña Iniciar Sesión, mostrar formulario de acceso"
                  data-speech="Botón: Pestaña Iniciar Sesión, mostrar formulario de acceso"
                  style={
                    mode === 'login'
                      ? {
                          backgroundColor: '#FACC15',
                          color: '#0B192C',
                          borderColor: '#FACC15',
                          boxShadow: '0 4px 12px rgba(250, 204, 21, 0.4)',
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: '#475569',
                        }
                  }
                  className={`py-3 px-4 text-xs sm:text-sm font-black rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-white ${
                    mode === 'login' ? '' : 'border-transparent hover:text-indigo-700 hover:bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    login
                  </span>
                  Iniciar Sesión
                </button>

                <button
                  id="tab-register"
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  aria-controls="auth-panel-register"
                  tabIndex={mode === 'register' ? 0 : -1}
                  onClick={() => handleSwitchMode('register')}
                  aria-label="Botón: Pestaña Registrarse, mostrar formulario de registro"
                  data-speech="Botón: Pestaña Registrarse, mostrar formulario de registro"
                  style={
                    mode === 'register'
                      ? {
                          backgroundColor: '#E0E7FF',
                          color: '#0B192C',
                          borderColor: '#00FFFF',
                          boxShadow: '0 4px 12px rgba(238, 255, 0, 0.86)',
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: '#475569',
                        }
                  }
                  className={`py-3 px-4 text-xs sm:text-sm font-black rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-white ${
                    mode === 'register' ? '' : 'border-transparent hover:text-indigo-700 hover:bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    person_add
                  </span>
                  Registrarse
                </button>
              </div>
            )}

            {/* Accessible Live Error Alert */}
            {errorMessage && (
              <div
                ref={errorAlertRef}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="mb-6 p-4 bg-red-950/90 border-2 border-red-500 text-white rounded-xl flex items-start gap-3 shadow-lg"
              >
                <span className="material-symbols-outlined text-red-400 text-[26px] shrink-0" aria-hidden="true">
                  error
                </span>
                <div className="flex-1">
                  <p className="font-black text-sm text-red-300">Error en los datos ingresados:</p>
                  <p className="text-xs mt-0.5 leading-relaxed text-slate-100">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  aria-label="Cerrar mensaje de error"
                  className="text-red-300 hover:text-white focus-visible:outline focus-visible:outline-2 rounded cursor-pointer p-1"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    close
                  </span>
                </button>
              </div>
            )}

            {/* Accessible Live Success Alert */}
            {successMessage && (
              <div
                ref={successAlertRef}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="mb-6 p-4 bg-emerald-50 border border-emerald-400 text-emerald-950 rounded-lg flex items-start gap-3"
              >
                <span className="material-symbols-outlined text-[#059669] text-[24px] shrink-0" aria-hidden="true">
                  check_circle
                </span>
                <div className="flex-1">
                  <p className="font-bold text-sm">Operación completada:</p>
                  <p className="text-xs mt-0.5 leading-relaxed">{successMessage}</p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* PANEL 1: INICIAR SESIÓN (LOGIN) */}
            {/* ========================================================= */}
            {mode === 'login' && (
              <div
                id="auth-panel-login"
                role="tabpanel"
                aria-labelledby="tab-login"
                className="space-y-5"
              >
                <form onSubmit={handleLoginSubmit} noValidate className="space-y-5">
                  {/* Correo Electrónico */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="login-email"
                      className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center justify-between"
                    >
                      <span>
                        Correo Electrónico <span className="text-[#FACC15]" aria-hidden="true">*</span>
                      </span>
                      <span className="text-[11px] font-normal text-slate-400 lowercase">
                        ej: usuario@correo.com
                      </span>
                    </label>
                    <input
                      ref={loginEmailInputRef}
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nombre@ejemplo.es"
                      aria-label="Campo interactivo: Correo Electrónico, ingresar dirección registrada"
                      data-speech="Campo interactivo: Correo Electrónico, ingresar dirección registrada"
                      aria-required="true"
                      aria-invalid={errorMessage ? 'true' : 'false'}
                      aria-describedby="login-email-hint"
                      style={{
                        backgroundColor: '#070F1E',
                      }}
                      className="w-full h-12 px-4 border-2 border-[#1E3A5F] rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#00FFFF] focus-visible:outline-offset-1 transition-all"
                    />
                    <span id="login-email-hint" className="text-[11px] text-slate-400">
                      Usa la dirección con la que compraste tus licencias asistivas.
                    </span>
                  </div>

                  {/* Contraseña */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="login-password"
                        className="text-xs font-black uppercase tracking-wider text-slate-200"
                      >
                        Contraseña <span className="text-[#FACC15]" aria-hidden="true">*</span>
                      </label>

                      {/* Enlace de recuperación de contraseña accesible por teclado */}
                      <button
                        id="btn-forgot-password"
                        type="button"
                        onClick={() => handleSwitchMode('recovery')}
                        aria-label="Enlace: ¿Olvidaste tu contraseña?, sección Recuperación"
                        data-speech="Enlace: ¿Olvidaste tu contraseña?, sección Recuperación"
                        className="text-xs font-bold text-[#FACC15] underline hover:text-[#00FFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] rounded cursor-pointer transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        id="login-password"
                        name="password"
                        type={showLoginPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        aria-label="Campo interactivo: Contraseña, ingresar clave secreta de cuenta"
                        data-speech="Campo interactivo: Contraseña, ingresar clave secreta de cuenta"
                        aria-required="true"
                        aria-invalid={errorMessage ? 'true' : 'false'}
                        style={{
                          backgroundColor: '#070F1E',
                        }}
                        className="w-full h-12 pl-4 pr-12 border-2 border-[#1E3A5F] rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#00FFFF] focus-visible:outline-offset-1 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !showLoginPassword;
                          setShowLoginPassword(nextState);
                          announce(nextState ? 'Contraseña visible en texto claro' : 'Contraseña oculta con caracteres protegidos');
                        }}
                        aria-label={showLoginPassword ? 'Botón: Ocultar contraseña en pantalla' : 'Botón: Mostrar contraseña en texto plano'}
                        data-speech={showLoginPassword ? 'Botón: Ocultar contraseña en pantalla' : 'Botón: Mostrar contraseña en texto plano'}
                        aria-pressed={showLoginPassword}
                        className="absolute right-2 p-2 text-[#00FFFF] hover:text-white rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                          {showLoginPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Recordar sesión */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      id="login-remember"
                      type="checkbox"
                      checked={loginRemember}
                      onChange={(e) => setLoginRemember(e.target.checked)}
                      aria-label="Campo interactivo: Recordar mi dispositivo accesible en futuras sesiones"
                      data-speech="Campo interactivo: Recordar mi dispositivo accesible en futuras sesiones"
                      className="w-4 h-4 rounded border-2 border-slate-600 bg-[#070F1E] accent-[#00FFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer"
                    />
                    <label htmlFor="login-remember" className="text-xs text-slate-200 select-none cursor-pointer font-medium">
                      Recordar mi dispositivo accesible en futuras sesiones
                    </label>
                  </div>

                  {/* Acciones principales: Iniciar Sesión y Registrarse */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      id="btn-login-submit"
                      type="submit"
                      disabled={isSubmitting}
                      aria-label="Botón: Iniciar Sesión, enviar credenciales e ingresar al sistema"
                      data-speech="Botón: Iniciar Sesión, enviar credenciales e ingresar al sistema"
                      style={{
                        backgroundColor: '#FACC15',
                        color: '#0B192C',
                        borderColor: '#FDE047',
                        boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4)',
                      }}
                      className="w-full py-4 px-6 disabled:opacity-50 font-black text-sm rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-105 active:scale-[0.99] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-white"
                    >
                      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                        {isSubmitting ? 'hourglass_top' : 'login'}
                      </span>
                      <span>
                        {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
                      </span>
                    </button>

                    <button
                      id="btn-login-to-register"
                      type="button"
                      onClick={() => handleSwitchMode('register')}
                      aria-label="Botón: Registrarse, cambiar a formulario de creación de cuenta"
                      data-speech="Botón: Registrarse, cambiar a formulario de creación de cuenta"
                      className="w-full py-4 px-6 bg-[#112240] hover:bg-[#1B3A60] text-white border-2 border-[#00FFFF] font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#00FFFF]"
                    >
                      <span className="material-symbols-outlined text-[22px] text-[#00FFFF]" aria-hidden="true">
                        person_add
                      </span>
                      <span>Registrarse</span>
                    </button>
                  </div>

                </form>

                {/* Footer Switcher */}
                <div className="mt-6 pt-6 border-t border-slate-700/80 text-center">
                  <p className="text-xs text-slate-300">
                    ¿Todavía no tienes una cuenta de cliente?{' '}
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('register')}
                      aria-label="Enlace: Regístrate gratis aquí, cambiar a registro de cuenta"
                      data-speech="Enlace: Regístrate gratis aquí, cambiar a registro de cuenta"
                      className="font-black text-[#00FFFF] underline hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] rounded cursor-pointer ml-1 transition-colors"
                    >
                      Regístrate gratis aquí
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* PANEL 2: REGISTRARSE (REGISTER) */}
            {/* ========================================================= */}
            {mode === 'register' && (
              <div
                id="auth-panel-register"
                role="tabpanel"
                aria-labelledby="tab-register"
                className="space-y-5"
              >
                <form onSubmit={handleRegisterSubmit} noValidate className="space-y-5">
                  {/* Nombre Completo */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="register-name"
                      className="text-xs font-black uppercase tracking-wider text-slate-200"
                    >
                      Nombre y Apellidos <span className="text-[#00FFFF]" aria-hidden="true">*</span>
                    </label>
                    <input
                      ref={regNameInputRef}
                      id="register-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ejemplo: Carmen Gómez"
                      aria-label="Campo interactivo: Nombre y Apellidos, ingresar tu nombre completo"
                      data-speech="Campo interactivo: Nombre y Apellidos, ingresar tu nombre completo"
                      aria-required="true"
                      style={{
                        backgroundColor: '#070F1E',
                      }}
                      className="w-full h-12 px-4 border-2 border-[#1E3A5F] rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#00FFFF] focus-visible:outline-offset-1 transition-all"
                    />
                  </div>

                  {/* Correo Electrónico */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="register-email"
                      className="text-xs font-black uppercase tracking-wider text-slate-200"
                    >
                      Correo Electrónico <span className="text-[#00FFFF]" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nombre@ejemplo.es"
                      aria-label="Campo interactivo: Correo Electrónico, ingresar correo para la nueva cuenta"
                      data-speech="Campo interactivo: Correo Electrónico, ingresar correo para la nueva cuenta"
                      aria-required="true"
                      style={{
                        backgroundColor: '#070F1E',
                      }}
                      className="w-full h-12 px-4 border-2 border-[#1E3A5F] rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#00FFFF] focus-visible:outline-offset-1 transition-all"
                    />
                  </div>

                  {/* Contraseña */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="register-password"
                      className="text-xs font-black uppercase tracking-wider text-slate-200"
                    >
                      Contraseña <span className="text-[#00FFFF]" aria-hidden="true">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="register-password"
                        name="password"
                        type={showRegPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        aria-label="Campo interactivo: Contraseña, definir clave de al menos 8 caracteres"
                        data-speech="Campo interactivo: Contraseña, definir clave de al menos 8 caracteres"
                        aria-required="true"
                        aria-describedby="register-password-rules"
                        style={{
                          backgroundColor: '#070F1E',
                        }}
                        className="w-full h-12 pl-4 pr-12 border-2 border-[#1E3A5F] rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#00FFFF] focus-visible:outline-offset-1 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !showRegPassword;
                          setShowRegPassword(nextState);
                          announce(nextState ? 'Contraseña mostrada' : 'Contraseña oculta');
                        }}
                        aria-label={showRegPassword ? 'Botón: Ocultar contraseña' : 'Botón: Ver contraseña'}
                        data-speech={showRegPassword ? 'Botón: Ocultar contraseña' : 'Botón: Ver contraseña'}
                        aria-pressed={showRegPassword}
                        className="absolute right-2 p-2 text-[#00FFFF] hover:text-white rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                          {showRegPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    <span id="register-password-rules" className="text-[11px] text-slate-400">
                      Debe contener al menos 8 caracteres para asegurar la protección de tus licencias.
                    </span>
                  </div>

                  {/* Confirmar Contraseña */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="register-confirm-password"
                      className="text-xs font-black uppercase tracking-wider text-slate-200"
                    >
                      Confirmar Contraseña <span className="text-[#00FFFF]" aria-hidden="true">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="register-confirm-password"
                        name="confirmPassword"
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        aria-label="Campo interactivo: Confirmar Contraseña, repetir la clave introducida"
                        data-speech="Campo interactivo: Confirmar Contraseña, repetir la clave introducida"
                        aria-required="true"
                        style={{
                          backgroundColor: '#070F1E',
                        }}
                        className="w-full h-12 pl-4 pr-12 border-2 border-[#1E3A5F] rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#00FFFF] focus-visible:outline-offset-1 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !showRegConfirmPassword;
                          setShowRegConfirmPassword(nextState);
                          announce(nextState ? 'Confirmación de contraseña mostrada' : 'Confirmación de contraseña oculta');
                        }}
                        aria-label={showRegConfirmPassword ? 'Botón: Ocultar confirmación' : 'Botón: Ver confirmación'}
                        data-speech={showRegConfirmPassword ? 'Botón: Ocultar confirmación' : 'Botón: Ver confirmación'}
                        aria-pressed={showRegConfirmPassword}
                        className="absolute right-2 p-2 text-[#00FFFF] hover:text-white rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                          {showRegConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Preferencias de Accesibilidad (Valor agregado para SoftTech Market) */}
                  <div className="p-4 bg-[#112240] border-2 border-[#1E3A5F] rounded-xl space-y-3">
                    <span className="block text-xs font-black uppercase tracking-wider text-[#00FFFF]">
                      Configuración Asistiva de tu Perfil (Opcional)
                    </span>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="register-tech" className="text-xs font-bold text-slate-200">
                        Tecnología asistiva principal:
                      </label>
                      <select
                        id="register-tech"
                        value={regAssistiveTech}
                        onChange={(e) => setRegAssistiveTech(e.target.value)}
                        aria-label="Campo interactivo: Tecnología asistiva principal, seleccionar lector o pulsador"
                        data-speech="Campo interactivo: Tecnología asistiva principal, seleccionar lector o pulsador"
                        style={{
                          backgroundColor: '#070F1E',
                        }}
                        className="h-11 px-3 border-2 border-[#1E3A5F] rounded-xl text-xs font-bold text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#00FFFF]"
                      >
                        <option value="nvda">NVDA (NonVisual Desktop Access)</option>
                        <option value="jaws">JAWS for Windows</option>
                        <option value="voiceover">Apple VoiceOver</option>
                        <option value="orca">Orca Screen Reader</option>
                        <option value="braille-display">Línea Braille Autónoma</option>
                        <option value="switch-access">Conmutadores / Pulsadores</option>
                        <option value="none">Sin tecnología asistiva específica</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <input
                        id="register-contrast-pref"
                        type="checkbox"
                        checked={regHighContrast}
                        onChange={(e) => setRegHighContrast(e.target.checked)}
                        aria-label="Campo interactivo: Activar por defecto el tema de alto contraste al iniciar sesión"
                        data-speech="Campo interactivo: Activar por defecto el tema de alto contraste al iniciar sesión"
                        className="w-4 h-4 rounded border-2 border-slate-600 bg-[#070F1E] accent-[#00FFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer"
                      />
                      <label htmlFor="register-contrast-pref" className="text-xs text-slate-200 cursor-pointer font-medium">
                        Activar por defecto el tema de alto contraste al iniciar sesión
                      </label>
                    </div>
                  </div>

                  {/* Términos y Condiciones */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      id="register-terms"
                      type="checkbox"
                      required
                      checked={regTermsAccepted}
                      onChange={(e) => setRegTermsAccepted(e.target.checked)}
                      aria-required="true"
                      aria-label="Campo interactivo: Acepto los Términos de Servicio y Declaración de Conformidad"
                      data-speech="Campo interactivo: Acepto los Términos de Servicio y Declaración de Conformidad"
                      className="w-4 h-4 mt-1 rounded border-2 border-slate-600 bg-[#070F1E] accent-[#00FFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer"
                    />
                    <label htmlFor="register-terms" className="text-xs text-slate-200 cursor-pointer leading-relaxed">
                      Acepto la Declaración de Conformidad de Accesibilidad EN 301 549, la Política de Privacidad de Datos y los Términos de Servicio de SoftTech Market. <span className="text-[#00FFFF]" aria-hidden="true">*</span>
                    </label>
                  </div>

                  {/* Botón de Envío de Registro */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-label="Botón: Crear Cuenta Accesible, registrar nuevo usuario en SoftTech Market"
                    data-speech="Botón: Crear Cuenta Accesible, registrar nuevo usuario en SoftTech Market"
                    style={{
                      backgroundColor: '#00FFFF',
                      color: '#0B192C',
                      borderColor: '#00FFFF',
                      boxShadow: '0 4px 14px rgba(0, 255, 255, 0.4)',
                    }}
                    className="w-full py-4 px-6 disabled:opacity-50 font-black text-sm rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-105 active:scale-[0.99] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-white"
                  >
                    <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                      {isSubmitting ? 'hourglass_top' : 'person_add'}
                    </span>
                    <span>
                      {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta Accesible'}
                    </span>
                  </button>
                </form>

                {/* Footer Switcher */}
                <div className="mt-6 pt-6 border-t border-slate-700/80 text-center">
                  <p className="text-xs text-slate-300">
                    ¿Ya posees una cuenta registrada?{' '}
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('login')}
                      aria-label="Enlace: Inicia sesión directamente, volver al formulario de acceso"
                      data-speech="Enlace: Inicia sesión directamente, volver al formulario de acceso"
                      className="font-black text-[#FACC15] underline hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FACC15] rounded cursor-pointer ml-1 transition-colors"
                    >
                      Inicia sesión directamente
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* PANEL 3: RECUPERACIÓN DE CONTRASEÑA (RECOVERY) */}
            {/* ========================================================= */}
            {mode === 'recovery' && (
              <div className="space-y-5">
                {recoverySuccessMessage ? (
                  <div className="p-6 bg-[#070F1E] border-2 border-[#00FFFF] rounded-xl text-center space-y-4 shadow-lg">
                    <span className="material-symbols-outlined text-[#00FFFF] text-[48px] block mx-auto" aria-hidden="true">
                      mark_email_read
                    </span>
                    <h2 className="text-lg font-black text-white">
                      Enlace de Recuperación Enviado
                    </h2>
                    <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                      {recoverySuccessMessage}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('login')}
                      aria-label="Botón: Volver a Iniciar Sesión, regresar al formulario de acceso"
                      data-speech="Botón: Volver a Iniciar Sesión, regresar al formulario de acceso"
                      style={{
                        backgroundColor: '#FACC15',
                        color: '#0B192C',
                        borderColor: '#FDE047',
                      }}
                      className="py-3 px-6 hover:brightness-105 font-black text-xs rounded-xl border-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer shadow-md"
                    >
                      Volver a Iniciar Sesión
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRecoverySubmit} noValidate className="space-y-5">
                    <div className="p-4 bg-[#112240] border-2 border-[#1E3A5F] rounded-xl text-xs text-slate-200 leading-relaxed">
                      <span className="font-black block mb-1 text-[#00FFFF] uppercase tracking-wide text-[11px]">Procedimiento Accesible de Recuperación:</span>
                      Te enviaremos un correo con un enlace accesible con tiempo de expiración extendido y un código auditivo para restablecer tu clave sin barreras.
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="recovery-email"
                        className="text-xs font-black uppercase tracking-wider text-slate-200"
                      >
                        Correo Electrónico Registrado <span className="text-[#00FFFF]" aria-hidden="true">*</span>
                      </label>
                      <input
                        ref={recoveryEmailInputRef}
                        id="recovery-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="tu-correo@ejemplo.com"
                        aria-label="Campo interactivo: Correo Electrónico Registrado, para enviar enlace de recuperación"
                        data-speech="Campo interactivo: Correo Electrónico Registrado, para enviar enlace de recuperación"
                        aria-required="true"
                        style={{
                          backgroundColor: '#070F1E',
                        }}
                        className="w-full h-12 px-4 border-2 border-[#1E3A5F] rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#00FFFF] focus-visible:outline-offset-1 transition-all"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        aria-label="Botón: Enviar Enlace de Recuperación, generar código auditivo y correo"
                        data-speech="Botón: Enviar Enlace de Recuperación, generar código auditivo y correo"
                        style={{
                          backgroundColor: '#FACC15',
                          color: '#0B192C',
                          borderColor: '#FDE047',
                          boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4)',
                        }}
                        className="flex-1 py-4 px-6 disabled:opacity-50 font-black text-sm rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-105 active:scale-[0.99] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-white"
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                          send
                        </span>
                        <span>{isSubmitting ? 'Enviando...' : 'Enviar Enlace de Recuperación'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSwitchMode('login')}
                        aria-label="Botón: Cancelar y Volver, regresar a inicio de sesión"
                        data-speech="Botón: Cancelar y Volver, regresar a inicio de sesión"
                        className="py-4 px-6 bg-[#112240] hover:bg-[#1B3A60] text-white font-black text-sm rounded-xl border-2 border-[#1E3A5F] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#00FFFF] cursor-pointer transition-colors"
                      >
                        Cancelar y Volver
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
