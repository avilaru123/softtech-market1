import React, { useState, useMemo, useEffect } from 'react';
import { Product, Screen, FilterState } from '../types';
import { useAnnouncer } from './LiveAnnouncer';
import { speakSpanish, stopSpeech, getProductSpeechText } from '../utils/speech';

export interface WelcomeBannerData {
  message: string;
  onDismiss: () => void;
  onReplay?: () => void;
  isSpeaking?: boolean;
}

interface CatalogScreenProps {
  products: Product[];
  onNavigate: (screen: Screen) => void;
  onAddToCart: (product: Product) => void;
  onOpenSpecsModal: (product: Product) => void;
  onOpenVpatModal: () => void;
  initialCategoryFilter?: string;
  searchQuery: string;
  welcomeBanner?: WelcomeBannerData | null;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  products,
  onNavigate,
  onAddToCart,
  onOpenSpecsModal,
  onOpenVpatModal,
  initialCategoryFilter = 'all',
  searchQuery,
  welcomeBanner,
}) => {
  const { announce } = useAnnouncer();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc'>('relevance');
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

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategoryFilter !== 'all' ? [initialCategoryFilter] : []
  );
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('0');
  const [maxPrice, setMaxPrice] = useState<string>('13500000');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  const handleCategoryToggle = (cat: string) => {
    setSelectedCategories((prev) => {
      const exists = prev.includes(cat);
      const next = exists ? prev.filter((c) => c !== cat) : [...prev, cat];
      announce(`Filtro de categoría ${exists ? 'removido' : 'aplicado'}: ${cat}`);
      return next;
    });
    setCurrentPage(1);
  };

  const handleMethodToggle = (method: string) => {
    setSelectedMethods((prev) => {
      const exists = prev.includes(method);
      const next = exists ? prev.filter((m) => m !== method) : [...prev, method];
      announce(`Filtro de método de entrada ${exists ? 'removido' : 'aplicado'}: ${method}`);
      return next;
    });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedMethods([]);
    setMinPrice('0');
    setMaxPrice('13500000');
    setCurrentPage(1);
    announce('Todos los filtros han sido restablecidos.');
  };

  // Category and Method counts for balanced filter badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      braille: 0,
      'screen-reader': 0,
      'input-assist': 0,
      magnifier: 0,
    };
    products.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });
    return counts;
  }, [products]);

  const methodCounts = useMemo(() => {
    const counts: Record<string, number> = {
      keyboard: 0,
      voice: 0,
      gaze: 0,
    };
    products.forEach((p) => {
      if (counts[p.inputMethod] !== undefined) {
        counts[p.inputMethod]++;
      }
    });
    return counts;
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      list = list.filter((p) => selectedCategories.includes(p.category));
    }

    // Input method filter
    if (selectedMethods.length > 0) {
      list = list.filter((p) => selectedMethods.includes(p.inputMethod));
    }

    // Price range
    const min = parseFloat(minPrice) || 0;
    const max = parseFloat(maxPrice) || 99999;
    list = list.filter((p) => p.price >= min && p.price <= max);

    // Sorting
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, searchQuery, selectedCategories, selectedMethods, minPrice, maxPrice, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  return (
    <div className="w-full flex flex-col gap-6 py-6 px-4 md:px-8 max-w-7xl mx-auto text-white bg-[#0B192C]">
      {/* Notificación Visual y Accesible (Región ARIA Live) con Alto Contraste */}
      {welcomeBanner && (
        <section
          id="welcome-speech-alert"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          className="w-full bg-[#070F1E] text-white border-2 border-[#00FFFF] rounded-2xl p-5 sm:p-6 shadow-[0_0_20px_rgba(0,255,255,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00FFFF] text-[#0B192C] flex items-center justify-center shrink-0 shadow-md font-black">
              <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                record_voice_over
              </span>
            </div>
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#FACC15] text-[#0B192C] text-[11px] font-black uppercase tracking-wider rounded-md">
                  Bienvenida por Voz
                </span>
                <span className="px-2.5 py-0.5 bg-[#112240] text-[#00FFFF] border border-[#00FFFF]/50 text-[11px] font-bold rounded-md flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${welcomeBanner.isSpeaking ? 'bg-[#00FFFF] animate-ping' : 'bg-[#00FFFF]'}`} aria-hidden="true" />
                  {welcomeBanner.isSpeaking ? 'Narrando ahora...' : 'Sesión Iniciada con Éxito'}
                </span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                {welcomeBanner.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            {welcomeBanner.onReplay && (
              <button
                id="btn-replay-welcome-speech"
                type="button"
                onClick={welcomeBanner.onReplay}
                className="px-4 py-2.5 bg-[#112240] hover:bg-[#1B3A60] text-[#00FFFF] border-2 border-[#00FFFF] text-xs font-black rounded-xl flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer transition-colors shadow-md"
                aria-label="Botón: Repetir Voz, volver a escuchar el saludo de bienvenida en voz alta"
                data-speech="Botón: Repetir Voz, volver a escuchar el saludo de bienvenida en voz alta"
              >
                <span className="material-symbols-outlined text-[20px] text-[#00FFFF]" aria-hidden="true">
                  volume_up
                </span>
                <span>Repetir Voz</span>
              </button>
            )}

            {welcomeBanner.onDismiss && (
              <button
                id="btn-dismiss-welcome-alert"
                type="button"
                onClick={welcomeBanner.onDismiss}
                className="px-3.5 py-2.5 bg-[#1E3A5F] hover:bg-[#284B75] text-white border border-[#334E68] text-xs font-bold rounded-xl flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer transition-colors"
                aria-label="Botón: Cerrar, descartar notificación de bienvenida"
                data-speech="Botón: Cerrar, descartar notificación de bienvenida"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  close
                </span>
                <span>Cerrar</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Breadcrumbs & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E3A5F] pb-3">
        <nav aria-label="Ruta de navegación" className="text-xs text-slate-300 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            aria-label="Enlace: Inicio, sección Ruta de navegación"
            data-speech="Enlace: Inicio, sección Ruta de navegación"
            className="text-[#00FFFF] hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2"
          >
            Inicio
          </button>
          <span>/</span>
          <span className="font-bold text-white" aria-current="page">
            Catálogo Accesible de Productos
          </span>
        </nav>

        <span className="inline-flex items-center gap-1.5 text-xs text-[#00FFFF] font-bold">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          Catálogo Homologado EN 301 549 & CEAPAT
        </span>
      </div>

      {/* Header and View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF]">
            Catálogo Especializado de Soluciones Asistivas
          </h1>
          <p className="text-sm text-slate-300 mt-0.5">
            Dispositivos y software homologados con contraste reforzado y soporte braille nativo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-[#00FFFF]/15 text-[#00FFFF] border-2 border-[#00FFFF] font-black text-xs rounded-full shadow-xs">
            {filteredProducts.length} Soluciones Certificadas
          </span>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="catalog-sort" className="font-bold text-slate-300 sr-only sm:not-sr-only">
              Ordenar por:
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              aria-label="Campo interactivo: Ordenar catálogo por criterio, sección Filtros de catálogo"
              data-speech="Campo interactivo: Ordenar catálogo por criterio, sección Filtros de catálogo"
              onChange={(e) => {
                setSortBy(e.target.value as any);
                announce(`Catálogo ordenado por ${e.target.options[e.target.selectedIndex].text}`);
              }}
              className="h-9 px-2.5 bg-[#112240] border-2 border-[#1E3A5F] rounded-xl text-xs font-semibold focus-visible:outline focus-visible:outline-3 cursor-pointer text-white shadow-md"
            >
              <option value="relevance">Relevancia Accesible</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div role="group" aria-label="Modo de visualización" className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Botón: Vista en cuadrícula, organizar productos en tarjetas"
              data-speech="Botón: Vista en cuadrícula, organizar productos en tarjetas"
              aria-pressed={viewMode === 'grid'}
              onClick={() => {
                setViewMode('grid');
                announce('Cambiado a vista en cuadrícula');
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border-2 cursor-pointer focus-visible:outline focus-visible:outline-3 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#00FFFF] text-[#0B192C] border-[#00FFFF] shadow-md font-bold'
                  : 'bg-[#112240] text-white border-[#1E3A5F] hover:border-[#00FFFF]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              type="button"
              aria-label="Botón: Vista en lista detallada, mostrar productos en filas horizontales"
              data-speech="Botón: Vista en lista detallada, mostrar productos en filas horizontales"
              aria-pressed={viewMode === 'list'}
              onClick={() => {
                setViewMode('list');
                announce('Cambiado a vista en lista detallada');
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border-2 cursor-pointer focus-visible:outline focus-visible:outline-3 transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#00FFFF] text-[#0B192C] border-[#00FFFF] shadow-md font-bold'
                  : 'bg-[#112240] text-white border-[#1E3A5F] hover:border-[#00FFFF]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Category Navigation Filter Pills for Catalog */}
      <section
        aria-label="Filtro rápido por categoría"
        className="w-full bg-[#112240] border-2 border-[#1E3A5F] rounded-2xl p-3 shadow-md"
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todas las Soluciones', count: products.length },
            { id: 'braille', label: 'Hardware Táctil Braille', count: categoryCounts['braille'] || 0 },
            { id: 'screen-reader', label: 'Software Lector de Pantalla', count: categoryCounts['screen-reader'] || 0 },
            { id: 'input-assist', label: 'Dispositivos de Entrada', count: categoryCounts['input-assist'] || 0 },
            { id: 'magnifier', label: 'Ampliadores de Pantalla', count: categoryCounts['magnifier'] || 0 },
          ].map((cat) => {
            const isSelected = cat.id === 'all' ? selectedCategories.length === 0 : selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (cat.id === 'all') {
                    setSelectedCategories([]);
                    announce('Mostrando todas las categorías');
                  } else {
                    handleCategoryToggle(cat.id);
                  }
                }}
                aria-pressed={isSelected}
                aria-label={`Filtro rápido: ${cat.label}, ${cat.count} productos`}
                data-speech={`Filtro rápido: ${cat.label}, ${cat.count} productos`}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-white shrink-0 ${
                  isSelected
                    ? 'bg-[#00FFFF] text-[#0B192C] font-black shadow-md border-2 border-[#00FFFF]'
                    : 'bg-[#0F1D36] text-slate-200 border border-[#1E3A5F] hover:border-[#00FFFF] hover:text-[#00FFFF]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                    isSelected ? 'bg-[#0B192C] text-[#00FFFF]' : 'bg-[#112240] text-slate-300'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Layout: Filters Sidebar + Products Grid/List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Filters Sidebar */}
        <aside
          aria-label="Filtros de catálogo"
          className="lg:col-span-3 bg-[#112240] border-2 border-[#1E3A5F] rounded-2xl p-5 shadow-xl space-y-6 text-white"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#1E3A5F]">
            <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-[#00FFFF]">filter_alt</span>
              Filtros Asistivos
            </h2>
            <button
              type="button"
              onClick={handleResetFilters}
              aria-label="Botón: Limpiar filtros, restablecer todos los criterios de búsqueda"
              data-speech="Botón: Limpiar filtros, restablecer todos los criterios de búsqueda"
              className="text-xs text-[#00FFFF] hover:text-[#22D3EE] font-bold underline focus-visible:outline focus-visible:outline-2 cursor-pointer"
            >
              Limpiar Todo
            </button>
          </div>

          {/* Filter 1: Tipo de Tecnología */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-black uppercase tracking-wider text-[#FACC15] mb-2">
              Tipo de Tecnología
            </legend>
            <div className="space-y-2 text-xs text-slate-200">
              <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#0F1D36] cursor-pointer select-none transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes('braille')}
                    onChange={() => handleCategoryToggle('braille')}
                    aria-label="Casilla: Filtrar por Hardware Táctil Braille"
                    data-speech="Casilla: Filtrar por Hardware Táctil Braille"
                    className="w-4 h-4 accent-[#00FFFF] rounded border border-slate-400 focus-visible:outline focus-visible:outline-2"
                  />
                  <span>Hardware Táctil Braille</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0F1D36] text-[#00FFFF] border border-[#1E3A5F]">
                  {categoryCounts['braille'] || 0}
                </span>
              </label>

              <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#0F1D36] cursor-pointer select-none transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes('screen-reader')}
                    onChange={() => handleCategoryToggle('screen-reader')}
                    aria-label="Casilla: Filtrar por Software Lector de Pantalla"
                    data-speech="Casilla: Filtrar por Software Lector de Pantalla"
                    className="w-4 h-4 accent-[#00FFFF] rounded border border-slate-400 focus-visible:outline focus-visible:outline-2"
                  />
                  <span>Software Lector de Pantalla</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0F1D36] text-[#00FFFF] border border-[#1E3A5F]">
                  {categoryCounts['screen-reader'] || 0}
                </span>
              </label>

              <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#0F1D36] cursor-pointer select-none transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes('input-assist')}
                    onChange={() => handleCategoryToggle('input-assist')}
                    aria-label="Casilla: Filtrar por Dispositivos de Entrada & Control"
                    data-speech="Casilla: Filtrar por Dispositivos de Entrada & Control"
                    className="w-4 h-4 accent-[#00FFFF] rounded border border-slate-400 focus-visible:outline focus-visible:outline-2"
                  />
                  <span>Dispositivos de Entrada & Control</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0F1D36] text-[#00FFFF] border border-[#1E3A5F]">
                  {categoryCounts['input-assist'] || 0}
                </span>
              </label>

              <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#0F1D36] cursor-pointer select-none transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes('magnifier')}
                    onChange={() => handleCategoryToggle('magnifier')}
                    aria-label="Casilla: Filtrar por Ampliadores de Pantalla"
                    data-speech="Casilla: Filtrar por Ampliadores de Pantalla"
                    className="w-4 h-4 accent-[#00FFFF] rounded border border-slate-400 focus-visible:outline focus-visible:outline-2"
                  />
                  <span>Ampliadores de Pantalla</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0F1D36] text-[#00FFFF] border border-[#1E3A5F]">
                  {categoryCounts['magnifier'] || 0}
                </span>
              </label>
            </div>
          </fieldset>

          {/* Filter 2: Método de Control Primario */}
          <fieldset className="space-y-2 border-t border-[#1E3A5F] pt-4">
            <legend className="text-xs font-black uppercase tracking-wider text-[#FACC15] mb-2">
              Método de Control Primario
            </legend>
            <div className="space-y-2 text-xs text-slate-200">
              <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#0F1D36] cursor-pointer select-none transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMethods.includes('keyboard')}
                    onChange={() => handleMethodToggle('keyboard')}
                    aria-label="Casilla: Filtrar por Teclado Físico / Braille"
                    data-speech="Casilla: Filtrar por Teclado Físico / Braille"
                    className="w-4 h-4 accent-[#00FFFF] rounded border border-slate-400 focus-visible:outline focus-visible:outline-2"
                  />
                  <span>Teclado Físico / Braille</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0F1D36] text-[#00FFFF] border border-[#1E3A5F]">
                  {methodCounts['keyboard'] || 0}
                </span>
              </label>

              <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#0F1D36] cursor-pointer select-none transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMethods.includes('voice')}
                    onChange={() => handleMethodToggle('voice')}
                    aria-label="Casilla: Filtrar por Voz / Comandos Vocales"
                    data-speech="Casilla: Filtrar por Voz / Comandos Vocales"
                    className="w-4 h-4 accent-[#00FFFF] rounded border border-slate-400 focus-visible:outline focus-visible:outline-2"
                  />
                  <span>Voz / Comandos Vocales</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0F1D36] text-[#00FFFF] border border-[#1E3A5F]">
                  {methodCounts['voice'] || 0}
                </span>
              </label>

              <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-[#0F1D36] cursor-pointer select-none transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMethods.includes('gaze')}
                    onChange={() => handleMethodToggle('gaze')}
                    aria-label="Casilla: Filtrar por Control Ocular (Eye-gaze)"
                    data-speech="Casilla: Filtrar por Control Ocular (Eye-gaze)"
                    className="w-4 h-4 accent-[#00FFFF] rounded border border-slate-400 focus-visible:outline focus-visible:outline-2"
                  />
                  <span>Control Ocular (Eye-gaze)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0F1D36] text-[#00FFFF] border border-[#1E3A5F]">
                  {methodCounts['gaze'] || 0}
                </span>
              </label>
            </div>
          </fieldset>

          {/* Filter 3: Rango de Precio */}
          <div className="border-t border-[#1E3A5F] pt-4 space-y-3">
            <span className="block text-xs font-black uppercase tracking-wider text-[#FACC15]">
              Rango de Precio (COP)
            </span>

            {/* Price Presets */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Todos', min: '0', max: '13500000' },
                { label: '< 900.000 COP', min: '0', max: '900000' },
                { label: '900.000 - 4.500.000 COP', min: '900000', max: '4500000' },
                { label: '> 4.500.000 COP', min: '4500000', max: '13500000' },
              ].map((preset) => {
                const isPresetActive = minPrice === preset.min && maxPrice === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setMinPrice(preset.min);
                      setMaxPrice(preset.max);
                      announce(`Precio ajustado a ${preset.label}`);
                    }}
                    className={`py-1 px-2 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                      isPresetActive
                        ? 'bg-[#00FFFF] text-[#0B192C] border-[#00FFFF]'
                        : 'bg-[#0F1D36] text-slate-300 border-[#1E3A5F] hover:border-[#00FFFF]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <label htmlFor="filter-min-price" className="block text-[10px] text-slate-300 mb-0.5">
                  Mínimo (COP)
                </label>
                <input
                  id="filter-min-price"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  aria-label="Campo interactivo: Precio Mínimo en pesos colombianos"
                  data-speech="Campo interactivo: Precio Mínimo en pesos colombianos"
                  className="w-full h-8 px-2 bg-[#0F1D36] border border-[#1E3A5F] text-white rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 text-xs"
                />
              </div>
              <div>
                <label htmlFor="filter-max-price" className="block text-[10px] text-slate-300 mb-0.5">
                  Máximo (COP)
                </label>
                <input
                  id="filter-max-price"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  aria-label="Campo interactivo: Precio Máximo en pesos colombianos"
                  data-speech="Campo interactivo: Precio Máximo en pesos colombianos"
                  className="w-full h-8 px-2 bg-[#0F1D36] border border-[#1E3A5F] text-white rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                announce(`Filtros aplicados. Mostrando ${filteredProducts.length} productos.`);
              }}
              aria-label="Botón: Aplicar Filtros, filtrar listado de productos"
              data-speech="Botón: Aplicar Filtros, filtrar listado de productos"
              className="flex-1 py-2.5 bg-[#00FFFF] hover:bg-[#22D3EE] text-[#0B192C] text-xs font-black rounded-xl focus-visible:outline focus-visible:outline-3 cursor-pointer transition-colors shadow-md text-center"
            >
              Aplicar Filtros
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              aria-label="Botón: Limpiar, restablecer todos los filtros"
              data-speech="Botón: Limpiar, restablecer todos los filtros"
              className="py-2.5 px-4 bg-[#0F1D36] hover:bg-[#1E3A5F] text-slate-200 border border-[#1E3A5F] text-xs font-bold rounded-xl focus-visible:outline focus-visible:outline-2 cursor-pointer transition-colors text-center"
            >
              Limpiar
            </button>
          </div>
        </aside>

        {/* Products Stream */}
        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Resultados de catálogo"
          className="lg:col-span-9 flex flex-col gap-5"
        >
          {/* Active Filters Bar - Displays pills for active constraints */}
          {(selectedCategories.length > 0 || selectedMethods.length > 0 || minPrice !== '0' || maxPrice !== '13500000' || searchQuery.trim() !== '') && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-[#112240] border-2 border-[#1E3A5F] rounded-xl text-xs">
              <span className="font-bold text-[#FACC15] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Filtros activos:
              </span>

              {selectedCategories.map((cat) => {
                const labelMap: Record<string, string> = {
                  braille: 'Braille',
                  'screen-reader': 'Lector de Pantalla',
                  'input-assist': 'Entrada & Control',
                  magnifier: 'Ampliadores',
                };
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryToggle(cat)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#0F1D36] border border-[#00FFFF] text-[#00FFFF] rounded-lg font-bold hover:bg-[#00FFFF]/20 cursor-pointer"
                    aria-label={`Eliminar filtro de categoría ${labelMap[cat] || cat}`}
                  >
                    <span>{labelMap[cat] || cat}</span>
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                );
              })}

              {selectedMethods.map((method) => {
                const labelMap: Record<string, string> = {
                  keyboard: 'Teclado',
                  voice: 'Voz',
                  gaze: 'Control Ocular',
                };
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleMethodToggle(method)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#0F1D36] border border-[#FACC15] text-[#FACC15] rounded-lg font-bold hover:bg-[#FACC15]/20 cursor-pointer"
                    aria-label={`Eliminar filtro de método ${labelMap[method] || method}`}
                  >
                    <span>{labelMap[method] || method}</span>
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                );
              })}

              {(minPrice !== '0' || maxPrice !== '13500000') && (
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice('0');
                    setMaxPrice('13500000');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#0F1D36] border border-slate-400 text-slate-200 rounded-lg font-bold hover:bg-slate-800 cursor-pointer"
                  aria-label="Restablecer filtro de precio"
                >
                  <span>Precio: {minPrice} COP - {maxPrice} COP</span>
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}

              {searchQuery.trim() !== '' && (
                <span className="px-2.5 py-1 bg-[#0F1D36] border border-cyan-300 text-cyan-200 rounded-lg font-bold">
                  Búsqueda: "{searchQuery}"
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-xs text-[#00FFFF] hover:underline font-bold cursor-pointer"
              >
                Limpiar todos
              </button>
            </div>
          )}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-[#112240] border-2 border-[#1E3A5F] rounded-2xl shadow-xl">
              <span className="material-symbols-outlined text-[48px] text-[#00FFFF] mb-2">
                search_off
              </span>
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                No se encontraron productos con estos criterios
              </h3>
              <p className="text-xs text-slate-300 mt-1 mb-4">
                Prueba a restablecer los filtros de precio o categoría para ver todas las soluciones disponibles.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                aria-label="Botón: Restablecer Filtros, limpiar criterios de búsqueda"
                data-speech="Botón: Restablecer Filtros, limpiar criterios de búsqueda"
                className="px-4 py-2 bg-[#00FFFF] hover:bg-[#22D3EE] text-[#0B192C] text-xs font-black rounded-xl focus-visible:outline focus-visible:outline-2 cursor-pointer transition-colors shadow-md"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
                <article
                  key={product.id}
                  tabIndex={0}
                  role="region"
                  aria-label={`Tarjeta: ${product.name}, categoría ${product.categoryLabel}, precio ${product.priceFormatted}. Pulsa Tab para ver opciones de compra.`}
                  data-speech={`Tarjeta: ${product.name}, categoría ${product.categoryLabel}, precio ${product.priceFormatted}, IVA incluido. Pulsa Tab para ver opciones de compra.`}
                  className="interactive-card bg-[#112240] border-2 border-[#1E3A5F] hover:border-[#00FFFF] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl transition-all"
                >
                  <div>
                    {/* Image */}
                    <div className="relative h-48 bg-[#0F1D36] overflow-hidden border-b border-[#1E3A5F]">
                      <img
                        src={product.image}
                        alt={product.imageAlt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="px-2.5 py-0.5 bg-[#FACC15] text-[#0B192C] text-[10px] font-black rounded-md shadow-md">
                          {product.badge}
                        </span>
                        <span className="px-2.5 py-0.5 bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF] text-[10px] font-bold rounded-md">
                          {product.subBadge}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <span className="text-[11px] uppercase font-black tracking-wider text-[#00FFFF] block mb-1">
                        {product.categoryLabel}
                      </span>
                      <h3 className="font-bold text-base text-[#FFFFFF] leading-snug mb-1.5">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                        {product.description}
                      </p>

                      <div className="p-2.5 bg-[#0F1D36] rounded-xl border border-[#1E3A5F] text-xs space-y-1 mb-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Categoría:</span>
                          <span className="font-bold text-white">{product.shortCategory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Disponibilidad:</span>
                          <span className="text-[#00FFFF] font-bold">En Stock (24h)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Actions */}
                  <div className="p-5 pt-0">
                    <div className="mb-3">
                      <span className="text-2xl font-black text-[#FACC15] block">
                        {product.priceFormatted}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
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
                        className="w-full py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-[#0B192C] rounded-xl font-black text-xs flex items-center justify-center gap-1.5 focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer shadow-md transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                        <span>Añadir al Carrito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSpeakProduct(product)}
                        aria-label={`Botón: Escuchar descripción, narrar especificaciones de ${product.name}`}
                        data-speech={`Botón: Escuchar descripción, narrar especificaciones de ${product.name}`}
                        className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer transition-colors ${
                          speakingProductId === product.id
                            ? 'bg-[#00FFFF] text-[#0B192C] shadow-md font-black'
                            : 'bg-[#112240] hover:bg-[#00FFFF]/15 text-[#00FFFF] border border-[#00FFFF]'
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
                        aria-label={`Botón: Ver Especificaciones, abrir ventana técnica de ${product.name}`}
                        data-speech={`Botón: Ver Especificaciones, abrir ventana técnica de ${product.name}`}
                        className="w-full py-2 bg-[#1E3A5F] text-white rounded-xl font-bold text-xs hover:bg-[#284B75] border border-[#334E68] text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer transition-colors"
                      >
                        Ver Especificaciones
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="flex flex-col gap-4">
              {paginatedProducts.map((product) => (
                <article
                  key={product.id}
                  tabIndex={0}
                  role="region"
                  aria-label={`Tarjeta en lista: ${product.name}, categoría ${product.categoryLabel}, precio ${product.priceFormatted}. Pulsa Tab para ver opciones de compra.`}
                  data-speech={`Tarjeta en lista: ${product.name}, categoría ${product.categoryLabel}, precio ${product.priceFormatted}, IVA incluido. Pulsa Tab para ver opciones de compra.`}
                  className="interactive-card bg-[#112240] border-2 border-[#1E3A5F] hover:border-[#00FFFF] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-xl transition-all"
                >
                  <div className="md:w-56 h-48 md:h-auto bg-[#0F1D36] relative shrink-0 border-b md:border-b-0 md:border-r border-[#1E3A5F]">
                    <img
                      src={product.image}
                      alt={product.imageAlt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="px-2.5 py-0.5 bg-[#FACC15] text-[#0B192C] text-[10px] font-black rounded-md shadow-md">
                        {product.badge}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] uppercase font-black tracking-wider text-[#00FFFF]">
                          {product.categoryLabel}
                        </span>
                        <span>•</span>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {product.shortCategory}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-[#FFFFFF] mb-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-300 mb-3 max-w-2xl leading-relaxed">
                        {product.description}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {product.specs.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-[#0F1D36] border border-[#1E3A5F] rounded-lg text-slate-200">
                            <strong className="text-[#00FFFF]">{s.label}:</strong> {s.value}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#1E3A5F]">
                      <div>
                        <span className="text-2xl font-black text-[#FACC15] block">
                          {product.priceFormatted}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          IVA (21%) incluido • Expedición asegurada
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleSpeakProduct(product)}
                          aria-label={`Botón: Escuchar descripción, narrar especificaciones de ${product.name}`}
                          data-speech={`Botón: Escuchar descripción, narrar especificaciones de ${product.name}`}
                          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer transition-colors ${
                            speakingProductId === product.id
                              ? 'bg-[#00FFFF] text-[#0B192C] font-black shadow-md'
                              : 'bg-[#112240] hover:bg-[#00FFFF]/15 text-[#00FFFF] border border-[#00FFFF]'
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
                          aria-label={`Botón: Ficha Técnica, abrir ventana técnica de ${product.name}`}
                          data-speech={`Botón: Ficha Técnica, abrir ventana técnica de ${product.name}`}
                          className="px-4 py-2 bg-[#1E3A5F] text-white rounded-xl font-bold text-xs hover:bg-[#284B75] border border-[#334E68] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer transition-colors"
                        >
                          Ficha Técnica
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(product);
                            announce(`Añadido ${product.name} al carrito por ${product.priceFormatted}`, 'polite');
                          }}
                          aria-label={`Botón: Añadir al Carrito, agregar ${product.name} por ${product.priceFormatted}`}
                          data-speech={`Botón: Añadir al Carrito, agregar ${product.name} por ${product.priceFormatted}`}
                          className="px-5 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-[#0B192C] rounded-xl font-black text-xs flex items-center gap-1.5 focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer shadow-md transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                          <span>Añadir al Carrito</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <nav
              aria-label="Paginación de productos"
              className="flex items-center justify-between border-t border-[#1E3A5F] pt-4 mt-2"
            >
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  announce(`Página ${currentPage - 1}`);
                }}
                aria-label="Botón: Página anterior, retroceder una página del catálogo"
                data-speech="Botón: Página anterior, retroceder una página del catálogo"
                className="px-3 py-2 bg-[#112240] border-2 border-[#1E3A5F] rounded-xl text-xs font-bold text-white hover:border-[#00FFFF] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer transition-colors shadow-md"
              >
                Anterior
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      aria-current={currentPage === pageNumber ? 'page' : undefined}
                      aria-label={`Botón: Ir a página ${pageNumber}, mostrar lote de productos`}
                      data-speech={`Botón: Ir a página ${pageNumber}, mostrar lote de productos`}
                      onClick={() => {
                        setCurrentPage(pageNumber);
                        announce(`Página ${pageNumber}`);
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-bold cursor-pointer focus-visible:outline focus-visible:outline-2 transition-colors ${
                        currentPage === pageNumber
                          ? 'bg-[#00FFFF] text-[#0B192C] font-black border-2 border-[#00FFFF] shadow-md'
                          : 'bg-[#112240] border-2 border-[#1E3A5F] text-white hover:border-[#00FFFF]'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  announce(`Página ${currentPage + 1}`);
                }}
                aria-label="Botón: Página siguiente, avanzar una página del catálogo"
                data-speech="Botón: Página siguiente, avanzar una página del catálogo"
                className="px-3 py-2 bg-[#112240] border-2 border-[#1E3A5F] rounded-xl text-xs font-bold text-white hover:border-[#00FFFF] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-white cursor-pointer transition-colors shadow-md"
              >
                Siguiente
              </button>
            </nav>
          )}

          {/* VPAT Reports Strip */}
          <section
            aria-label="Declaraciones de conformidad y reportes VPAT"
            className="p-6 bg-[#112240] border-2 border-[#00FFFF]/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-[#00FFFF]">
                description
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#FFFFFF]">
                  Informes de Accesibilidad & Declaraciones VPAT Disponibles
                </h3>
                <p className="text-xs text-slate-300">
                  Todos nuestros productos cuentan con documentación técnica descargable para auditorías y licitaciones públicas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenVpatModal}
              aria-label="Botón: Descargar Declaraciones VPAT, abrir repositorio de informes de conformidad técnica"
              data-speech="Botón: Descargar Declaraciones VPAT, abrir repositorio de informes de conformidad técnica"
              className="px-5 py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-[#0B192C] text-xs font-black rounded-xl focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer shrink-0 transition-colors shadow-md"
            >
              Descargar Declaraciones VPAT
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};
