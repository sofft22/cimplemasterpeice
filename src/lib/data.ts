import type { Product, Service, Review } from '../types';

export const FAKE_PRODUCTS: Product[] = [
  // ---- SKINCARE ----
  {
    id: '1', name: 'Vitamin C Glow Serum', description: 'Brightens and evens skin tone in 4 weeks.',
    price: 18500, compare_at_price: 24000,
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
    image_urls: [
      'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&q=80',
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
    ],
    in_stock: true, category_id: 'skincare', badge: 'Bestseller', cart_adds: 142,
    variants: { suggested: [
      { label: '15ml', priceDelta: 0 },
      { label: '30ml', priceDelta: 6500 },
    ]},
  },
  {
    id: '2', name: 'Hyaluronic Hydrating Serum', description: 'Deep hydration for plump, dewy skin.',
    price: 16500, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&q=80',
    in_stock: true, category_id: 'skincare', badge: null, cart_adds: 98,
    variants: { suggested: [{ label: '30ml', priceDelta: 0 }] },
  },
  {
    id: '3', name: 'Rosewater Toner', description: 'Refreshing rose mist to balance skin.',
    price: 9500, compare_at_price: 12000,
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
    image_urls: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80'],
    in_stock: true, category_id: 'skincare', badge: 'New', cart_adds: 76,
    variants: { suggested: [
      { label: '100ml', priceDelta: 0 },
      { label: '200ml', priceDelta: 5500 },
    ]},
  },
  {
    id: '4', name: 'Gentle Foaming Cleanser', description: 'Removes makeup without stripping.',
    price: 8500, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80',
    in_stock: true, category_id: 'skincare', badge: null, cart_adds: 121,
    variants: { suggested: [{ label: '150ml', priceDelta: 0 }] },
  },
  // ---- MAKEUP ----
  {
    id: '5', name: 'Satin Matte Lipstick', description: 'Long-wear colour in one smooth swipe.',
    price: 7500, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80',
    image_urls: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
    ],
    in_stock: true, category_id: 'makeup', badge: 'Bestseller', cart_adds: 168,
    variants: { suggested: [
      { label: 'Rouge', priceDelta: 0 },
      { label: 'Nude Rose', priceDelta: 0 },
      { label: 'Berry', priceDelta: 0 },
    ]},
  },
  {
    id: '6', name: 'Volumizing Mascara', description: 'Fanned-out lashes, zero clumps.',
    price: 9500, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1631730359585-38a4935cbec4?w=800&q=80',
    in_stock: true, category_id: 'makeup', badge: null, cart_adds: 112,
    variants: { suggested: [{ label: 'Black', priceDelta: 0 }] },
  },
  {
    id: '7', name: 'Cream Blush Stick', description: 'Blendable colour for a flush of warmth.',
    price: 8000, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&q=80',
    image_urls: ['https://images.unsplash.com/photo-1631214540242-3cd8c4b0e5c1?w=800&q=80'],
    in_stock: true, category_id: 'makeup', badge: 'New', cart_adds: 87,
    variants: { suggested: [
      { label: 'Peach', priceDelta: 0 },
      { label: 'Rose', priceDelta: 0 },
      { label: 'Berry', priceDelta: 0 },
    ]},
  },
  {
    id: '8', name: 'Champagne Highlighter', description: 'A soft glow that catches every light.',
    price: 11000, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    in_stock: true, category_id: 'makeup', badge: null, cart_adds: 79,
    variants: { suggested: [
      { label: 'Champagne', priceDelta: 0 },
      { label: 'Gold', priceDelta: 500 },
    ]},
  },
  // ---- HAIR ----
  {
    id: '9', name: 'Argan Repair Hair Oil', description: 'Shine and strength for dry ends.',
    price: 12500, compare_at_price: 15000,
    image_url: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800&q=80',
    in_stock: true, category_id: 'hair', badge: 'Bestseller', cart_adds: 145,
    variants: { suggested: [
      { label: '50ml', priceDelta: 0 },
      { label: '100ml', priceDelta: 7500 },
    ]},
  },
  {
    id: '10', name: 'Silk Scrunchie Set', description: 'Five silk scrunchies that never crease.',
    price: 6500, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    image_urls: [
      'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800&q=80',
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
    ],
    in_stock: true, category_id: 'hair', badge: null, cart_adds: 92,
    variants: { suggested: [
      { label: 'Blush', priceDelta: 0 },
      { label: 'Champagne', priceDelta: 0 },
      { label: 'Espresso', priceDelta: 0 },
    ]},
  },
  {
    id: '11', name: 'Hydrating Hair Mask', description: 'Deep conditioning for soft, glossy hair.',
    price: 14500, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&q=80',
    in_stock: true, category_id: 'hair', badge: null, cart_adds: 68,
    variants: { suggested: [{ label: '250ml', priceDelta: 0 }] },
  },
  {
    id: '12', name: 'Scalp Massage Brush', description: 'Stimulates growth and lifts product.',
    price: 5500, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=80',
    in_stock: false, category_id: 'hair', badge: null, cart_adds: 42,
    variants: { suggested: [{ label: 'Blush', priceDelta: 0 }] },
  },
  // ---- BODY ----
  {
    id: '13', name: 'Shea Body Butter', description: 'Rich, whipped cream for glowing skin.',
    price: 9500, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
    image_urls: ['https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800&q=80'],
    in_stock: true, category_id: 'body', badge: 'Bestseller', cart_adds: 138,
    variants: { suggested: [
      { label: 'Vanilla', priceDelta: 0 },
      { label: 'Rose', priceDelta: 0 },
      { label: 'Unscented', priceDelta: 0 },
    ]},
  },
  {
    id: '14', name: 'Rose Bath Salts', description: 'Soothing soak with real rose petals.',
    price: 7500, compare_at_price: 9500,
    image_url: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800&q=80',
    in_stock: true, category_id: 'body', badge: null, cart_adds: 61,
    variants: { suggested: [{ label: '500g', priceDelta: 0 }] },
  },
  {
    id: '15', name: 'Exfoliating Sugar Scrub', description: 'Polishes skin smooth with brown sugar.',
    price: 8500, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80',
    in_stock: true, category_id: 'body', badge: 'New', cart_adds: 74,
    variants: { suggested: [
      { label: 'Coconut', priceDelta: 0 },
      { label: 'Vanilla', priceDelta: 0 },
    ]},
  },
  // ---- FRAGRANCE ----
  {
    id: '16', name: 'Vanilla Musk Eau de Parfum', description: 'Warm vanilla with a soft musk trail.',
    price: 45000, compare_at_price: 55000,
    image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
    image_urls: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
    ],
    in_stock: true, category_id: 'fragrance', badge: 'Bestseller', cart_adds: 156,
    variants: { suggested: [
      { label: '30ml', priceDelta: 0 },
      { label: '50ml', priceDelta: 15000 },
      { label: '100ml', priceDelta: 35000 },
    ]},
  },
  {
    id: '17', name: 'Rose Oud Eau de Parfum', description: 'Rich rose over smoky oud wood.',
    price: 52000, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80',
    in_stock: true, category_id: 'fragrance', badge: null, cart_adds: 103,
    variants: { suggested: [{ label: '50ml', priceDelta: 0 }] },
  },
  // ---- TOOLS ----
  {
    id: '18', name: 'Rose Quartz Facial Roller', description: 'Cooling stone to depuff and sculpt.',
    price: 12500, compare_at_price: 16000,
    image_url: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80',
    in_stock: true, category_id: 'tools', badge: null, cart_adds: 82,
    variants: { suggested: [
      { label: 'Rose Quartz', priceDelta: 0 },
      { label: 'Jade', priceDelta: 0 },
    ]},
  },
  {
    id: '19', name: 'Gua Sha Sculpting Stone', description: 'Lifts and defines with daily use.',
    price: 9500, compare_at_price: null,
    image_url: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=800&q=80',
    in_stock: true, category_id: 'tools', badge: null, cart_adds: 59,
    variants: { suggested: [
      { label: 'Rose Quartz', priceDelta: 0 },
      { label: 'Jade', priceDelta: 0 },
    ]},
  },
  {
    id: '20', name: 'Luxury Brush Set', description: 'Twelve soft brushes in a velvet case.',
    price: 28000, compare_at_price: 35000,
    image_url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=80',
    in_stock: true, category_id: 'tools', badge: 'Bestseller', cart_adds: 118,
    variants: { suggested: [{ label: '12-piece', priceDelta: 0 }] },
  },
];

