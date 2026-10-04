import { AdminCustomer, AdminOrder, Product, UserSession } from '../types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? 'No se pudo completar la solicitud.');
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  products: () => request<Product[]>('/products'),
  currentUser: async () => (await request<{ user: UserSession }>('/auth/me')).user,
  login: async (email: string, password: string) =>
    (await request<{ user: UserSession }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })).user,
  register: async (data: {
    name: string;
    email: string;
    password: string;
    preferredAssistiveTech?: string;
    highContrastDefault?: boolean;
  }) => (await request<{ user: UserSession }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })).user,
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  createOrder: (data: {
    customerName: string;
    customerEmail: string;
    address: string;
    phone: string;
    deliveryNotes: string;
    paymentMethod: string;
    items: { productId: string; quantity: number }[];
  }) => request<{
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    itemCount: number;
  }>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  adminOrders: () => request<AdminOrder[]>('/admin/orders'),
  adminCustomers: () => request<AdminCustomer[]>('/admin/customers'),
  addProduct: (product: Product) => request<Product>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  updateProduct: (product: Product) => request<Product>(`/admin/products/${encodeURIComponent(product.id)}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  }),
  deleteProduct: (productId: string) => request<void>(`/admin/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  }),
  updateOrderStatus: (orderNumber: string, status: AdminOrder['status']) =>
    request<void>(`/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};