import React, { useState, useEffect, useCallback } from 'react';
import { Screen, Product, CartItem, UserSession, AdminOrder, AdminCustomer } from './types';
import { PRODUCTS_DATA } from './data/products';
import { AnnouncerProvider, useAnnouncer } from './components/LiveAnnouncer';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeScreen } from './components/HomeScreen';
import { CatalogScreen } from './components/CatalogScreen';
import { CheckoutScreen } from './components/CheckoutScreen';
import { SupportScreen } from './components/SupportScreen';
import { AuthScreen } from './components/AuthScreen';
import { AdminScreen } from './components/AdminScreen';
import { ProductSpecsModal } from './components/ProductSpecsModal';
import { SpecialistModal } from './components/SpecialistModal';
import { VpatModal } from './components/VpatModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { AccessibilityWidget } from './components/AccessibilityWidget';
import { ContrastMode } from './types';
import { WELCOME_SPEECH_TEXT, playWelcomeSpeech, stopSpeech } from './utils/speech';
import { formatCop } from './utils/currency';
import { api } from './services/api';
import { useVoiceNavigation } from './hooks/useVoiceNavigation';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

function AppContent() {
  const { announce } = useAnnouncer();

  // Enable Voice Navigation for keyboard Tab and mouse hover across all links/buttons
  useVoiceNavigation(true);

  // Navigation state - defaults to 'home' for open accessible store browsing
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [pendingScreen, setPendingScreen] = useState<Screen | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isSessionResolved, setIsSessionResolved] = useState<boolean>(false);

  // Welcome audio announcement & ARIA live alert banner state
  const [showWelcomeBanner, setShowWelcomeBanner] = useState<boolean>(false);
  const [isSpeakingWelcome, setIsSpeakingWelcome] = useState<boolean>(false);

  const triggerWelcomeSpeech = () => {
    // Prioridad de Audio: Cancelar inmediatamente cualquier lectura de audio previa
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    playWelcomeSpeech({
      onStart: () => setIsSpeakingWelcome(true),
      onEnd: () => setIsSpeakingWelcome(false),
      onError: () => setIsSpeakingWelcome(false),
    });

    setShowWelcomeBanner(true);
    announce(WELCOME_SPEECH_TEXT, 'polite');
  };

  // High contrast & font scaling
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [fontSizePercentage, setFontSizePercentage] = useState<number>(100);

  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS_DATA);
  const [ordersList, setOrdersList] = useState<AdminOrder[]>([]);
  const [customersList, setCustomersList] = useState<AdminCustomer[]>([]);

  const handleAddProduct = async (newProduct: Product) => {
    try {
      const savedProduct = await api.addProduct(newProduct);
      setProductsList((previous) => [savedProduct, ...previous]);
      announce(`Producto ${savedProduct.name} guardado en el catálogo`);
    } catch (error) {
      announce(error instanceof Error ? error.message : 'No se pudo guardar el producto.', 'assertive');
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      const savedProduct = await api.updateProduct(updatedProduct);
      setProductsList((previous) => previous.map((product) => product.id === savedProduct.id ? savedProduct : product));
      announce(`Producto ${savedProduct.name} actualizado`);
    } catch (error) {
      announce(error instanceof Error ? error.message : 'No se pudo actualizar el producto.', 'assertive');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      setProductsList((previous) => previous.filter((product) => product.id !== productId));
      announce('Producto eliminado del catálogo');
    } catch (error) {
      announce(error instanceof Error ? error.message : 'No se pudo eliminar el producto.', 'assertive');
    }
  };

  const handleUpdateOrderStatus = async (orderNumber: string, newStatus: AdminOrder['status']) => {
    try {
      await api.updateOrderStatus(orderNumber, newStatus);
      setOrdersList((previous) => previous.map((order) => order.orderNumber === orderNumber ? { ...order, status: newStatus } : order));
      announce(`Estado de la orden #${orderNumber} actualizado a ${newStatus}`);
    } catch (error) {
      announce(error instanceof Error ? error.message : 'No se pudo actualizar el pedido.', 'assertive');
    }
  };

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedSpecsProduct, setSelectedSpecsProduct] = useState<Product | null>(null);
  const [isSpecialistOpen, setIsSpecialistOpen] = useState<boolean>(false);
  const [isVpatOpen, setIsVpatOpen] = useState<boolean>(false);
  const [orderConfirmation, setOrderConfirmation] = useState<{
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    totalAmount: string;
    itemCount: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    api.products().then((products) => {
      if (active) setProductsList(products);
    }).catch(() => undefined);
    api.currentUser().then((user) => {
      if (!active) return;
      setCurrentUser(user);
      setIsLoggedIn(true);
      if (user.highContrastDefault) setIsHighContrast(true);
    }).catch(() => undefined).finally(() => {
      if (active) setIsSessionResolved(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isSessionResolved) return;

    const returnParams = new URLSearchParams(window.location.search);
    if (returnParams.get('payment') !== 'return') return;

    const orderNumber = returnParams.get('order');
    const paymentId = returnParams.get('payment_id');
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);

    if (!isLoggedIn || !orderNumber) {
      announce('No se pudo verificar el pago. Inicia sesión con la cuenta que realizó el pedido.', 'assertive');
      return;
    }

    api.paymentStatus(orderNumber, paymentId)
      .then((order) => {
        if (order.paymentStatus === 'paid') {
          setOrderConfirmation({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            totalAmount: formatCop(order.totalAmount),
            itemCount: order.itemCount,
          });
          setCartItems([]);
          announce(`Pago confirmado para el pedido #${order.orderNumber}.`, 'assertive');
        } else if (order.paymentStatus === 'failed') {
          announce(`El pago del pedido #${order.orderNumber} no fue aprobado. Puedes volver a intentarlo desde Mercado Pago.`, 'assertive');
        } else {
          announce(`El pedido #${order.orderNumber} sigue pendiente de confirmación de pago.`, 'assertive');
        }
      })
      .catch((error: unknown) => {
        announce(error instanceof Error ? error.message : 'No se pudo verificar el estado del pago.', 'assertive');
      });
  }, [announce, isLoggedIn, isSessionResolved]);

  const handleLogout = useCallback((reason: 'manual' | 'idle' | 'history-navigation' = 'manual') => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShowWelcomeBanner(false);
    setIsSpeakingWelcome(false);
    stopSpeech();
    setPendingScreen(null);
    if (currentScreen === 'admin' || reason === 'history-navigation') setCurrentScreen('home');
    if (reason === 'history-navigation') window.history.replaceState(null, '', '/');

    const successMessage = reason === 'idle'
      ? 'Tu sesión se cerró automáticamente por 5 minutos de inactividad.'
      : reason === 'history-navigation'
        ? 'La sesión se cerró al navegar con los controles atrás o adelante del navegador.'
        : 'Has cerrado sesión correctamente.';
    void api.logout()
      .then(() => announce(successMessage))
      .catch((error: unknown) => {
        const details = error instanceof Error ? ` ${error.message}` : '';
        announce(`La sesión se cerró en este dispositivo, pero no se pudo invalidar en el servidor.${details}`, 'assertive');
      });
  }, [announce, currentScreen]);

  useEffect(() => {
    if (!isSessionResolved) return;

    const syncAdminRoute = () => {
      const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
      if (!isAdminRoute) {
        if (currentScreen === 'admin') setCurrentScreen('home');
        return;
      }

      if (currentUser?.role === 'admin') {
        setCurrentScreen('admin');
        setPendingScreen(null);
        return;
      }

      if (currentUser) {
        window.history.replaceState(null, '', '/');
        setPendingScreen(null);
        setCurrentScreen('home');
        announce('Acceso denegado: tu cuenta no tiene permisos de administrador.', 'assertive');
        return;
      }

      window.history.replaceState(null, '', '/auth');
      setPendingScreen('admin');
      setCurrentScreen('auth');
      announce('Inicia sesión con una cuenta administradora para acceder a esta ruta.');
    };

    const handleHistoryNavigation = () => {
      if (isLoggedIn) {
        handleLogout('history-navigation');
        return;
      }

      const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
      if (!isAdminRoute && pendingScreen === 'admin') {
        setPendingScreen(null);
        setCurrentScreen('home');
        return;
      }
      syncAdminRoute();
    };

    syncAdminRoute();
    window.addEventListener('popstate', handleHistoryNavigation);
    return () => window.removeEventListener('popstate', handleHistoryNavigation);
  }, [isSessionResolved, isLoggedIn, currentUser, currentScreen, pendingScreen, handleLogout, announce]);

  useEffect(() => {
    if (!isLoggedIn) return;

    let lastActivity = Date.now();
    let timeoutId: number;

    const checkInactivity = () => {
      window.clearTimeout(timeoutId);
      const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivity);
      if (remaining <= 0) {
        handleLogout('idle');
        return;
      }
      timeoutId = window.setTimeout(checkInactivity, remaining);
    };
    const recordActivity = () => {
      lastActivity = Date.now();
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(checkInactivity, INACTIVITY_TIMEOUT_MS);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkInactivity();
    };
    const activityEvents: Array<keyof WindowEventMap> = [
      'keydown',
      'mousedown',
      'mousemove',
      'scroll',
      'touchstart',
    ];

    timeoutId = window.setTimeout(checkInactivity, INACTIVITY_TIMEOUT_MS);
    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, handleLogout]);

  useEffect(() => {
    if (currentScreen !== 'admin' || currentUser?.role !== 'admin') return;
    Promise.all([api.adminOrders(), api.adminCustomers()])
      .then(([orders, customers]) => {
        setOrdersList(orders);
        setCustomersList(customers);
      })
      .catch((error) => announce(error instanceof Error ? error.message : 'No se pudo cargar la administración.', 'assertive'));
  }, [currentScreen, currentUser, announce]);

  // Effect for high contrast class on document.body
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
  }, [isHighContrast]);

  // Effect for dynamic font scaling
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSizePercentage}%`;
  }, [fontSizePercentage]);

  // Keyboard shortcut listener (Alt+C for High Contrast, Escape for closing modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        const next = !isHighContrast;
        setIsHighContrast(next);
        announce(next ? 'Modo de alto contraste activado' : 'Modo de alto contraste desactivado');
      }
      if (e.key === 'Escape') {
        if (selectedSpecsProduct) setSelectedSpecsProduct(null);
        if (isSpecialistOpen) setIsSpecialistOpen(false);
        if (isVpatOpen) setIsVpatOpen(false);
        if (orderConfirmation) setOrderConfirmation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSpecsProduct, isSpecialistOpen, isVpatOpen, orderConfirmation, announce, isHighContrast]);

  const handleToggleHighContrast = () => {
    const next = !isHighContrast;
    setIsHighContrast(next);
    announce(next ? 'Modo de alto contraste activado' : 'Modo de alto contraste desactivado');
  };

  const handleChangeFontSize = (delta: number) => {
    const next = Math.min(150, Math.max(80, fontSizePercentage + delta));
    setFontSizePercentage(next);
    announce(`Tamaño de fuente ajustado a ${next} por ciento`);
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    announce(`Añadido ${product.name} al carrito`);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentScreen('catalog');
      announce(`Buscando ${searchQuery} en el catálogo`);
    }
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleNavigation = (screen: Screen) => {
    if (screen === 'admin' && currentUser?.role !== 'admin') {
      if (!isLoggedIn) {
        setPendingScreen('admin');
        setCurrentScreen('auth');
        window.history.pushState(null, '', '/auth');
        announce('Debes iniciar sesión para acceder al modo administrador.');
      } else {
        window.history.replaceState(null, '', '/');
        announce('Tu cuenta no tiene permisos de administrador.', 'assertive');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPendingScreen(null);
    setCurrentScreen(screen);
    if (screen === 'admin') window.history.pushState(null, '', '/admin');
    else if (currentScreen === 'admin') window.history.pushState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentScreen === 'admin' && currentUser?.role === 'admin') {
    return (
      <AdminScreen
        products={productsList}
        orders={ordersList}
        customers={customersList}
        onNavigate={handleNavigation}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateOrderStatus={handleUpdateOrderStatus}
      />
    );
  }

  return (
    <div className="sky-theme min-h-screen flex flex-col bg-sky-50 text-slate-900 selection:bg-sky-600 selection:text-white">
      <a
        href="#main-content"
        aria-label="Enlace: Saltar directamente al contenido principal"
        data-speech="Enlace: Saltar directamente al contenido principal"
        className="skip-link"
      >
        Saltar directamente al contenido principal (Skip to content)
      </a>

      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigation}
        cartCount={totalCartCount}
        isHighContrast={isHighContrast}
        onToggleHighContrast={handleToggleHighContrast}
        fontSizePercentage={fontSizePercentage}
        onChangeFontSize={handleChangeFontSize}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        onLogout={() => handleLogout()}
      />

      {/* Main Content Area (padding-top accounts for fixed Header) */}
      <div className={`sky-theme flex-1 flex flex-col pt-36 sm:pt-36 lg:pl-64 ${pendingScreen === 'admin' ? 'bg-sky-50' : 'bg-[#0B192C]'}`}>
        {currentScreen === 'home' && (
          <main id="main-content" tabIndex={-1} className="focus:outline-none w-full bg-[#0B192C]">
            <HomeScreen
              products={productsList}
              onNavigate={(screen) => {
                handleNavigation(screen);
              }}
              onAddToCart={handleAddToCart}
              onOpenSpecsModal={setSelectedSpecsProduct}
              onOpenSpecialistModal={() => setIsSpecialistOpen(true)}
              onSelectCategoryFilter={(cat) => setCategoryFilter(cat)}
              onToggleHighContrast={handleToggleHighContrast}
            />
          </main>
        )}

        {currentScreen === 'catalog' && (
          <main id="main-content" tabIndex={-1} className="focus:outline-none w-full bg-[#0B192C]">
            <CatalogScreen
              products={productsList}
              onNavigate={(screen) => {
                handleNavigation(screen);
              }}
              onAddToCart={handleAddToCart}
              onOpenSpecsModal={setSelectedSpecsProduct}
              onOpenVpatModal={() => setIsVpatOpen(true)}
              initialCategoryFilter={categoryFilter}
              searchQuery={searchQuery}
              welcomeBanner={
                showWelcomeBanner
                  ? {
                      message: WELCOME_SPEECH_TEXT,
                      onDismiss: () => setShowWelcomeBanner(false),
                      onReplay: triggerWelcomeSpeech,
                      isSpeaking: isSpeakingWelcome,
                    }
                  : null
              }
            />
          </main>
        )}

        {currentScreen === 'checkout' && (
          <main id="main-content" tabIndex={-1} className="focus:outline-none w-full bg-[#F0F5FF]">
            <CheckoutScreen
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onNavigate={(screen) => {
                handleNavigation(screen);
              }}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onLoginSuccess={(user) => {
                setIsLoggedIn(true);
                setCurrentUser(user);
                if (user.highContrastDefault) {
                  setIsHighContrast(true);
                }
              }}
            />
          </main>
        )}

        {currentScreen === 'support' && (
          <main id="main-content" tabIndex={-1} className="focus:outline-none w-full bg-[#F0F5FF]">
            <SupportScreen
              onNavigate={(screen) => {
                handleNavigation(screen);
              }}
              onOpenSpecialistModal={() => setIsSpecialistOpen(true)}
              onOpenVpatModal={() => setIsVpatOpen(true)}
            />
          </main>
        )}

        {currentScreen === 'auth' && (
          <main id="main-content" tabIndex={-1} className="focus:outline-none w-full bg-[#F0F5FF]">
            <AuthScreen
              onNavigate={(screen) => {
                handleNavigation(screen);
              }}
              currentUser={currentUser}
              onLoginSuccess={(user) => {
                setIsLoggedIn(true);
                setCurrentUser(user);
                if (pendingScreen === 'admin' && user.role !== 'admin') {
                  setPendingScreen(null);
                  setCurrentScreen('home');
                  window.history.replaceState(null, '', '/');
                  announce('Tu cuenta no tiene permisos de administrador.', 'assertive');
                  return;
                }
                const destination = pendingScreen ?? (cartItems.length > 0 ? 'checkout' : 'home');
                setPendingScreen(null);
                setCurrentScreen(destination);
                if (destination === 'admin') window.history.replaceState(null, '', '/admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                triggerWelcomeSpeech();
                if (user.highContrastDefault) {
                  setIsHighContrast(true);
                }
              }}
              onLogout={() => handleLogout()}
            />
          </main>
        )}
      </div>

      {/* Global Accessible Footer */}
      <Footer
        onNavigate={(screen) => {
          handleNavigation(screen);
        }}
        onOpenVpatModal={() => setIsVpatOpen(true)}
        isLoggedIn={isLoggedIn}
      />

      {/* Floating Accessibility Widget (UserWay style - WCAG 2.1 AAA) */}
      <AccessibilityWidget
        currentScreen={currentScreen}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        isHighContrast={isHighContrast}
        onToggleHighContrast={(mode?: ContrastMode) => {
          setIsHighContrast(mode === 'inverse');
        }}
        fontSizePercentage={fontSizePercentage}
        onChangeFontSize={(size: 100 | 120 | 140) => {
          setFontSizePercentage(size);
        }}
      />

      {/* Modals & Dialogs */}
      <ProductSpecsModal
        product={selectedSpecsProduct}
        onClose={() => setSelectedSpecsProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <SpecialistModal
        isOpen={isSpecialistOpen}
        onClose={() => setIsSpecialistOpen(false)}
      />

      <VpatModal
        isOpen={isVpatOpen}
        onClose={() => setIsVpatOpen(false)}
      />

      {orderConfirmation && (
        <OrderConfirmationModal
          isOpen={true}
          orderNumber={orderConfirmation.orderNumber}
          customerName={orderConfirmation.customerName}
          customerEmail={orderConfirmation.customerEmail}
          totalAmount={orderConfirmation.totalAmount}
          itemCount={orderConfirmation.itemCount}
          onClose={() => setOrderConfirmation(null)}
          onNavigate={(screen) => {
            setOrderConfirmation(null);
            handleNavigation(screen);
          }}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <AnnouncerProvider>
      <AppContent />
    </AnnouncerProvider>
  );
}

export default App;