export const FAKE_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Hair Styling',
    description: 'A personal styling session at our Lagos studio — braids, blowouts, curls, or a full finish.',
    duration: '90–120 min',
    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80',
    image_urls: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80',
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&q=80',
    ],
    in_stock: true,
    variants: [
      { label: 'Braiding', price: 15000, description: 'Neat braids, your choice of pattern.' },
      { label: 'Blowout', price: 10000, description: 'Wash, dry, style. Smooth finish.' },
      { label: 'Curls', price: 12000, description: 'Defined curls with heat or rollers.' },
      { label: 'Deep conditioning', price: 18000, description: 'Treatment + styling combo.' },
    ],
  },
  {
    id: 's2',
    name: 'Beauty Consultation',
    description: 'One-on-one session to build a skincare routine that actually works for you.',
    duration: '45 min',
    image_url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80',
    image_urls: [
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&q=80',
      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=1200&q=80',
    ],
    in_stock: true,
    variants: [
      { label: 'In-studio consultation', price: 8000, description: 'Skin analysis + routine build.' },
      { label: 'Virtual consultation', price: 6000, description: '45 min video call.' },
      { label: 'With product sample kit', price: 15000, description: 'Consultation + curated samples.' },
    ],
  },
  {
    id: 's3',
    name: 'Bridal & Event Glam',
    description: 'Full hair & makeup for your big day — trial session included.',
    duration: '3 hours',
    image_url: 'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=1200&q=80',
    image_urls: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80',
    ],
    in_stock: true,
    variants: [
      { label: 'Bride only', price: 85000, description: 'Trial + day-of hair & makeup.' },
      { label: 'Bride + 2 bridesmaids', price: 120000, description: 'Package for three.' },
      { label: 'Bride + 4 bridesmaids', price: 165000, description: 'Package for five.' },
      { label: 'Mother-of-the-bride', price: 25000, description: 'Standalone glam session.' },
    ],
  },
  {
    id: 's4',
    name: 'Manicure & Pedicure',
    description: 'Clean, shape, and care — with a colour of your choice.',
    duration: '60 min',
    image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&q=80',
    image_urls: [
      'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=1200&q=80',
      'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=1200&q=80',
    ],
    in_stock: true,
    variants: [
      { label: 'Classic manicure', price: 8000, description: 'Shape, file, classic polish.' },
      { label: 'Gel manicure', price: 12000, description: 'Long-wear gel polish.' },
      { label: 'Classic pedicure', price: 10000, description: 'Full pedicure with polish.' },
      { label: 'Gel pedicure', price: 14000, description: 'Long-wear gel on toes.' },
      { label: 'Full mani + pedi', price: 18000, description: 'Both, with a colour of choice.' },
      { label: 'Nail art add-on', price: 1500, description: 'Per nail. Custom design.' },
    ],
  },
];

