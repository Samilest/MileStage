import jsPDF from 'jspdf';
import { formatCurrency, type CurrencyCode } from './currency';

interface Stage {
  stage_number: number;
  name: string;
  amount: number;
  payment_status?: string;
  approved_at?: string | null;
  payment_received_at?: string | null;
}

interface PDFData {
  // Freelancer info
  freelancerName: string;
  freelancerEmail: string;
  
  // Client info
  clientName: string;
  clientEmail: string;
  
  // Project info
  projectName: string;
  projectCreatedAt: string;
  currency: CurrencyCode;
  
  // Stages
  stages: Stage[];
  totalAmount: number;
}

/**
 * Generate a Quote/Proposal PDF (before project starts)
 * Shows all stages with amounts - formal proposal for client approval
 */
export function generateQuotePDF(data: PDFData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = 20;
  
  // === HEADER ===
  doc.setFontSize(24);
  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT QUOTE', 20, y);
  
  y += 15;
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor('#6B7280');
  doc.setFont('helvetica', 'normal');
  const createdDate = new Date(data.projectCreatedAt).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  doc.text(`Date: ${createdDate}`, 20, y);
  
  y += 20;
  
  // === FROM / TO SECTION ===
  const colLeft = 20;
  const colRight = pageWidth / 2 + 10;
  
  doc.setFontSize(10);
  doc.setTextColor('#6B7280');
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', colLeft, y);
  doc.text('TO', colRight, y);
  
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#000000');
  doc.setFontSize(11);
  doc.text(data.freelancerName, colLeft, y);
  doc.text(data.clientName, colRight, y);
  
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor('#6B7280');
  doc.text(data.freelancerEmail, colLeft, y);
  doc.text(data.clientEmail, colRight, y);
  
  y += 20;
  
  // === PROJECT NAME ===
  doc.setFontSize(10);
  doc.setTextColor('#6B7280');
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT', colLeft, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#000000');
  doc.setFontSize(14);
  doc.text(data.projectName, colLeft, y);
  
  y += 20;
  
  // === STAGES TABLE ===
  // Header
  doc.setFillColor(249, 250, 251);
  doc.rect(20, y - 5, pageWidth - 40, 12, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor('#6B7280');
  doc.setFont('helvetica', 'bold');
  doc.text('STAGE', 25, y + 2);
  doc.text('DESCRIPTION', 50, y + 2);
  doc.text('AMOUNT', pageWidth - 25, y + 2, { align: 'right' });
  
  y += 15;
  
  // Stage rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#000000');
  doc.setFontSize(10);
  
  data.stages.forEach((stage) => {
    const stageLabel = stage.stage_number === 0 ? 'Deposit' : `Stage ${stage.stage_number}`;
    doc.text(stageLabel, 25, y);
    doc.text(stage.name, 50, y);
    doc.text(formatCurrency(stage.amount, data.currency), pageWidth - 25, y, { align: 'right' });
    y += 10;
  });
  
  y += 5;
  
  // Divider
  doc.setDrawColor('#E5E7EB');
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  
  y += 15;
  
  // === TOTAL ===
  doc.setFontSize(10);
  doc.setTextColor('#6B7280');
  doc.text('Total Project Value:', pageWidth - 80, y);
  
  doc.setFontSize(16);
  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.totalAmount, data.currency), pageWidth - 25, y, { align: 'right' });
  
  y += 30;
  
  // === TERMS ===
  doc.setFontSize(9);
  doc.setTextColor('#6B7280');
  doc.setFont('helvetica', 'normal');
  doc.text('TERMS', 20, y);
  y += 8;
  doc.setFontSize(9);
  doc.text('• Payment is due upon completion and approval of each stage', 20, y);
  y += 6;
  doc.text('• Next stage begins after previous stage payment is received', 20, y);
  y += 6;
  doc.text('• Revisions included as specified per stage', 20, y);
  
  y += 20;
  
  // === FOOTER ===
  doc.setFontSize(8);
  doc.setTextColor('#9CA3AF');
  doc.text('Generated via MileStage.com', pageWidth / 2, y, { align: 'center' });
  
  // === SAVE ===
  const fileName = `Quote-${data.projectName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  doc.save(fileName);
}

/**
 * Generate an Invoice PDF (after project completes)
 * Shows all stages with payment dates - receipt for client records
 */
export function generateInvoicePDF(data: PDFData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = 20;
  
  // === HEADER ===
  doc.setFontSize(24);
  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, y);
  
  // Paid badge - properly centered
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(pageWidth - 55, y - 10, 35, 14, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setTextColor('#FFFFFF');
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', pageWidth - 37.5, y - 1, { align: 'center' });
  
  y += 15;
  
  // Invoice number and date
  doc.setFontSize(10);
  doc.setTextColor('#6B7280');
  doc.setFont('helvetica', 'normal');
  
  const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  doc.text(`Invoice #: ${invoiceNumber}`, 20, y);
  y += 6;
  doc.text(`Date: ${today}`, 20, y);
  
  y += 20;
  
  // === FROM / TO SECTION ===
  const colLeft = 20;
  const colRight = pageWidth / 2 + 10;
  
  doc.setFontSize(10);
  doc.setTextColor('#6B7280');
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', colLeft, y);
  doc.text('BILL TO', colRight, y);
  
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#000000');
  doc.setFontSize(11);
  doc.text(data.freelancerName, colLeft, y);
  doc.text(data.clientName, colRight, y);
  
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor('#6B7280');
  doc.text(data.freelancerEmail, colLeft, y);
  doc.text(data.clientEmail, colRight, y);
  
  y += 20;
  
  // === PROJECT NAME ===
  doc.setFontSize(10);
  doc.setTextColor('#6B7280');
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT', colLeft, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#000000');
  doc.setFontSize(14);
  doc.text(data.projectName, colLeft, y);
  
  y += 20;
  
  // === STAGES TABLE ===
  // Header
  doc.setFillColor(249, 250, 251);
  doc.rect(20, y - 5, pageWidth - 40, 12, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor('#6B7280');
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', 25, y + 2);
  doc.text('PAID ON', 120, y + 2);
  doc.text('AMOUNT', pageWidth - 25, y + 2, { align: 'right' });
  
  y += 15;
  
  // Stage rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#000000');
  doc.setFontSize(10);
  
  data.stages.forEach((stage) => {
    const stageLabel = stage.stage_number === 0 
      ? 'Down Payment' 
      : `Stage ${stage.stage_number}: ${stage.name}`;
    
    // Use payment_received_at first, fallback to approved_at
    const paidDate = stage.payment_received_at 
      ? new Date(stage.payment_received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : stage.approved_at
        ? new Date(stage.approved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';
    
    doc.text(stageLabel, 25, y);
    doc.setTextColor('#6B7280');
    doc.text(paidDate, 120, y);
    doc.setTextColor('#000000');
    doc.text(formatCurrency(stage.amount, data.currency), pageWidth - 25, y, { align: 'right' });
    y += 10;
  });
  
  y += 5;
  
  // Divider
  doc.setDrawColor('#E5E7EB');
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  
  y += 15;
  
  // === TOTAL ===
  doc.setFontSize(10);
  doc.setTextColor('#6B7280');
  doc.text('Total Paid:', pageWidth - 70, y);
  
  doc.setFontSize(16);
  doc.setTextColor('#10B981');
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.totalAmount, data.currency), pageWidth - 25, y, { align: 'right' });
  
  y += 30;
  
  // === FOOTER ===
  doc.setFontSize(10);
  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', pageWidth / 2, y, { align: 'center' });
  
  y += 15;
  doc.setFontSize(8);
  doc.setTextColor('#9CA3AF');
  doc.text('Generated via MileStage.com', pageWidth / 2, y, { align: 'center' });
  
  // === SAVE ===
  const fileName = `Invoice-${data.projectName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  doc.save(fileName);
}
