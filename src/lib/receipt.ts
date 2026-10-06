import jsPDF from 'jspdf';
import type { TrackedOrder } from './store';

/* Brand palette — matches your app */
const WINE: [number, number, number] = [92, 26, 53];       // #5c1a35
const ROSE: [number, number, number] = [166, 61, 95];      // #a63d5f (button color)
const PINK: [number, number, number] = [229, 162, 181];    // #e5a2b5
const PINK_SOFT: [number, number, number] = [251, 238, 241]; // #fbeef1
const DARK: [number, number, number] = [26, 26, 26];
const MUTED: [number, number, number] = [122, 122, 122];
const BORDER: [number, number, number] = [229, 229, 229];

function priceNGN(amount: number): string {
  return `NGN ${amount.toLocaleString('en-NG')}`;
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function detectFormat(dataUrl: string): 'JPEG' | 'PNG' | 'WEBP' {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'JPEG';
}

export async function downloadOrderReceipt(order: TrackedOrder) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  /* ============================================================
     HEADER — Rose bar (matches your buttons), white text
     ============================================================ */
  doc.setFillColor(...ROSE);
  doc.rect(0, 0, pageWidth, 80, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('CIMMPLE HAIR.', margin, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(251, 238, 241);
  doc.text('Est. 2026', margin, 58);

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('RECEIPT', pageWidth - margin, 42, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(251, 238, 241);
  doc.text(
    new Date(order.created_at).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    pageWidth - margin,
    58,
    { align: 'right' }
  );

  y = 100;

  /* ============================================================
     ORDER NUMBER
     ============================================================ */
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('ORDER', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...WINE);
  doc.text(order.order_id, margin, y + 16);

  y += 40;

  /* ============================================================
     TWO-COLUMN: Delivering to | Status
     ============================================================ */
  const colWidth = (contentWidth - 20) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...ROSE);
  doc.text('DELIVERING TO', leftX, y);
  doc.text('STATUS', rightX, y);

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);

  const addressLines = [
    order.customer_name,
    order.customer_phone,
    order.address + (order.apartment ? `, ${order.apartment}` : ''),
    `${order.city}, ${order.state}`,
  ];

  const statusText =
    order.status === 'delivered'
      ? 'Delivered'
      : order.status === 'cancelled'
      ? 'Cancelled'
      : order.status === 'shipped' || order.status === 'processing'
      ? 'Processing'
      : 'Order placed';

  let leftY = y;
  addressLines.forEach((line) => {
    doc.text(line, leftX, leftY);
    leftY += 14;
  });

  let rightY = y;
  doc.text(statusText, rightX, rightY);
  rightY += 14;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`${order.payment_method} · ${order.payment_status}`, rightX, rightY);

  y = Math.max(leftY, rightY) + 16;

  /* ============================================================
     ITEMS
     ============================================================ */
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...ROSE);
  doc.text('ITEM', margin, y);
  doc.text('QTY', pageWidth - margin - 120, y, { align: 'left' });
  doc.text('PRICE', pageWidth - margin, y, { align: 'right' });

  y += 12;
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  const items = Array.isArray(order.items) ? order.items : [];
  const thumbSize = 40;

  for (const it of items) {
    const name = it?.name ?? 'Item';
    const qty = it?.qty ?? it?.quantity ?? 1;
    const price = it?.price ?? 0;
    const variant = it?.variant ?? null;
    const imageUrl = it?.image_url ?? null;

    const rowStartY = y;
    const textX = imageUrl ? margin + thumbSize + 12 : margin;
    const textWidth = contentWidth - (imageUrl ? thumbSize + 12 : 0) - 140;

    if (imageUrl) {
      const dataUrl = await loadImageAsDataUrl(imageUrl);
      if (dataUrl) {
        doc.setFillColor(...PINK_SOFT);
        doc.rect(margin, y, thumbSize, thumbSize, 'F');
        try {
          doc.addImage(dataUrl, detectFormat(dataUrl), margin, y, thumbSize, thumbSize);
        } catch {
          // silent
        }
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const nameLines = doc.splitTextToSize(name, textWidth);
    doc.text(nameLines, textX, y + 12);

    if (variant) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(variant, textX, y + 12 + nameLines.length * 12);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(String(qty), pageWidth - margin - 120, y + 12, { align: 'left' });
    doc.text(priceNGN(price * qty), pageWidth - margin, y + 12, { align: 'right' });

    const rowHeight = Math.max(
      thumbSize,
      nameLines.length * 12 + (variant ? 14 : 0)
    );

    y = rowStartY + rowHeight + 12;

    doc.setDrawColor(...BORDER);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);
  }

  y += 8;

  /* ============================================================
     TOTALS
     ============================================================ */
  const totalsX = pageWidth - margin - 180;
  const totalsWidth = 180;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('Subtotal', totalsX, y);
  doc.setTextColor(...DARK);
  doc.text(priceNGN(order.subtotal), totalsX + totalsWidth, y, { align: 'right' });
  y += 15;

  doc.setTextColor(...MUTED);
  doc.text('Shipping', totalsX, y);
  doc.setTextColor(...DARK);
  doc.text(priceNGN(order.shipping_price), totalsX + totalsWidth, y, { align: 'right' });
  y += 16;

  doc.setDrawColor(...ROSE);
  doc.setLineWidth(1);
  doc.line(totalsX, y, totalsX + totalsWidth, y);
  y += 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...ROSE);
  doc.text('TOTAL', totalsX, y);
  doc.text(priceNGN(order.total), totalsX + totalsWidth, y, { align: 'right' });

  y += 40;

  /* ============================================================
     FOOTER
     ============================================================ */
  const footerY = pageHeight - margin - 40;

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text('Thank you for shopping with Cimmple Hair.', margin, footerY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('Questions? Reach us on WhatsApp any time.', margin, footerY + 30);

  doc.setFontSize(8);
  doc.setTextColor(...ROSE);
  doc.text('CIMMPLE HAIR · EST. 2026', pageWidth / 2, footerY + 46, {
    align: 'center',
  });

  /* ============================================================
     SAVE
     ============================================================ */
  doc.save(`Cimmple-${order.order_id}.pdf`);
}