import { jsPDF } from "jspdf";

type InvoiceItem = {
  product_name: string;
  weight: string;
  price: number;
  quantity: number;
};

type InvoiceProfile = {
  name: string;
  email: string;
  mobile: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
};

type InvoiceOrder = {
  id: string;
  created_at: string;
  total_price: number;
  shipping: number;
  status: string;
  transaction_id: string | null;
};

const FALLBACK_FONT = "helvetica";
const UNICODE_FONT_NAME = "Gautami";
const UNICODE_FONT_FILE = "gautami.ttf";

const BRAND = {
  green: [33, 92, 63] as const,
  greenSoft: [231, 241, 235] as const,
  beige: [249, 246, 239] as const,
  border: [220, 224, 218] as const,
  text: [31, 41, 55] as const,
  muted: [107, 114, 128] as const,
};

let embeddedFontPromise: Promise<string> | null = null;

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const loadUnicodeFont = async () => {
  if (!embeddedFontPromise) {
    embeddedFontPromise = fetch("/fonts/gautami.ttf")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load Telugu PDF font");
        const buffer = await response.arrayBuffer();
        return toBase64(new Uint8Array(buffer));
      });
  }
  return embeddedFontPromise;
};

const sanitizeFallbackText = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatCurrency = (value: number) => `Rs. ${value.toFixed(2)}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const writeText = (doc: jsPDF, text: string | string[], x: number, y: number, useUnicodeFont: boolean) => {
  if (Array.isArray(text)) {
    const output = useUnicodeFont ? text : text.map(sanitizeFallbackText);
    doc.text(output, x, y);
    return;
  }
  doc.text(useUnicodeFont ? text : sanitizeFallbackText(text), x, y);
};

const setFont = (doc: jsPDF, useUnicodeFont: boolean, size: number, color: readonly number[]) => {
  doc.setFont(useUnicodeFont ? UNICODE_FONT_NAME : FALLBACK_FONT, "normal");
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
};

const drawRoundedSection = (doc: jsPDF, x: number, y: number, w: number, h: number, fill: readonly number[]) => {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.setDrawColor(BRAND.border[0], BRAND.border[1], BRAND.border[2]);
  doc.roundedRect(x, y, w, h, 4, 4, "FD");
};

const drawLabelValue = (doc: jsPDF, label: string, value: string, x: number, y: number, useUnicodeFont: boolean, offset = 34) => {
  setFont(doc, useUnicodeFont, 10, BRAND.muted);
  writeText(doc, label, x, y, useUnicodeFont);
  setFont(doc, useUnicodeFont, 10, BRAND.text);
  writeText(doc, value, x + offset, y, useUnicodeFont);
};

export const downloadInvoice = async ({
  order,
  items,
  profile,
}: {
  order: InvoiceOrder;
  items: InvoiceItem[];
  profile: InvoiceProfile | null;
}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let useUnicodeFont = false;

  try {
    const fontBase64 = await loadUnicodeFont();
    doc.addFileToVFS(UNICODE_FONT_FILE, fontBase64);
    doc.addFont(UNICODE_FONT_FILE, UNICODE_FONT_NAME, "normal");
    useUnicodeFont = true;
  } catch {
    useUnicodeFont = false;
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const subtotal = Math.max(order.total_price - order.shipping, 0);
  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const addressParts = [
    profile?.address_line1,
    profile?.address_line2,
    profile?.city,
    profile?.state,
    profile?.pincode,
  ].filter(Boolean);

  let y = 14;

  drawRoundedSection(doc, margin, y, contentWidth, 42, BRAND.beige);
  doc.setFillColor(BRAND.green[0], BRAND.green[1], BRAND.green[2]);
  doc.roundedRect(margin, y, 56, 42, 4, 4, "F");

  setFont(doc, useUnicodeFont, 22, [255, 255, 255]);
  writeText(doc, "SpiceRoot", margin + 6, y + 14, useUnicodeFont);
  setFont(doc, useUnicodeFont, 11, [255, 255, 255]);
  writeText(doc, "Invoice / Bill", margin + 6, y + 22, useUnicodeFont);
  setFont(doc, useUnicodeFont, 9, [235, 245, 239]);
  writeText(doc, "Fresh spices, herbs and pickles", margin + 6, y + 29, useUnicodeFont);

  const metaX = margin + 63;
  setFont(doc, useUnicodeFont, 11, BRAND.text);
  writeText(doc, "INVOICE DETAILS", metaX, y + 9, useUnicodeFont);
  drawLabelValue(doc, "Invoice No.", `INV-${orderNumber}`, metaX, y + 17, useUnicodeFont, 32);
  drawLabelValue(doc, "Order No.", orderNumber, metaX, y + 24, useUnicodeFont, 32);
  drawLabelValue(doc, "Order Date", formatDate(order.created_at), metaX, y + 31, useUnicodeFont, 32);
  drawLabelValue(doc, "Status", order.status.replace(/_/g, " "), metaX, y + 38, useUnicodeFont, 32);
  drawLabelValue(doc, "Txn ID", order.transaction_id || "N/A", metaX + 60, y + 38, useUnicodeFont, 18);

  y += 50;

  const leftCardX = margin;
  const rightCardX = margin + contentWidth / 2 + 4;
  const cardWidth = contentWidth / 2 - 4;
  const cardHeight = 36;

  drawRoundedSection(doc, leftCardX, y, cardWidth, cardHeight, [255, 255, 255]);
  drawRoundedSection(doc, rightCardX, y, cardWidth, cardHeight, BRAND.greenSoft);

  setFont(doc, useUnicodeFont, 11, BRAND.green);
  writeText(doc, "Bill To", leftCardX + 4, y + 8, useUnicodeFont);
  writeText(doc, "Order Summary", rightCardX + 4, y + 8, useUnicodeFont);

  const billingLines = [
    profile?.name || "Customer",
    profile?.email || "N/A",
    profile?.mobile || "N/A",
    addressParts.join(", ") || "Address not provided",
  ];

  let billingY = y + 15;
  billingLines.forEach((line, index) => {
    const lines = doc.splitTextToSize(useUnicodeFont ? line : sanitizeFallbackText(line), cardWidth - 8);
    setFont(doc, useUnicodeFont, index === 0 ? 11 : 10, BRAND.text);
    writeText(doc, lines, leftCardX + 4, billingY, useUnicodeFont);
    billingY += lines.length * 4.8;
  });

  drawLabelValue(doc, "Items", String(items.length), rightCardX + 4, y + 16, useUnicodeFont, 24);
  drawLabelValue(doc, "Shipping", order.shipping === 0 ? "Free" : formatCurrency(order.shipping), rightCardX + 4, y + 23, useUnicodeFont, 24);
  drawLabelValue(doc, "Total", formatCurrency(order.total_price), rightCardX + 4, y + 30, useUnicodeFont, 24);

  y += cardHeight + 10;

  doc.setFillColor(BRAND.greenSoft[0], BRAND.greenSoft[1], BRAND.greenSoft[2]);
  doc.setDrawColor(BRAND.border[0], BRAND.border[1], BRAND.border[2]);
  doc.roundedRect(margin, y, contentWidth, 10, 3, 3, "FD");

  const columns = [
    { header: "Product", x: margin + 4, width: 72 },
    { header: "Variant", x: margin + 80, width: 24 },
    { header: "Qty", x: margin + 109, width: 12 },
    { header: "Unit Price", x: margin + 126, width: 28 },
    { header: "Amount", x: margin + 159, width: 30 },
  ];

  setFont(doc, useUnicodeFont, 10, BRAND.green);
  columns.forEach((column) => writeText(doc, column.header, column.x, y + 6.5, useUnicodeFont));

  y += 14;

  items.forEach((item) => {
    const productLines = doc.splitTextToSize(useUnicodeFont ? item.product_name : sanitizeFallbackText(item.product_name), 68);
    const variantLines = doc.splitTextToSize(useUnicodeFont ? item.weight : sanitizeFallbackText(item.weight), 20);
    const rowHeight = Math.max(productLines.length, variantLines.length) * 5 + 5;

    if (y + rowHeight + 40 > pageHeight) {
      doc.addPage();
      y = 20;
    }

    doc.setDrawColor(238, 238, 238);
    doc.roundedRect(margin, y - 4, contentWidth, rowHeight, 2, 2, "S");

    setFont(doc, useUnicodeFont, 10, BRAND.text);
    writeText(doc, productLines, columns[0].x, y, useUnicodeFont);
    writeText(doc, variantLines, columns[1].x, y, useUnicodeFont);
    writeText(doc, String(item.quantity), columns[2].x, y, useUnicodeFont);
    writeText(doc, formatCurrency(item.price), columns[3].x, y, useUnicodeFont);
    writeText(doc, formatCurrency(item.price * item.quantity), columns[4].x, y, useUnicodeFont);

    y += rowHeight + 2;
  });

  const totalsWidth = 66;
  const totalsX = pageWidth - margin - totalsWidth;
  const totalsY = y + 6;

  drawRoundedSection(doc, totalsX, totalsY, totalsWidth, 28, BRAND.beige);
  drawLabelValue(doc, "Subtotal", formatCurrency(subtotal), totalsX + 4, totalsY + 8, useUnicodeFont, 26);
  drawLabelValue(doc, "Shipping", order.shipping === 0 ? "Free" : formatCurrency(order.shipping), totalsX + 4, totalsY + 15, useUnicodeFont, 26);
  doc.setDrawColor(BRAND.border[0], BRAND.border[1], BRAND.border[2]);
  doc.line(totalsX + 4, totalsY + 19, totalsX + totalsWidth - 4, totalsY + 19);
  setFont(doc, useUnicodeFont, 11, BRAND.green);
  writeText(doc, "Total", totalsX + 4, totalsY + 25, useUnicodeFont);
  setFont(doc, useUnicodeFont, 11, BRAND.green);
  writeText(doc, formatCurrency(order.total_price), totalsX + 36, totalsY + 25, useUnicodeFont);

  setFont(doc, useUnicodeFont, 9, BRAND.muted);
  writeText(doc, "Thank you for shopping with SpiceRoot.", margin, pageHeight - 14, useUnicodeFont);
  writeText(doc, "This invoice was generated automatically from your order page.", margin, pageHeight - 9, useUnicodeFont);

  doc.save(`invoice-${order.id.slice(0, 8).toLowerCase()}.pdf`);
};
