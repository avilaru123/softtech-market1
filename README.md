# SoftTech Market 🛒♿

> Plataforma de comercio electrónico de software y hardware asistivo con certificación de accesibilidad estricta WCAG 2.1 AAA.

Este proyecto está configurado y optimizado para ejecutarse en **Google AI Studio**, **Antigravity IDE**, o en cualquier entorno local moderno con Node.js y Vite.

---

## 🚀 Inicio Rápido (Quickstart)

### Requisitos Previos
- **Node.js** v18 o superior (recomendado Node 20+)
- **npm**, **yarn**, **pnpm** o **bun**

### 1. Instalación de dependencias
```bash
npm install
```

### 2. Ejecutar servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible de inmediato en `http://localhost:3000` (o el puerto configurado).

### 3. Compilar para producción
```bash
npm run build
```
Genera la compilación estática ultra-optimizada en el directorio `dist/`.

### 4. Verificar tipos y lint
```bash
npm run lint
```

---

## 🗄️ Preparar MySQL

La tienda guarda sus datos en MySQL. Prisma crea las tablas y Express comunica la tienda con esa base de datos.

1. Abre MySQL Workbench, conéctate a tu servidor y ejecuta esta consulta:
   ```sql
   CREATE DATABASE softtech_market CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. En una terminal del proyecto, crea tu configuración local:
   ```powershell
   Copy-Item .env.example .env
   ```
3. Abre `.env` y reemplaza `USER` y `PASSWORD` en `DATABASE_URL` por los datos de tu MySQL. Cambia también `SESSION_SECRET` por una frase aleatoria de al menos 32 caracteres. Completa `ADMIN_EMAIL` y `ADMIN_PASSWORD` para crear tu cuenta administradora; la contraseña debe tener al menos 12 caracteres. No compartas ni subas `.env`.
4. Crea las tablas y carga el catálogo inicial:
   ```bash
   npm run db:generate
   npm run db:migrate -- --name inicial
   npm run db:seed
   ```
5. Abre dos terminales. En la primera ejecuta `npm run dev:api`; en la segunda, `npm run dev`. La tienda queda en `http://localhost:3000`.
6. En MySQL Workbench, actualiza el panel de esquemas para ver las tablas y los productos cargados.

Los pedidos se guardan con pago pendiente. Para cobrar de verdad hace falta integrar un proveedor de pagos; la aplicación no guarda números ni códigos de tarjetas.

---

## 🛠️ Stack Tecnológico

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/)
- **API**: Express 4 + TypeScript
- **Base de datos**: MySQL + Prisma 6
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Iconografía**: [Lucide React](https://lucide.react.dev/) + Google Material Symbols Outlined
- **Animaciones**: [Motion](https://motion.dev/)
- **Audio & Narración Asistiva**: Web Speech API (`SpeechSynthesis`) en Español con prioridad y cancelación por tecla Escape (ESC)

---

## ♿ Características de Accesibilidad (WCAG 2.1 AAA)

1. **Navegación Asistida por Voz**: Narración automática de elementos interactivos al tabular (`Tab`) o pasar el cursor, con cancelación instantánea mediante `Escape`.
2. **Foco Visual de Alta Definición**: Indicador de enfoque por teclado `:focus-visible` con borde nítido de `4px solid #00FFFF` (Cian Neón), sin filtros de desenfoque ni capas de sombra que causen lentitud.
3. **Lector de Pantalla en Vivo (ARIA Live Announcer)**: Notificaciones dinámicas en tiempo real para cambios de pantalla, adición al carrito y filtros de búsqueda.
4. **Widget Flotante de Accesibilidad**:
   - Modos de Alto Contraste (Normal, Inverso Negro/Amarillo, Escala de Grises).
   - Ajuste de tamaño de fuente tipográfica (100%, 120%, 140%).
   - Espaciado apto para dislexia.
   - Resaltado de enlaces interactivos.
   - Ocultamiento de imágenes para reducción de sobrecarga sensorial.
   - Congelación de animaciones (`prefers-reduced-motion`).
   - Puntero / cursor de mouse ampliado de alto contraste (44px).
5. **Enlace de salto directo (Skip to content)** accesible por teclado.

---

## 📁 Estructura del Proyecto

```
├── public/                 # Recursos estáticos
├── src/
│   ├── components/         # Componentes modulares de interfaz
│   │   ├── AccessibilityWidget.tsx  # Centro de control de accesibilidad
│   │   ├── AuthScreen.tsx           # Flujo de autenticación accesible
│   │   ├── CatalogScreen.tsx        # Catálogo de productos y filtros
│   │   ├── CheckoutScreen.tsx       # Carrito y pasarela de pago accesible
│   │   ├── Footer.tsx               # Pie de página accesible
│   │   ├── Header.tsx               # Barra de navegación principal
│   │   ├── HomeScreen.tsx           # Pantalla de inicio
│   │   ├── LiveAnnouncer.tsx        # Proveedor de región ARIA live
│   │   ├── OrderConfirmationModal.tsx # Confirmación accesible de pedido
│   │   ├── ProductSpecsModal.tsx    # Ficha técnica y VPAT modal
│   │   ├── SpecialistModal.tsx      # Asesoría con especialista
│   │   ├── SupportScreen.tsx        # Centro de soporte accesible
│   │   └── VpatModal.tsx            # Informe de conformidad VPAT
│   ├── data/
│   │   └── products.ts     # Catálogo de soluciones asistivas certificadas
│   ├── hooks/
│   │   └── useVoiceNavigation.ts    # Hook de navegación asistida por voz y teclado
│   ├── utils/
│   │   └── speech.ts       # Control de voz sintética en español
│   ├── App.tsx             # Enrutador y orquestador principal
│   ├── index.css           # Estilos base y temas de accesibilidad
│   ├── main.tsx            # Punto de entrada React
│   └── types.ts            # Definiciones de TypeScript
├── index.html              # Entrada HTML con metadatos SEO y tipografías
├── metadata.json           # Metadatos del applet en AI Studio
├── package.json            # Dependencias y scripts
├── tsconfig.json           # Configuración de compilación TypeScript
└── vite.config.ts          # Configuración de Vite y Tailwind
```

---

## 💡 Exportación a Antigravity IDE

Para abrir este proyecto en **Antigravity IDE**:
1. Desde el menú superior de AI Studio, selecciona **Export** -> **GitHub** o **Download ZIP**.
2. Abre la carpeta del proyecto directamente en Antigravity IDE (`File` > `Open Folder`).
3. La terminal integrada detectará automáticamente la configuración de `package.json` y `vite.config.ts`.
4. Ejecuta `npm install` y `npm run dev` para comenzar a desarrollar.