export const FAKE_REVIEWS: Review[] = [
  { id: 'r1', name: 'Chioma O.',   rating: 5, comment: 'The Vitamin C serum changed my skin. Glowing in two weeks.', time: '2d ago' },
  { id: 'r2', name: 'Ada N.',      rating: 5, comment: 'Ordered Monday, got it Tuesday. Fast and beautifully packaged.', time: '1w ago' },
  { id: 'r3', name: 'Ngozi A.',    rating: 4, comment: 'The lipstick is now my daily. Doesn’t dry my lips at all.', time: '3d ago' },
  { id: 'r4', name: 'Fatima B.',   rating: 5, comment: 'Wore the Rose Oud to a wedding — five people asked what I was wearing.', time: '5d ago' },
  { id: 'r5', name: 'Blessing E.', rating: 5, comment: 'Convinced my sister to buy the silk scrunchie set. Now we both have one.', time: '1w ago' },
  { id: 'r6', name: 'Tolu M.',     rating: 4, comment: 'Bought the brush set in three colours. No regrets.', time: '4d ago' },
];

export const LAGOS_AXES = [
  {
    id: 'axis-1',
    label: 'Axis 1: Lekki phase 1, Freedom Way, Itedo, Ikate, Ikoyi',
    price: 2000,
  },
  {
    id: 'axis-2',
    label: 'Axis 2: Lagos island, Victoria Island, Surulere, Mushin, Shomolu, Eti osa 1',
    price: 4000,
  },
  {
    id: 'axis-3',
    label: 'Axis 3: Agege, Ifako-ijaiye, Amuwo Odofin, Ikeja, Kosofe, Apapa, Lagos Mainland, Eti Osa 2',
    price: 8000,
  },
  {
    id: 'axis-4',
    label: 'Axis 4: Ojo, Epe, Ibeju, Ikorodu, Alimosho, Ajeromi, Eti Osa 3',
    price: 12000,
  },
];

export const NIGERIAN_STATES = [
  'Lagos', 'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];