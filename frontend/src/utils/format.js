// Les prix sont stockés en euros dans les données ; l'interface les affiche en dirhams.
export const EUR_TO_MAD = 10.8;

export const CATEGORY_LABELS = {
  eco: 'Écologique',
  luxury: 'Luxe',
  practical: 'Pratique',
  performance: 'Performance',
};

export const categoryLabel = (category) => CATEGORY_LABELS[category] || category;

export const toMAD = (priceEur) => Math.round(priceEur * EUR_TO_MAD);

export const formatPriceMAD = (priceEur, fallback = '—') =>
  priceEur ? `${toMAD(priceEur).toLocaleString('fr-FR')} DH` : fallback;
