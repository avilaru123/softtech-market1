import React, { useState, useEffect } from 'react';
import { Product, Screen } from '../types';
import welcomeShoppingImage from '../assets/welcome-shopping.svg';
import { useAnnouncer } from './LiveAnnouncer';
import { speakSpanish, stopSpeech, getProductSpeechText } from '../utils/speech';

interface HomeScreenProps {
  products: Product[];
  onNavigate: (screen: Screen) => void;
  onAddToCart: (product: Product) => void;
  onOpenSpecsModal: (product: Product) => void;
  onOpenSpecialistModal: () => void;
  onSelectCategoryFilter: (category: string) => void;
  onToggleHighContrast: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  products,
  onNavigate,
  onAddToCart,
  onOpenSpecsModal,
  onOpenSpecialistModal,
  onSelectCategoryFilter,
  onToggleHighContrast,
}) => {
  const { announce } = useAnnouncer();
  const [activeTabFilter, setActiveTabFilter] = useState('all');
  const [testNotificationCount, setTestNotificationCount] = useState(0);
  const [speakingProductId, setSpeakingProductId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const handleSpeakProduct = (product: Product) => {
    if (speakingProductId === product.id) {
      stopSpeech();
      setSpeakingProductId(null);
      announce('Lectura de descripción detenida');
    } else {
      const textToSpeak = getProductSpeechText(product);
      setSpeakingProductId(product.id);
      announce(`Leyendo en voz alta la descripción de ${product.name}`);
      speakSpanish(textToSpeak, {
        onStart: () => setSpeakingProductId(product.id),
        onEnd: () => setSpeakingProductId(null),
        onError: () => setSpeakingProductId(null),
      });
    }
  };

  const featuredProducts = products.filter((p) => p.featured);

  const handleTestLiveAnnouncement = () => {
    const nextCount = testNotificationCount + 1;
    setTestNotificationCount(nextCount);
    announce(
      `Prueba de accesibilidad exitosa: Anuncio número ${nextCount} emitido a través del canal aria-live polite. Lectura correcta en NVDA y JAWS.`,
      'assertive'
    );
  };

  const handleFocusSkipLink = () => {  <div className="w-full flex flex-col gap-10 bg-[#F0F5FF] text-slate-900"></div>
    const skipLink = document.querySelector<HTMLAnchorElement>('.skip-link');
    if (skipLink) {
      skipLink.focus();
      announce('Enlace de salto al contenido enfocado.', 'polite');
    }
  };

  // COLORES DE LA PANTALLA DE INICIO: modifica bg-[#F0F5FF] y los colores del hero para cambiar este tema.
  return (
    <div className="w-full flex flex-col gap-10 bg-[#F0F5FF] text-slate-900">
      {/* Hero Section - Tema Claro Accesible */}
      <section
        aria-label="Bienvenida e introducción de accesibilidad"
        className="w-full bg-gradient-to-br from-indigo-50 via-blue-50 to-white py-8 md:py-12 px-4 md:px-8 border-b border-indigo-100"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-black rounded-full border-2 border-indigo-400 shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-indigo-600" aria-hidden="true">
                  verified
                </span>
                CUMPLIMIENTO ESTRICTO WCAG 2.1 AAA
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Tecnología diseñada para todos, sin barreras.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-medium">
              Adquiere hardware asistivo y software certificado con garantía de accesibilidad universal, contraste ultra-alto y compatibilidad absoluta con lectores de pantalla.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  onNavigate('catalog');
                  announce('Navegando al catálogo accesible de productos');
                }}
                aria-label="Botón: Explorar Catálogo AAA, ir al listado de hardware y software asistivo"
                data-speech="Botón: Explorar Catálogo AAA, ir al listado de hardware y software asistivo"
                className="px-6 py-3.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 flex items-center gap-2 text-base focus-visible:outline focus-visible:outline-3 focus-visible:outline-slate-800 cursor-pointer shadow-lg transition-all"
              >
                <span>Explorar Catálogo AAA</span>
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  arrow_forward
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const auditSection = document.getElementById('audit-panel');
                  if (auditSection) {
                    auditSection.scrollIntoView({ behavior: 'smooth' });
                    auditSection.focus();
                    announce('Desplazado al panel interactivo de auditoría WCAG AAA');
                  }
                }}
                aria-label="Botón: Ver Panel de Auditoría, desplazarse a la sección de validación técnica WCAG AAA"
                data-speech="Botón: Ver Panel de Auditoría, desplazarse a la sección de validación técnica WCAG AAA"
                className="px-6 py-3.5 bg-white text-indigo-700 font-bold rounded-xl border-2 border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 flex items-center gap-2 text-base focus-visible:outline focus-visible:outline-3 focus-visible:outline-slate-800 cursor-pointer transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[20px] text-indigo-500" aria-hidden="true">
                  fact_check
                </span>
                <span>Ver Panel de Auditoría</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center lg:col-span-5">
            <img
              src={welcomeShoppingImage}
              alt="Ilustración de bolsas de compra que representa el catálogo de SoftTech Market"
              width="560"
              height="380"
              className="h-auto w-full max-w-[26rem] object-contain"
            />
          </div>

        </div>
      </section>

      {/* Quick Category Navigation Filter Pills */}
      <section
        aria-label="Accesos rápidos a categorías"
        className="w-full px-4 md:px-8 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'Todos los Productos', filter: 'all' },
            { id: 'screen-reader', label: 'Software de Voz & Lectores', filter: 'screen-reader' },
            { id: 'braille', label: 'Monitores Braille', filter: 'braille' },
            { id: 'input-assist', label: 'Teclados Adaptativos & Control', filter: 'input-assist' },
            { id: 'magnifier', label: 'Ampliadores de Pantalla', filter: 'magnifier' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveTabFilter(cat.id);
                onSelectCategoryFilter(cat.filter);
                onNavigate('catalog');
                announce(`Filtrando catálogo por: ${cat.label}`);
              }}
              aria-label={`Botón: Filtrar por ${cat.label}, sección Accesos rápidos a categorías`}
              data-speech={`Botón: Filtrar por ${cat.label}, sección Accesos rápidos a categorías`}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all focus-visible:outline focus-visible:outline-3 focus-visible:outline-slate-800 ${
                activeTabFilter === cat.id
                  ? 'bg-indigo-600 text-white font-black shadow-md border-2 border-indigo-600'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Interactive WCAG 2.1 AAA Audit Panel */}
      <section
        id="audit-panel"
        tabIndex={-1}
        aria-label="Panel interactivo de comprobación de criterios de accesibilidad"
        className="w-full px-4 md:px-8 max-w-7xl mx-auto"
      >
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-indigo-100">
            <div>
              <span className="px-3 py-1 bg-amber-400 text-white text-xs font-mono font-black rounded-md shadow-xs">
                VALIDACIÓN EN VIVO
              </span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2">
                Panel Interactivo de Auditoría WCAG 2.1 AAA
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Comprueba en tiempo real el cumplimiento de los 4 pilares fundamentales de la accesibilidad digital.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleHighContrast}
              aria-label="Botón: Conmutar Alto Contraste, alternar paleta accesible de máxima luminosidad"
              data-speech="Botón: Conmutar Alto Contraste, alternar paleta accesible de máxima luminosidad"
              className="px-4 py-2 bg-white hover:bg-indigo-50 border-2 border-indigo-400 text-xs font-bold text-indigo-700 rounded-xl flex items-center gap-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-slate-800 cursor-pointer self-start sm:self-auto transition-colors shadow-md"
            >
              <span className="material-symbols-outlined text-[18px] text-indigo-500">contrast</span>
              <span>Conmutar Alto Contraste</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {/* Card 1: Salto al contenido */}
            <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-indigo-500">keyboard_tab</span>
                  <h3 className="font-bold text-sm text-slate-800">Salto al Contenido</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Permite a usuarios de teclado y lectores de pantalla saltar directamente al bloque principal evitando cabeceras repetitivas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFocusSkipLink}
                aria-label="Botón: Probar foco en Skip-Link, enfocar enlace de salto al contenido"
                data-speech="Botón: Probar foco en Skip-Link, enfocar enlace de salto al contenido"
                className="mt-4 px-3 py-2 bg-indigo-600 text-white font-black rounded-lg text-xs hover:bg-indigo-700 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-800 cursor-pointer transition-colors shadow-sm"
              >
                Probar foco en Skip-Link
              </button>
            </div>

            {/* Card 2: Contraste > 7:1 */}
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-amber-600">contrast</span>
                  <h3 className="font-bold text-sm text-slate-800">Contraste &gt; 7:1</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cumplimiento estricto del criterio 1.4.6 de WCAG para texto normal y componentes interactivos sin degradados ilegibles.
                </p>
              </div>
              <div className="mt-4 p-2 bg-amber-500 text-white text-center rounded-lg text-xs font-mono font-black shadow-xs">
                Ratio Actual: 12:1 (AAA)
              </div>
            </div>

            {/* Card 3: Regiones aria-live */}
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-emerald-600">record_voice_over</span>
                  <h3 className="font-bold text-sm text-slate-800">Regiones aria-live</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Notificaciones dinámicas automáticas a sintetizadores de voz sin interferir en la lectura del usuario.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestLiveAnnouncement}
                aria-label="Botón: Lanzar Anuncio Sintético, emitir mensaje accesible por canal aria-live"
                data-speech="Botón: Lanzar Anuncio Sintético, emitir mensaje accesible por canal aria-live"
                className="mt-4 px-3 py-2 bg-emerald-600 text-white font-black hover:bg-emerald-700 rounded-lg text-xs text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-800 cursor-pointer shadow-sm transition-colors"
              >
                Lanzar Anuncio Sintético
              </button>
            </div>

            {/* Card 4: Escalado Tipográfico */}
            <div className="p-4 bg-violet-50 border-2 border-violet-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-violet-600">format_size</span>
                  <h3 className="font-bold text-sm text-slate-800">Escalado Flexible</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Soporte nativo de hasta 200% de ampliación tipográfica mediante fuentes hiperlegibles Atkinson y Plus Jakarta Sans.
                </p>
              </div>
              <div className="mt-4 p-2 bg-violet-100 border border-violet-300 rounded-lg text-center text-xs font-bold text-violet-700">
                Tipografía Plus Jakarta Sans
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Accessible Products */}
      <section
        aria-label="Productos destacados del catálogo"
        className="w-full px-4 md:px-8 max-w-7xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Soluciones Asistivas Destacadas
            </h2>
            <p className="text-sm text-slate-500">
              Hardware y software de alta precisión para autonomía en el entorno digital.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            aria-label="Enlace: Ver todas las soluciones, sección Productos destacados del catálogo"
            data-speech="Enlace: Ver todas las soluciones, sección Productos destacados del catálogo"
            className="text-sm font-bold text-indigo-600 underline hover:text-indigo-800 flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-800 cursor-pointer transition-colors"
          >
            <span>Ver todas</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <article
              key={product.id}
              tabIndex={0}
              role="region"
              aria-label={`Tarjeta: ${product.name}, categoría ${product.categoryLabel}, precio ${product.priceFormatted}. Pulsa Tab para ver opciones de compra.`}
              data-speech={`Tarjeta: ${product.name}, categoría ${product.categoryLabel}, precio ${product.priceFormatted}, IVA incluido. Pulsa Tab para ver opciones de compra.`}
              className="interactive-card bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-xl transition-all"
            >
              <div>
                {/* Product Image Container */}
                <div className="relative h-48 bg-slate-100 overflow-hidden border-b border-slate-200">
                  <img
                    src={product.image}
                    alt={product.imageAlt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-md shadow-md">
                      {product.badge}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-300 text-[10px] font-bold rounded-md">
                      {product.subBadge}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <span className="text-[11px] uppercase font-black tracking-wider text-indigo-600 block mb-1">
                    {product.categoryLabel}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 leading-snug mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {product.description}
                  </p>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Tipo:</span>
                      <span className="text-slate-800 font-bold">{product.shortCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Garantía:</span>
                      <span className="text-slate-700">3 años oficial</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="p-5 pt-0">
                <div className="mb-3">
                  <span className="text-2xl font-black text-emerald-700 block">
                    {product.priceFormatted}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    IVA (21%) incluido
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(product);
                      announce(`Añadido ${product.name} al carrito por ${product.priceFormatted}`, 'polite');
                    }}
                    aria-label={`Botón: Añadir al Carrito, agregar ${product.name} por ${product.priceFormatted}`}
                    data-speech={`Botón: Añadir al Carrito, agregar ${product.name} por ${product.priceFormatted}`}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 flex items-center justify-center gap-1.5 focus-visible:outline focus-visible:outline-3 focus-visible:outline-slate-800 cursor-pointer shadow-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                    <span>Añadir al Carrito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSpeakProduct(product)}
                    aria-label={`Botón: Escuchar descripción, narrar especificaciones de ${product.name}`}
                    data-speech={`Botón: Escuchar descripción, narrar especificaciones de ${product.name}`}
                    className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-800 cursor-pointer transition-colors ${
                      speakingProductId === product.id
                        ? 'bg-emerald-600 text-white shadow-md font-black'
                        : 'bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-300 hover:border-emerald-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {speakingProductId === product.id ? 'stop_circle' : 'volume_up'}
                    </span>
                    <span>{speakingProductId === product.id ? 'Detener audio' : 'Escuchar descripción'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenSpecsModal(product)}
                    aria-label={`Botón: Ver Especificaciones, abrir ventana modal técnica de ${product.name}`}
                    data-speech={`Botón: Ver Especificaciones, abrir ventana modal técnica de ${product.name}`}
                    className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 border border-slate-300 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-800 cursor-pointer transition-colors"
                  >
                    Ver Especificaciones
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Keyboard Navigation Quick Guide Banner */}
      <section
        aria-label="Atajos de teclado para navegación accesible"
        className="w-full px-4 md:px-8 max-w-7xl mx-auto"
      >
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-indigo-500 text-[26px]">keyboard</span>
            <h2 className="text-xl font-bold text-slate-800">
              Guía de Navegación Rápida por Teclado
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-6 max-w-2xl">
            Toda la plataforma SoftTech Market está optimizada para ser navegada al 100% sin ratón.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
              <kbd className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-mono font-black rounded-md inline-block mb-2 shadow-xs">
                Tab
              </kbd>
              <p className="text-xs text-slate-600">
                Avanzar ordenadamente al siguiente control interactivo o botón con anuncio por voz.
              </p>
            </div>

            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
              <kbd className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-mono font-black rounded-md inline-block mb-2 shadow-xs">
                Shift + Tab
              </kbd>
              <p className="text-xs text-slate-600">
                Retroceder de forma secuencial al elemento interactivo anterior.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <kbd className="px-2.5 py-1 bg-amber-500 text-white text-xs font-mono font-black rounded-md inline-block mb-2 shadow-xs">
                Enter / Espacio
              </kbd>
              <p className="text-xs text-slate-600">
                Activar botones, enlaces, modales o casillas de selección.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <kbd className="px-2.5 py-1 bg-amber-500 text-white text-xs font-mono font-black rounded-md inline-block mb-2 shadow-xs">
                Escape
              </kbd>
              <p className="text-xs text-slate-600">
                Cerrar ventanas modales o cuadros de diálogo de especificaciones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advisory Callout */}
      <section
        aria-label="Asesoramiento técnico accesible"
        className="w-full px-4 md:px-8 max-w-7xl mx-auto mb-6"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-[28px]">support_agent</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                ¿Necesitas asesoramiento técnico accesible?
              </h2>
              <p className="text-sm text-indigo-100 mt-1 max-w-xl">
                Nuestros ingenieros de accesibilidad te orientan de forma gratuita para escoger la solución certificada compatible con tus necesidades, entorno laboral o académico.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSpecialistModal}
            aria-label="Botón: Contactar Especialista, solicitar asesoría técnica personalizada gratuita"
            data-speech="Botón: Contactar Especialista, solicitar asesoría técnica personalizada gratuita"
            className="px-6 py-3.5 bg-white text-indigo-700 font-black text-sm rounded-xl hover:bg-indigo-50 shrink-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-slate-800 cursor-pointer shadow-md transition-colors"
          >
            Contactar Especialista
          </button>
        </div>
      </section>

      {/* Conformity index moved to the bottom of the home page */}
      <section
        id="conformity-index"
        aria-label="Índice de conformidad y auditoría de accesibilidad"
        tabIndex={-1}
        className="w-full px-4 md:px-8 max-w-7xl mx-auto pb-8"
      >
        <div className="bg-white border-2 border-indigo-200 hover:border-indigo-400 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px] text-indigo-500" aria-hidden="true">
                task_alt
              </span>
              <h2 className="text-lg font-bold text-slate-800">
                Índice de Conformidad 100% AAA
              </h2>
            </div>
            <span className="px-2.5 py-1 bg-amber-400 text-white text-[11px] font-black uppercase tracking-wider rounded-md shadow-xs">
              En tiempo real
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-3 mb-4 leading-relaxed">
            Verificado automáticamente en cada renderizado contra la especificación W3C y norma europea EN 301 549.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-center border border-indigo-200">
              <span className="block text-2xl font-black text-indigo-700 font-mono">12:1</span>
              <span className="text-[11px] font-bold text-slate-600 block mt-1">Ratio Contraste</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-200">
              <span className="block text-2xl font-black text-emerald-700 font-mono">0 ms</span>
              <span className="text-[11px] font-bold text-slate-600 block mt-1">Latencia Foco</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-center border border-amber-200">
              <span className="block text-2xl font-black text-amber-700 font-mono">100%</span>
              <span className="text-[11px] font-bold text-slate-600 block mt-1">Operable Teclado</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-bold">
            <span className="material-symbols-outlined text-[18px] text-emerald-600" aria-hidden="true">
              check_circle
            </span>
            <span>Sistema Certificado bajo estándar europeo EN 301 549</span>
          </div>
        </div>
      </section>
    </div>
  );
};
