import React, { useState } from 'react';
import { Product, Screen, AdminOrder, AdminCustomer } from '../types';
import { formatCop, toCop } from '../utils/currency';

interface AdminScreenProps {
  products: Product[];
  orders: AdminOrder[];
  customers: AdminCustomer[];
  onNavigate: (screen: Screen) => void;
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct: (updatedProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderNumber: string, newStatus: AdminOrder['status']) => void;
}

type AdminTab = 'overview' | 'products' | 'orders' | 'customers';

export const AdminScreen: React.FC<AdminScreenProps> = ({
  products,
  orders,
  customers,
  onNavigate,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Search & Filter state for products
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<AdminOrder | null>(null);

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<Product['category']>('braille');
  const [newProdPrice, setNewProdPrice] = useState<number>(toCop(299));
  const [newProdStock, setNewProdStock] = useState<number>(15);
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&auto=format&fit=crop&q=80');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Calculations for KPI cards
  const getOrderAmount = (order: AdminOrder) =>
    order.totalAmountValue ?? (Number(order.totalAmount.replace(/[^0-9]/g, '')) || 0);
  const totalRevenue = orders.reduce((acc, order) => acc + getOrderAmount(order), 0);

  const lowStockCount = products.filter((p) => (p.stockCount ?? (p.inStock ? 10 : 0)) <= 5).length;
  const activeOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const revenueByMonth = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth() - 5 + index, 1);
    const value = orders.reduce((sum, order) => {
      if (!order.createdAt) return sum;
      const orderDate = new Date(order.createdAt);
      if (Number.isNaN(orderDate.getTime())) return sum;
      return orderDate.getFullYear() === date.getFullYear() && orderDate.getMonth() === date.getMonth()
        ? sum + getOrderAmount(order)
        : sum;
    }, 0);
    return {
      label: date.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''),
      value,
    };
  });
  const maxMonthlyRevenue = Math.max(...revenueByMonth.map((month) => month.value), 0);
  const orderStatuses = ([
    { key: 'pending', label: 'Pendientes', color: '#f59e0b' },
    { key: 'processing', label: 'En proceso', color: '#0ea5e9' },
    { key: 'shipped', label: 'Enviados', color: '#6366f1' },
    { key: 'delivered', label: 'Entregados', color: '#10b981' },
    { key: 'cancelled', label: 'Cancelados', color: '#f43f5e' },
  ] satisfies { key: AdminOrder['status']; label: string; color: string }[]).map((status) => ({
    ...status,
    count: orders.filter((order) => order.status === status.key).length,
  }));
  const productCategories = [
    { key: 'braille', label: 'Pantallas Braille' },
    { key: 'screen-reader', label: 'Lectores de pantalla' },
    { key: 'input-assist', label: 'Teclados adaptativos' },
    { key: 'magnifier', label: 'Lupas ópticas y electrónicas' },
  ].map((category) => ({
    ...category,
    count: products.filter((product) => product.category === category.key).length,
  }));
  const maxCategoryCount = Math.max(...productCategories.map((category) => category.count), 0);

  // Filtered products list
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchProductQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || prod.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || newProdPrice <= 0) return;

    const formattedPrice = formatCop(newProdPrice);

    const categoryLabels: Record<Product['category'], string> = {
      'braille': 'Pantallas Braille',
      'screen-reader': 'Lectores de Pantalla',
      'input-assist': 'Teclados Adaptativos',
      'magnifier': 'Lupas Ópticas y Electrónicas',
    };

    const isHardware = newProdCategory === 'braille' || newProdCategory === 'input-assist' || newProdCategory === 'magnifier';

    const created: Product = {
      id: 'prod-' + Date.now(),
      name: newProdName.trim(),
      category: newProdCategory,
      categoryLabel: categoryLabels[newProdCategory],
      shortCategory: isHardware ? 'Hardware' : 'Software Digital',
      icon: isHardware ? 'devices' : 'terminal',
      price: newProdPrice,
      priceFormatted: formattedPrice,
      priceType: isHardware ? 'Precio final de compra' : 'Licencia perpetua',
      image: newProdImage.trim() || 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&auto=format&fit=crop&q=80',
      imageAlt: newProdName,
      badge: isHardware ? 'Dispositivo Físico' : 'Software Descargable',
      subBadge: 'Stock Garantizado',
      description: newProdDesc.trim() || 'Producto asistivo de última generación para productividad e inclusión.',
      specs: [
        { label: 'Garantía', value: '3 Años Oficial' },
        { label: 'Compatibilidad', value: 'Windows / macOS / Linux' },
      ],
      inStock: newProdStock > 0,
      stockCount: newProdStock,
      wcagLevel: 'aaa-native',
      inputMethod: isHardware ? 'keyboard' : 'voice',
      warrantyInfo: 'Garantía de sustitución inmediata en 48h',
    };

    onAddProduct(created);
    setIsCreateModalOpen(false);
    // Reset form
    setNewProdName('');
    setNewProdPrice(toCop(299));
    setNewProdStock(15);
    setNewProdDesc('');
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onUpdateProduct(editingProduct);
    setEditingProduct(null);
  };

  return (
    <div className="sky-theme min-h-screen bg-sky-50 text-slate-800 font-sans flex flex-col selection:bg-sky-600 selection:text-white pb-16">
      {/* Top Professional Admin Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">SoftTech</span>
                <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                  Panel de Administración
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Control de catálogo, inventario, pedidos y métricas comerciales
              </p>
            </div>
          </div>

          {/* User profile & Return button */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-bold text-slate-700">Admin Activo: Rubén Ávila</span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              <span>Volver a la Tienda</span>
            </button>
          </div>
        </div>

      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:gap-8 lg:px-8">
        {/* Admin Navigation Sidebar: navegación lateral izquierda */}
        <nav aria-label="Navegación de administración" className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto border-b border-slate-200 bg-white lg:mt-8 lg:w-64 lg:flex-col lg:self-start lg:overflow-visible lg:rounded-xl lg:border lg:p-3 lg:shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-left text-xs font-bold transition-colors cursor-pointer sm:text-sm lg:w-full lg:rounded-lg lg:border-b-0 ${
              activeTab === 'overview'
                ? 'border-blue-600 bg-blue-50 text-blue-700 lg:border-l-4 lg:border-blue-600'
                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Métricas y Resumen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-left text-xs font-bold transition-colors cursor-pointer sm:text-sm lg:w-full lg:rounded-lg lg:border-b-0 ${
              activeTab === 'products'
                ? 'border-blue-600 bg-blue-50 text-blue-700 lg:border-l-4 lg:border-blue-600'
                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            <span>Catálogo y Productos ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-left text-xs font-bold transition-colors cursor-pointer sm:text-sm lg:w-full lg:rounded-lg lg:border-b-0 ${
              activeTab === 'orders'
                ? 'border-blue-600 bg-blue-50 text-blue-700 lg:border-l-4 lg:border-blue-600'
                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
            <span>Pedidos y Ventas</span>
            {activeOrdersCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-black">
                {activeOrdersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-left text-xs font-bold transition-colors cursor-pointer sm:text-sm lg:w-full lg:rounded-lg lg:border-b-0 ${
              activeTab === 'customers'
                ? 'border-blue-600 bg-blue-50 text-blue-700 lg:border-l-4 lg:border-blue-600'
                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Clientes Registrados ({customers.length})</span>
          </button>
        </nav>

      {/* Main Admin Content Container */}
      <main className="min-w-0 flex-1 pt-4 lg:pt-8">
        {/* TAB 1: OVERVIEW & METRICS */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Revenue */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Ingresos Facturados</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">payments</span>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {formatCop(totalRevenue)}
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  +18.4% este mes
                </span>
              </div>

              {/* Card 2: Orders Count */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Pedidos Totales</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">local_shipping</span>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{orders.length}</span>
                  <span className="text-xs font-medium text-slate-500">pedidos</span>
                </div>
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  {orders.filter(o => o.status === 'delivered').length} completados
                </span>
              </div>

              {/* Card 3: Products in Catalog */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Productos en Catálogo</span>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">category</span>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{products.length}</span>
                  <span className="text-xs font-medium text-slate-500">soluciones asistivas</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                  En 4 categorías principales
                </span>
              </div>

              {/* Card 4: Low Stock Alert */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Alertas de Stock</span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">warning</span>
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{lowStockCount}</span>
                  <span className="text-xs font-medium text-slate-500">artículos con &le; 5 uds.</span>
                </div>
                <span className={`text-xs font-semibold flex items-center gap-1 mt-1 ${
                  lowStockCount > 0 ? 'text-amber-600' : 'text-slate-500'
                }`}>
                  {lowStockCount > 0 ? 'Requieren reposición de inventario' : 'Inventario en niveles óptimos'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-2" aria-labelledby="revenue-chart-title">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 id="revenue-chart-title" className="text-base font-bold text-slate-900">Ingresos por mes</h2>
                    <p className="mt-1 text-xs text-slate-500">Facturación registrada en los últimos seis meses</p>
                  </div>
                  <span className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
                    Total: {formatCop(totalRevenue)}
                  </span>
                </div>
                {orders.some((order) => order.createdAt) ? (
                  <div
                    role="img"
                    aria-label={`Gráfico de ingresos mensuales: ${revenueByMonth.map((month) => `${month.label}, ${formatCop(month.value)}`).join('; ')}`}
                    className="flex h-48 items-end gap-2 border-b border-slate-200 px-1 sm:gap-4"
                  >
                    {revenueByMonth.map((month) => {
                      const barHeight = maxMonthlyRevenue > 0 ? Math.max(5, (month.value / maxMonthlyRevenue) * 100) : 0;
                      return (
                        <div key={month.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" aria-hidden="true">
                          <span className="max-w-full truncate text-[10px] font-semibold text-slate-500">
                            {month.value > 0
                              ? new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(month.value)
                              : ''}
                          </span>
                          <div className="flex h-[68%] w-full items-end justify-center">
                            <div
                              className="w-full max-w-12 rounded-t-lg bg-sky-500 transition-all"
                              style={{ height: `${barHeight}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold capitalize text-slate-500">{month.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="flex h-48 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">
                    El gráfico estará disponible cuando se registren pedidos.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs" aria-labelledby="orders-chart-title">
                <div className="mb-5">
                  <h2 id="orders-chart-title" className="text-base font-bold text-slate-900">Estado de pedidos</h2>
                  <p className="mt-1 text-xs text-slate-500">Distribución de {orders.length} pedidos registrados</p>
                </div>
                {orders.length > 0 ? (
                  <div
                    role="img"
                    aria-label={`Estado de pedidos: ${orderStatuses.map((status) => `${status.label}: ${status.count}`).join('; ')}`}
                    className="space-y-4"
                  >
                    {orderStatuses.map((status) => (
                      <div key={status.key} aria-hidden="true">
                        <div className="mb-1.5 flex justify-between gap-3 text-xs">
                          <span className="font-semibold text-slate-600">{status.label}</span>
                          <span className="font-bold text-slate-900">{status.count}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(status.count / orders.length) * 100}%`, backgroundColor: status.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="flex h-48 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">
                    Aún no hay pedidos para mostrar.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs xl:col-span-3" aria-labelledby="catalog-chart-title">
                <div className="mb-5">
                  <h2 id="catalog-chart-title" className="text-base font-bold text-slate-900">Productos por categoría</h2>
                  <p className="mt-1 text-xs text-slate-500">Distribución actual del catálogo ({products.length} productos)</p>
                </div>
                {products.length > 0 ? (
                  <div
                    role="img"
                    aria-label={`Productos por categoría: ${productCategories.map((category) => `${category.label}: ${category.count}`).join('; ')}`}
                    className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2"
                  >
                    {productCategories.map((category) => (
                      <div key={category.key} aria-hidden="true">
                        <div className="mb-1.5 flex justify-between gap-3 text-xs">
                          <span className="font-semibold text-slate-600">{category.label}</span>
                          <span className="font-bold text-slate-900">{category.count}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${maxCategoryCount > 0 ? (category.count / maxCategoryCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="flex h-24 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">
                    No hay productos en el catálogo.
                  </p>
                )}
              </section>
            </div>

            {/* Quick Actions and Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Orders List (2 Cols) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Últimos Pedidos Registrados</h2>
                    <p className="text-xs text-slate-500">Ventas en tiempo real procesadas por la pasarela</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Ver todos los pedidos &rarr;
                  </button>
                </div>

                <div className="divide-y divide-slate-100 overflow-x-auto">
                  {orders.slice(0, 4).map((order) => (
                    <div key={order.orderNumber} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                          #{order.orderNumber.slice(-3)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-900 block">{order.customerName}</span>
                          <span className="text-xs text-slate-400 font-mono">{order.customerEmail} • {order.date}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-slate-900 block">{order.totalAmount}</span>
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          order.status === 'shipped' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {order.status === 'delivered' ? 'Entregado' : order.status === 'shipped' ? 'Enviado' : 'En proceso'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fast Operations Card (1 Col) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                    Acciones de Gestión Rápida
                  </h2>
                  <p className="text-xs text-slate-500 mt-2 mb-5">
                    Herramientas de configuración y administración directa del inventario comercial.
                  </p>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>Publicar Nuevo Producto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">tune</span>
                      <span>Actualizar Precios y Stock</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('customers')}
                      className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">badge</span>
                      <span>Consultar Base de Clientes</span>
                    </button>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 leading-relaxed">
                  <strong>ℹ️ Nota Operativa:</strong> Cualquier cambio en stock o precios se actualiza inmediatamente para los clientes de la tienda.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS CATALOG (CRUD) */}
        {activeTab === 'products' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Action Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                    placeholder="Buscar producto o tecnología..."
                    className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">Todas las categorías</option>
                  <option value="braille">Pantallas Braille</option>
                  <option value="screen-reader">Lectores de Pantalla</option>
                  <option value="input-assist">Teclados Adaptativos</option>
                  <option value="magnifier">Lupas y Óptica</option>
                </select>
              </div>

              {/* Create Button */}
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer hover:shadow-md shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">add_box</span>
                <span>Crear Nuevo Producto</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Producto</th>
                      <th className="py-3.5 px-4">Categoría</th>
                      <th className="py-3.5 px-4">Precio</th>
                      <th className="py-3.5 px-4">Stock</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredProducts.map((product) => {
                      const stock = product.stockCount ?? (product.inStock ? 12 : 0);
                      return (
                        <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block text-sm">{product.name}</span>
                                <span className="text-[11px] text-slate-400 line-clamp-1">{product.description}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600">
                            {product.categoryLabel}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                            {product.priceFormatted}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold">{stock} uds.</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {stock > 5 ? (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px] uppercase">
                                En Stock
                              </span>
                            ) : stock > 0 ? (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px] uppercase">
                                Stock Bajo
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full font-bold text-[10px] uppercase">
                                Agotado
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingProduct(product)}
                                title="Editar producto"
                                className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de eliminar "${product.name}" del catálogo comercial?`)) {
                                    onDeleteProduct(product.id);
                                  }
                                }}
                                title="Eliminar producto"
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Control de Órdenes y Facturación</h2>
                <p className="text-xs text-slate-500">Historial de pedidos recibidos desde la pasarela de la tienda</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                Total: {orders.length} pedidos
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Nº Pedido</th>
                      <th className="py-3.5 px-4">Fecha</th>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Importe</th>
                      <th className="py-3.5 px-4">Artículos</th>
                      <th className="py-3.5 px-4">Estado del Pedido</th>
                      <th className="py-3.5 px-4 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {orders.map((order) => (
                      <tr key={order.orderNumber} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                          #{order.orderNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{order.date}</td>
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 block">{order.customerName}</strong>
                          <span className="text-slate-400 font-mono text-[11px]">{order.customerEmail}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900 text-sm">
                          {order.totalAmount}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">{order.itemCount} uds.</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateOrderStatus(order.orderNumber, e.target.value as AdminOrder['status'])}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              order.status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <option value="pending">Pendiente</option>
                            <option value="processing">En preparación</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(order)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                            <span>Factura</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMERS DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Directorio de Clientes Registrados</h2>
                <p className="text-xs text-slate-500">Gestión de usuarios y volumen de compras acumuladas</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                {customers.length} Clientes activos
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Rol</th>
                      <th className="py-3.5 px-4">Fecha de Registro</th>
                      <th className="py-3.5 px-4">Pedidos Realizados</th>
                      <th className="py-3.5 px-4">Gasto Acumulado</th>
                      <th className="py-3.5 px-4 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs">
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <strong className="text-slate-900 block">{c.name}</strong>
                              <span className="text-slate-400 font-mono text-[11px]">{c.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            c.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{c.registeredDate}</td>
                        <td className="py-3.5 px-4 font-bold">{c.ordersCount} pedidos</td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">{c.totalSpent}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px] uppercase">
                            Activo
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CREATE PRODUCT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[24px]">add_box</span>
                <h3 className="text-base font-extrabold text-slate-900">Crear Nuevo Producto en Catálogo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="mt-4 flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej. Teclado Braille Ultracompacto v4"
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría *</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as Product['category'])}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500"
                  >
                    <option value="braille">Pantalla Braille (Hardware)</option>
                    <option value="screen-reader">Lector de Pantalla (Software)</option>
                    <option value="input-assist">Teclado Adaptativo (Hardware)</option>
                    <option value="magnifier">Lupa Óptica (Hardware)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio (COP) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Existencias Iniciales (Stock)</label>
                  <input
                    type="number"
                    min={0}
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL de Imagen</label>
                  <input
                    type="url"
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción del Producto</label>
                <textarea
                  rows={3}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Describe las especificaciones de ergonomía, conectividad y accesibilidad..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold shadow-sm cursor-pointer transition-all hover:shadow-md"
                >
                  Guardar y Publicar en Tienda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[24px]">edit_note</span>
                <h3 className="text-base font-extrabold text-slate-900">Editar Producto: {editingProduct.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="mt-4 flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio (COP)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingProduct.price}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const formatted = formatCop(val);
                      setEditingProduct({
                        ...editingProduct,
                        price: val,
                        priceFormatted: formatted,
                      });
                    }}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock (Unidades)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.stockCount ?? (editingProduct.inStock ? 10 : 0)}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      setEditingProduct({
                        ...editingProduct,
                        stockCount: count,
                        inStock: count > 0,
                      });
                    }}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold shadow-sm cursor-pointer transition-all hover:shadow-md"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ORDER / INVOICE DETAILS */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[24px]">receipt</span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Factura Oficial #{selectedOrderDetails.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha de Emisión:</span>
                  <strong className="text-slate-800">{selectedOrderDetails.date}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destinatario / Cliente:</span>
                  <strong className="text-slate-800">{selectedOrderDetails.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Correo Electrónico:</span>
                  <span className="font-mono text-slate-700">{selectedOrderDetails.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Método de Pago:</span>
                  <span className="font-bold text-slate-700">{selectedOrderDetails.paymentMethod || 'Tarjeta Segura'}</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-600 block">Total Transacción (IVA incluido 21%):</span>
                  <span className="text-2xl font-black text-slate-900">{selectedOrderDetails.totalAmount}</span>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                  Pagado y Conciliado
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Factura electrónica conforme a la directiva de accesibilidad europea y CEAPAT. Compatible con presentación ante administraciones públicas autonómicas.
              </p>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    alert(`Descargando copia PDF/UA de la Factura #${selectedOrderDetails.orderNumber}`);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Descargar Factura PDF/UA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
