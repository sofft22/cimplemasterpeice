export const BRAND = {
  name: 'Cimmple hair',
  nameStrong: 'Cimmple',
  nameLight: 'hair',
  established: 'EST. 2026',
  city: 'Lagos',
  whatsappNumber: '2348012345678',
  whatsappDisplay: '+234 801 234 5678',
  tiktok: 'https://tiktok.com/@cimmple',
  instagram: 'https://instagram.com/cimmple',
  email: 'hello@cimmple.com',
};

export const BANK = {
  name: 'Access Bank',
  accountName: 'Cimmple Beauty',
  accountNumber: '0123456789',
};

export function formatPrice(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

export function generateOrderId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `CM-${n}`;
}