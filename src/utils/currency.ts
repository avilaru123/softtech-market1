export const EUR_TO_COP = 4500;

export const toCop = (amountInEur: number) => Math.round(amountInEur * EUR_TO_COP);

export const formatCop = (amountInCop: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInCop);
