import React, { useState, useEffect } from 'react';
import { CartItem, Screen, Product, UserSession } from '../types';
import { useAnnouncer } from './LiveAnnouncer';
import { formatCop } from '../utils/currency';
import { api } from '../services/api';

interface CheckoutScreenProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigate: (screen: Screen) => void;
  onCompleteOrder: (orderData: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    totalAmount: string;
    itemCount: number;
  }) => void;
  isLoggedIn?: boolean;
  currentUser?: UserSession | null;
  onLoginSuccess?: (user: UserSession) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigate,
  onCompleteOrder,
  isLoggedIn = false,
  currentUser = null,
  onLoginSuccess,
}) => {
  const { announce } = useAnnouncer();

  // Form states - initialize with currentUser if available
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerAddress, setCustomerAddress] = useState('Calle Gran Vía 42, 3º B, 28013 Madrid');
  const [customerPhone, setCustomerPhone] = useState('+34 654 321 098');
  const [deliveryNotes, setDeliveryNotes] = useState('Avisar por mensaje de texto 15 minutos antes de la entrega.');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'ceapat'>('card');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync user data whenever currentUser updates
  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name);
      setCustomerEmail(currentUser.email);
    }
  }, [currentUser]);

  // Inline checkout authentication state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineName, setInlineName] = useState('');
  const [inlineShowPassword, setInlineShowPassword] = useState(false);
  const [inlineAuthError, setInlineAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineAuthError(null);
    if (!inlineEmail.trim() || !inlinePassword.trim()) {
      setInlineAuthError('Por favor, ingresa tu correo electrónico y tu contraseña.');
      announce('Error: Ingresa correo y contraseña para continuar', 'assertive');
      return;
    }
    setIsAuthenticating(true);
    try {
      const user = await api.login(inlineEmail.trim(), inlinePassword);
      onLoginSuccess?.(user);
      announce(`¡Sesión iniciada correctamente! Bienvenido ${user.name}. Continuando con los datos de compra.`, 'assertive');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
      setInlineAuthError(message);
      announce(message, 'assertive');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineAuthError(null);
    if (!inlineName.trim() || !inlineEmail.trim() || !inlinePassword.trim()) {
      setInlineAuthError('Por favor, completa nombre, correo y contraseña.');
      announce('Error: Completa todos los campos obligatorios del registro', 'assertive');
      return;
    }
    if (inlinePassword.length < 8) {
      setInlineAuthError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setIsAuthenticating(true);
    try {
      const user = await api.register({ name: inlineName.trim(), email: inlineEmail.trim(), password: inlinePassword });
      onLoginSuccess?.(user);
      announce(`¡Cuenta creada con éxito! Bienvenido ${user.name}. Continuando con los datos de compra.`, 'assertive');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
      setInlineAuthError(message);
      announce(message, 'assertive');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const formatPrice = (amount: number) => {
    return formatCop(amount);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      announce('El carrito está vacío. Agrega productos antes de finalizar la compra.', 'assertive');
      return;
    }

    if (!termsAccepted) {
      announce('Por favor, acepta los términos de compra y política accesible.', 'assertive');
      return;
    }

    setIsProcessing(true);
    announce('Guardando el pedido. El pago quedará pendiente en esta versión.', 'polite');
    try {
      const order = await api.createOrder({
        customerName: customerName.trim() || 'Cliente SoftTech',
        customerEmail: customerEmail.trim() || 'cliente@softtech.es',
        address: customerAddress,
        phone: customerPhone,
        deliveryNotes,
        paymentMethod,
        items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      });
      onCompleteOrder({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        totalAmount: formatPrice(order.totalAmount),
        itemCount: order.itemCount,
      });
      announce(`Pedido #${order.orderNumber} guardado y pendiente de pago.`, 'assertive');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el pedido.';
      announce(message, 'assertive');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="sky-theme checkout-light w-full flex flex-col gap-6 py-6 px-4 md:px-8 max-w-7xl mx-auto text-slate-900">
      {/* Breadcrumbs & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E3A5F] pb-3">
        <nav aria-label="Ruta de navegación" className="text-xs text-slate-300 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            aria-label="Enlace: Inicio, sección Ruta de navegación"
            data-speech="Enlace: Inicio, sección Ruta de navegación"
            className="hover:text-[#00FFFF] hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] rounded"
          >
            Inicio
          </button>
          <span aria-hidden="true" className="text-[#00FFFF]">&gt;</span>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            aria-label="Enlace: Catálogo, sección Ruta de navegación"
            data-speech="Enlace: Catálogo, sección Ruta de navegación"
            className="hover:text-[#00FFFF] hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] rounded"
          >
            Catálogo
          </button>
          <span aria-hidden="true" className="text-[#00FFFF]">&gt;</span>
          <span className="font-black text-[#FACC15]" aria-current="page">
            Carrito y Finalizar Compra
          </span>
        </nav>

        <span className="inline-flex items-center gap-1.5 text-xs text-[#00FFFF] font-bold px-3 py-1 bg-[#112240] border border-[#00FFFF]/40 rounded-full">
          <span className="material-symbols-outlined text-[16px] text-[#FACC15]" aria-hidden="true">verified_user</span>
          CONFORMIDAD LEGAL WCAG 2.1 Nivel AAA (7:1)
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Tu Carrito y Proceso de Pedido
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          El pedido se guardará en la base de datos. El pago queda pendiente y esta versión no solicita datos de tarjeta.
        </p>
      </div>

      {/* Main 2-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart items & Assistance (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Cart Box */}
          <div
            style={{
              backgroundColor: '#0B192C',
              borderColor: '#00FFFF',
              borderRadius: '16px',
            }}
            className="border-2 p-5 sm:p-6 shadow-lg"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#1E3A5F]">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-[#FACC15]" aria-hidden="true">
                  shopping_cart
                </span>
                <span>Artículos en tu Carrito ({totalItemsCount} productos)</span>
              </h2>

              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClearCart();
                    announce('Carrito vaciado');
                  }}
                  aria-label="Botón: Vaciar carrito, eliminar todos los productos seleccionados"
                  data-speech="Botón: Vaciar carrito, eliminar todos los productos seleccionados"
                  className="text-xs text-red-400 hover:text-red-300 font-bold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 rounded cursor-pointer flex items-center gap-1 p-1"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete_sweep</span>
                  <span>Vaciar carrito</span>
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-[48px] text-slate-500" aria-hidden="true">
                  remove_shopping_cart
                </span>
                <p className="text-base font-black text-white mt-2">
                  Tu carrito está actualmente vacío
                </p>
                <p className="text-xs text-slate-300 mt-1 mb-4">
                  Explora nuestro catálogo para encontrar hardware o software asistivo certificado.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  aria-label="Botón: Explorar Catálogo, ir a la sección de productos asistivos"
                  data-speech="Botón: Explorar Catálogo, ir a la sección de productos asistivos"
                  className="px-5 py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-[#0B192C] font-black text-xs rounded-xl border-2 border-white focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer transition-all shadow-md"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#1E3A5F]">
                {cartItems.map((item) => (
                  <article
                    key={item.product.id}
                    className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-20 h-20 bg-[#070F1E] rounded-xl overflow-hidden border-2 border-[#1E3A5F] shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.imageAlt}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono uppercase font-black text-[#00FFFF]">
                          {item.product.shortCategory}
                        </span>
                        <h3 className="text-sm font-black text-white leading-tight">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-slate-300 line-clamp-1">
                          {item.product.specs[0]?.label}: {item.product.specs[0]?.value}
                        </p>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.product.warrantyInfo || 'Garantía oficial y entrega asegurada'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0">
                      {/* Price per item */}
                      <div className="text-left sm:text-right">
                        <span className="text-base font-black text-[#FACC15] block">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({item.product.priceFormatted} / ud.)
                        </span>
                      </div>

                      {/* Quantity buttons */}
                      <div
                        role="group"
                        aria-label={`Modificar cantidad para ${item.product.name}`}
                        className="flex items-center border-2 border-[#1E3A5F] rounded-xl bg-[#070F1E] overflow-hidden"
                      >
                        <button
                          type="button"
                          aria-label={`Botón: Disminuir cantidad de ${item.product.name}, reducir una unidad`}
                          data-speech={`Botón: Disminuir cantidad de ${item.product.name}, reducir una unidad`}
                          onClick={() => {
                            onUpdateQuantity(item.product.id, -1);
                            announce(`Cantidad disminuida a ${item.quantity - 1}`);
                          }}
                          className="w-9 h-9 flex items-center justify-center bg-[#112240] hover:bg-[#1B3A60] text-white font-black text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer transition-colors"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-xs font-mono font-black select-none text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Botón: Aumentar cantidad de ${item.product.name}, añadir una unidad`}
                          data-speech={`Botón: Aumentar cantidad de ${item.product.name}, añadir una unidad`}
                          onClick={() => {
                            onUpdateQuantity(item.product.id, 1);
                            announce(`Cantidad aumentada a ${item.quantity + 1}`);
                          }}
                          className="w-9 h-9 flex items-center justify-center bg-[#112240] hover:bg-[#1B3A60] text-white font-black text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove item button */}
                      <button
                        type="button"
                        aria-label={`Botón: Eliminar ${item.product.name} del carrito`}
                        data-speech={`Botón: Eliminar ${item.product.name} del carrito`}
                        onClick={() => {
                          onRemoveItem(item.product.id);
                          announce(`Eliminado ${item.product.name} del carrito`);
                        }}
                        className="p-2 text-slate-400 hover:text-red-400 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Bottom row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-2 border-t border-[#1E3A5F]">
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                aria-label="Enlace: Seguir explorando el catálogo, volver a los productos"
                data-speech="Enlace: Seguir explorando el catálogo, volver a los productos"
                className="text-xs font-bold text-[#FACC15] hover:text-white flex items-center gap-1.5 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FACC15] rounded cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
                <span>Seguir explorando el catálogo</span>
              </button>

              <span className="text-xs text-[#00FFFF] flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">lock</span>
                Conexión cifrada TLS 1.3 de extremo a extremo
              </span>
            </div>
          </div>

          {/* Accessible Pre-adaptation Callout Card */}
          <section
            aria-label="Servicio de adaptación técnica gratuita"
            className="bg-[#112240] border-2 border-[#1E3A5F] rounded-2xl p-5 flex items-start gap-4 shadow-md"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FACC15] text-[#0B192C] flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">construction</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                ¿Necesitas adaptaciones previas al envío?
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Podemos preconfigurar perfiles de voz, instalar scripts para NVDA/JAWS o rotular embalajes en braille antes de la expedición sin coste adicional.
              </p>
              <span className="inline-block mt-2.5 px-3 py-1 bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/50 text-[10px] font-black rounded-lg uppercase tracking-wider">
                SERVICIO GRATUITO INCLUIDO PARA CLIENTES SOFTTECH
              </span>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary & Checkout Form (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Order Summary Card */}
          <div
            style={{
              backgroundColor: '#0B192C',
              borderColor: '#00FFFF',
              borderRadius: '16px',
            }}
            className="border-2 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F]">
              <h2 className="text-lg font-black text-white">
                Resumen del Pedido
              </h2>
              <span className="px-3 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/50 text-[10px] font-black rounded-full uppercase tracking-wider">
                SIN COMISIONES
              </span>
            </div>

            <div className="divide-y divide-[#1E3A5F] text-xs py-3 space-y-2">
              <div className="flex justify-between pt-2">
                <span className="text-slate-300">Subtotal productos:</span>
                <span className="font-bold text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between pt-2 text-[#00FFFF]">
                <span className="font-bold">Envío adaptado y asegurado:</span>
                <span className="font-black uppercase text-[#FACC15]">GRATIS</span>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-[#1E3A5F] flex items-baseline justify-between mb-3">
              <span className="text-base font-black text-white">Total del pedido:</span>
              <span className="text-2xl sm:text-3xl font-black text-[#FACC15] font-mono">
                {formatPrice(subtotal)}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              El registro del pedido no realiza un cobro ni genera una factura fiscal.
            </p>
          </div>

          {!isLoggedIn ? (
            /* STEP 1: Identification / Authentication required for purchase */
            <div
              style={{
                backgroundColor: '#0B192C',
                borderColor: '#00FFFF',
                borderRadius: '16px',
              }}
              className="border-2 p-6 shadow-2xl flex flex-col gap-5"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-[#1E3A5F]">
                <div className="w-10 h-10 rounded-xl bg-[#112240] border border-[#00FFFF] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px] text-[#FACC15]" aria-hidden="true">
                    lock
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-tight">
                    Paso 1: Identifícate para tu Compra
                  </h2>
                  <p className="text-xs text-[#00FFFF] font-bold">
                    Cuenta accesible para tu pedido
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#112240] border border-[#1E3A5F] rounded-xl text-xs text-slate-200 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#00FFFF] shrink-0 mt-0.5" aria-hidden="true">
                  info
                </span>
                <p className="leading-relaxed">
                  Inicia sesión o crea una cuenta para guardar el pedido y consultar tus compras.
                </p>
              </div>

              {/* Selector de Pestaña: Iniciar Sesión vs Crear Cuenta */}
              <div
                role="tablist"
                aria-label="Opciones de acceso para checkout"
                className="grid grid-cols-2 gap-2 p-1 bg-[#070F1E] rounded-xl border border-[#1E3A5F]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={authTab === 'login'}
                  onClick={() => {
                    setAuthTab('login');
                    announce('Pestaña Iniciar Sesión seleccionada');
                  }}
                  className={`py-2 px-3 text-xs font-black rounded-lg transition-all cursor-pointer text-center ${
                    authTab === 'login'
                      ? 'bg-[#00FFFF] text-[#0B192C] shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authTab === 'register'}
                  onClick={() => {
                    setAuthTab('register');
                    announce('Pestaña Crear Cuenta seleccionada');
                  }}
                  className={`py-2 px-3 text-xs font-black rounded-lg transition-all cursor-pointer text-center ${
                    authTab === 'register'
                      ? 'bg-[#00FFFF] text-[#0B192C] shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>

              {/* Mensaje de Error en línea si ocurre */}
              {inlineAuthError && (
                <div
                  role="alert"
                  className="p-3 bg-red-950/80 border-2 border-red-500 rounded-xl text-xs text-red-200 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px] text-red-400" aria-hidden="true">
                    error
                  </span>
                  <span>{inlineAuthError}</span>
                </div>
              )}

              {/* Formulario en línea de Inicio de Sesión o Registro */}
              <form onSubmit={authTab === 'login' ? handleInlineLogin : handleInlineRegister} className="flex flex-col gap-4">
                {authTab === 'register' && (
                  <div>
                    <label htmlFor="inline-reg-name" className="block text-xs font-black uppercase text-slate-200 mb-1 tracking-wider">
                      Nombre Completo <span className="text-[#00FFFF]" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="inline-reg-name"
                      type="text"
                      required
                      value={inlineName}
                      onChange={(e) => setInlineName(e.target.value)}
                      placeholder="Ej. Rubén Ávila"
                      aria-label="Campo interactivo: Nombre Completo para registro en checkout"
                      data-speech="Campo interactivo: Nombre Completo para registro en checkout"
                      style={{ backgroundColor: '#070F1E' }}
                      className="w-full h-11 px-3.5 border-2 border-[#1E3A5F] rounded-xl text-sm text-white focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF]"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="inline-auth-email" className="block text-xs font-black uppercase text-slate-200 mb-1 tracking-wider">
                    Correo Electrónico <span className="text-[#00FFFF]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="inline-auth-email"
                    type="email"
                    required
                    value={inlineEmail}
                    onChange={(e) => setInlineEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    aria-label="Campo interactivo: Correo Electrónico para acceso al pedido"
                    data-speech="Campo interactivo: Correo Electrónico para acceso al pedido"
                    style={{ backgroundColor: '#070F1E' }}
                    className="w-full h-11 px-3.5 border-2 border-[#1E3A5F] rounded-xl text-sm text-white focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="inline-auth-password" className="block text-xs font-black uppercase text-slate-200 tracking-wider">
                      Contraseña <span className="text-[#00FFFF]" aria-hidden="true">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setInlineShowPassword(!inlineShowPassword)}
                      aria-label={inlineShowPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      data-speech={inlineShowPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      className="text-[11px] text-[#00FFFF] hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] rounded"
                    >
                      {inlineShowPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    id="inline-auth-password"
                    type={inlineShowPassword ? 'text' : 'password'}
                    required
                    value={inlinePassword}
                    onChange={(e) => setInlinePassword(e.target.value)}
                    aria-label="Campo interactivo: Contraseña"
                    data-speech="Campo interactivo: Contraseña"
                    style={{ backgroundColor: '#070F1E' }}
                    className="w-full h-11 px-3.5 border-2 border-[#1E3A5F] rounded-xl text-sm text-white focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  aria-label={authTab === 'login' ? 'Botón: Iniciar Sesión y Continuar Compra' : 'Botón: Crear Cuenta y Continuar Compra'}
                  data-speech={authTab === 'login' ? 'Botón: Iniciar Sesión y Continuar Compra' : 'Botón: Crear Cuenta y Continuar Compra'}
                  style={{
                    backgroundColor: '#FACC15',
                    color: '#0B192C',
                    borderColor: '#FDE047',
                  }}
                  className="w-full py-3.5 border-2 font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:brightness-105 active:scale-[0.99] focus-visible:outline focus-visible:outline-3 focus-visible:outline-white disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {authTab === 'login' ? 'login' : 'person_add'}
                  </span>
                  <span>
                    {isAuthenticating
                      ? 'Verificando...'
                      : authTab === 'login'
                      ? 'Iniciar Sesión y Continuar Compra'
                      : 'Crear Cuenta y Continuar Compra'}
                  </span>
                </button>
              </form>

              {/* Opción para ir a la pantalla de configuración de cuenta avanzada */}
              <div className="pt-2 text-center border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => onNavigate('auth')}
                  aria-label="Enlace: Abrir pantalla de inicio de sesión y registro completa"
                  data-speech="Enlace: Abrir pantalla de inicio de sesión y registro completa"
                  className="text-xs text-slate-300 hover:text-[#00FFFF] hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] rounded"
                >
                  ¿Deseas configurar síntesis de voz o preferencias avanzadas? Abrir pantalla completa
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Logged In - Shipping, Payment & Complete Order */
            <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-6">
              {/* User Verified Status Banner */}
              <div className="p-4 bg-[#070F1E] border-2 border-[#22C55E]/60 rounded-xl flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[24px] text-[#22C55E]" aria-hidden="true">
                    check_circle
                  </span>
                  <div>
                    <span className="text-xs text-slate-300 block">Identificado como:</span>
                    <strong className="text-sm text-white font-black">{customerName || 'Cliente Autenticado'}</strong>
                    <span className="text-xs text-slate-400 block font-mono">({customerEmail})</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 text-[10px] font-black rounded-lg uppercase tracking-wider">
                  Cuenta Verificada
                </span>
              </div>

              {/* Shipping & Contact Form */}
          <div
            style={{
              backgroundColor: '#0B192C',
              borderColor: '#1E3A5F',
              borderRadius: '16px',
            }}
            className="border-2 p-6 shadow-lg flex flex-col gap-4"
          >
            <h2 className="text-base font-black text-white pb-2 border-b border-[#1E3A5F]">
              Datos de Envío y Facturación
            </h2>
            <p className="text-xs text-slate-300">
              Ingresa los datos del destinatario para la entrega asegurada.
            </p>

            <div>
              <label htmlFor="chk-name" className="block text-xs font-black uppercase text-slate-200 mb-1 tracking-wider">
                Nombre y Apellidos <span className="text-[#00FFFF]" aria-hidden="true">*</span>
              </label>
              <input
                id="chk-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                aria-label="Campo interactivo: Nombre y Apellidos para envío y facturación"
                data-speech="Campo interactivo: Nombre y Apellidos para envío y facturación"
                style={{ backgroundColor: '#070F1E' }}
                className="w-full h-11 px-3.5 border-2 border-[#1E3A5F] rounded-xl text-sm text-white focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="chk-email" className="block text-xs font-black uppercase text-slate-200 tracking-wider">
                  Correo Electrónico (para licencias) <span className="text-[#00FFFF]" aria-hidden="true">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => announce('Abriendo canal de soporte por mensajería accesible')}
                  aria-label="Botón: WhatsApp Accesible, consultar dudas por chat asistivo"
                  data-speech="Botón: WhatsApp Accesible, consultar dudas por chat asistivo"
                  className="text-[11px] text-[#00FFFF] font-bold hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] rounded"
                >
                  WhatsApp Accesible
                </button>
              </div>
              <input
                id="chk-email"
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                aria-label="Campo interactivo: Correo Electrónico para recepción de licencias y facturas"
                data-speech="Campo interactivo: Correo Electrónico para recepción de licencias y facturas"
                style={{ backgroundColor: '#070F1E' }}
                className="w-full h-11 px-3.5 border-2 border-[#1E3A5F] rounded-xl text-sm text-white focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF]"
              />
            </div>

            <div>
              <label htmlFor="chk-address" className="block text-xs font-black uppercase text-slate-200 mb-1 tracking-wider">
                Dirección Postal de Entrega <span className="text-[#00FFFF]" aria-hidden="true">*</span>
              </label>
              <input
                id="chk-address"
                type="text"
                required
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                aria-label="Campo interactivo: Dirección Postal de Entrega"
                data-speech="Campo interactivo: Dirección Postal de Entrega"
                style={{ backgroundColor: '#070F1E' }}
                className="w-full h-11 px-3.5 border-2 border-[#1E3A5F] rounded-xl text-sm text-white focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF]"
              />
            </div>

            <div>
              <label htmlFor="chk-phone" className="block text-xs font-black uppercase text-slate-200 mb-1 tracking-wider">
                Teléfono de Contacto (SMS / Asistencia) <span className="text-[#00FFFF]" aria-hidden="true">*</span>
              </label>
              <input
                id="chk-phone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                aria-label="Campo interactivo: Teléfono de Contacto para SMS y avisos de entrega"
                data-speech="Campo interactivo: Teléfono de Contacto para SMS y avisos de entrega"
                style={{ backgroundColor: '#070F1E' }}
                className="w-full h-11 px-3.5 border-2 border-[#1E3A5F] rounded-xl text-sm text-white focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF]"
              />
            </div>

            <div>
              <label htmlFor="chk-notes" className="block text-xs font-black uppercase text-slate-200 mb-1 tracking-wider">
                Instrucciones de Entrega Accesible (Opcional)
              </label>
              <textarea
                id="chk-notes"
                rows={2}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Ej. Tocar timbre largo, llamar al móvil al llegar, avisar por mensaje de texto..."
                aria-label="Campo interactivo: Instrucciones de Entrega Accesible, avisos personalizados"
                data-speech="Campo interactivo: Instrucciones de Entrega Accesible, avisos personalizados"
                style={{ backgroundColor: '#070F1E' }}
                className="w-full p-3 border-2 border-[#1E3A5F] rounded-xl text-xs text-white focus:border-[#00FFFF] focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF]"
              />
            </div>

            {/* Payment Method Selector */}
            <fieldset className="border-t border-[#1E3A5F] pt-3">
              <legend className="text-xs font-black uppercase tracking-wider text-slate-200 mb-2">
                Método previsto de pago
              </legend>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-center gap-2.5 p-3 border-2 border-[#1E3A5F] rounded-xl cursor-pointer bg-[#070F1E] hover:border-[#00FFFF] has-checked:border-[#00FFFF] has-checked:bg-[#112240] transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    aria-label="Opción interactiva: Tarjeta Bancaria Segura"
                    data-speech="Opción interactiva: Tarjeta Bancaria Segura"
                    className="accent-[#00FFFF] w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-bold text-white">
                      Tarjeta Bancaria Segura (Crédito / Débito)
                    </span>
                    <span className="material-symbols-outlined text-[20px] text-[#00FFFF]" aria-hidden="true">credit_card</span>
                  </div>
                </label>

                {paymentMethod === 'card' && (
                  <p role="status" className="p-3 bg-[#112240] border border-[#1E3A5F] rounded-xl text-xs text-slate-200">
                    El pedido se registrará pendiente de pago. Los cobros con tarjeta aún no están configurados.
                  </p>
                )}

                <label className="flex items-center gap-2.5 p-3 border-2 border-[#1E3A5F] rounded-xl cursor-pointer bg-[#070F1E] hover:border-[#00FFFF] has-checked:border-[#00FFFF] has-checked:bg-[#112240] transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => setPaymentMethod('transfer')}
                    aria-label="Opción interactiva: Transferencia Bancaria con Factura Proforma"
                    data-speech="Opción interactiva: Transferencia Bancaria con Factura Proforma"
                    className="accent-[#00FFFF] w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-bold text-white">
                      Transferencia Bancaria con Factura Proforma
                    </span>
                    <span className="material-symbols-outlined text-[20px] text-[#00FFFF]" aria-hidden="true">account_balance</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 border-2 border-[#1E3A5F] rounded-xl cursor-pointer bg-[#070F1E] hover:border-[#00FFFF] has-checked:border-[#00FFFF] has-checked:bg-[#112240] transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="ceapat"
                    checked={paymentMethod === 'ceapat'}
                    onChange={() => setPaymentMethod('ceapat')}
                    aria-label="Opción interactiva: Ayudas Públicas y Tramitación CEAPAT Autonómica"
                    data-speech="Opción interactiva: Ayudas Públicas y Tramitación CEAPAT Autonómica"
                    className="accent-[#00FFFF] w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-bold text-white">
                      Ayudas Públicas / Tramitación CEAPAT Autonómica
                    </span>
                    <span className="material-symbols-outlined text-[20px] text-[#FACC15]" aria-hidden="true">policy</span>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200 leading-relaxed">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  aria-label="Campo interactivo: Acepto los términos de servicio y política de privacidad accesible"
                  data-speech="Campo interactivo: Acepto los términos de servicio y política de privacidad accesible"
                  className="w-4 h-4 mt-0.5 accent-[#00FFFF] rounded border border-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] cursor-pointer"
                />
                <span>
                  He leído y acepto los términos de servicio, la política de privacidad accesible y declaro conocer la política de devolución adaptada.
                </span>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isProcessing || cartItems.length === 0}
              aria-label={`Botón: Registrar pedido por ${formatPrice(subtotal)}`}
              data-speech={`Botón: Registrar pedido por ${formatPrice(subtotal)}`}
              style={{
                backgroundColor: '#FACC15',
                color: '#0B192C',
                borderColor: '#FDE047',
                boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4)',
              }}
              className="w-full py-4 border-2 font-black text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer shadow-md transition-all hover:brightness-105 active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">lock</span>
              <span>
                {isProcessing
                  ? 'Guardando pedido...'
                  : `Registrar pedido ${formatPrice(subtotal)}`}
              </span>
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Garantía de reembolso de 30 días si el producto no se adapta a tus necesidades operativas.
            </p>
          </div>
        </form>
      )}
        </div>
      </div>
    </div>
  );
};
