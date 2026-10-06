export const BRAND = {
  name: '...',
  nameStrong: 'CIMMPLE',
  nameLight: 'HAIR',
  suffix: '.',              // ← add this
  established: '...',
  city: '...',
  whatsappNumber: '...',
  whatsappDisplay: '...',
  tiktok: '...',
  instagram: '...',
  email: '...',
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
