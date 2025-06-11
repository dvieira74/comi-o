
"use client";
import type { SaleEntry, ProductType } from './types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF with autoTable for TypeScript
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function exportToPDF(
  sales: SaleEntry[], 
  monthYearLabel: string, 
  filename: string = 'comissoes.pdf',
  filterType: ProductType | 'all' = 'all'
) {
  if (sales.length === 0 && filterType !== 'all') { // if filtering and no sales, it's fine. If 'all' and no sales, then alert.
     // Check if it's 'all' and still no sales.
    const allSalesForPeriod = sales; // sales is already filtered by type if not 'all'
    if (filterType === 'all' && allSalesForPeriod.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }
  } else if (sales.length === 0 && filterType === 'all') {
     alert('Não há dados para exportar.');
     return;
  }


  const doc = new jsPDF() as jsPDFWithAutoTable;
  let currentY = 15; // Start Y position for content

  const formatDateIn = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return "Data inválida";
    }
  };
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  doc.setFontSize(18);
  doc.text(`Relatório de Comissões - ${monthYearLabel}`, 14, currentY);
  currentY += 12;

  const addSection = (title: string, sectionSales: SaleEntry[], columnHeaders: string[], isPrinterSection: boolean) => {
    if (sectionSales.length === 0) {
      doc.setFontSize(10);
      doc.text(`Nenhum ${title.toLowerCase().replace('serviços de ', '')} para este período.`, 14, currentY);
      currentY += 10;
      return; 
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, currentY);
    currentY += 8;

    const tableBody = sectionSales.map(sale => {
      if (isPrinterSection) {
        return [
          formatDateIn(sale.date),
          sale.clientName,
          sale.printerModel || '-',
          sale.servicePerformed || '-',
          formatCurrency(sale.saleValue),
          `${sale.commissionRate.toFixed(1).replace('.', ',')}%`,
          formatCurrency(sale.commissionValue),
        ];
      } else {
        return [
          formatDateIn(sale.date),
          sale.clientName,
          formatCurrency(sale.saleValue),
          `${sale.commissionRate.toFixed(1).replace('.', ',')}%`,
          formatCurrency(sale.commissionValue),
        ];
      }
    });

    const totalCommissionSection = sectionSales.reduce((sum, sale) => sum + sale.commissionValue, 0);
    
    const footerRowContent: string[] = [];
    const numCols = columnHeaders.length;
    for(let i=0; i < numCols; i++) {
        if (i === numCols - 2) footerRowContent.push('Total Seção:');
        else if (i === numCols -1) footerRowContent.push(formatCurrency(totalCommissionSection));
        else footerRowContent.push('');
    }
    const footerData: string[][] = [footerRowContent];

    autoTable(doc, {
      head: [columnHeaders],
      body: tableBody,
      foot: footerData,
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [220, 220, 220], textColor: [0,0,0], fontStyle: 'bold', halign: 'right' },
      columnStyles: {
        ...(isPrinterSection ? {
            4: { halign: 'right' }, 
            5: { halign: 'right' }, 
            6: { halign: 'right' }, 
        } : {
            2: { halign: 'right' }, 
            3: { halign: 'right' }, 
            4: { halign: 'right' }, 
        })
      },
      didDrawPage: (data) => { // Not needed here as currentY is managed outside
      },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  };

  const printerColumnHeaders = ['Data', 'Cliente', 'Modelo', 'Serviço Feito', 'Valor Serviço', 'Taxa Com.', 'Comissão'];
  const tonerColumnHeaders = ['Data', 'Cliente', 'Valor Serviço', 'Taxa Com.', 'Comissão'];

  if (filterType === 'all') {
    const impressoraSalesAll = sales.filter(sale => sale.productType === 'impressora');
    const tonerSalesAll = sales.filter(sale => sale.productType === 'toner');
    if (impressoraSalesAll.length > 0 || tonerSalesAll.length > 0) { // Only draw sections if there's data
        addSection('Serviços de Impressora', impressoraSalesAll, printerColumnHeaders, true);
        addSection('Serviços de Recarga de Toner', tonerSalesAll, tonerColumnHeaders, false);
    } else { // Both are empty when filter is 'all'
        doc.setFontSize(10);
        doc.text(`Nenhum serviço registrado para este período.`, 14, currentY);
        currentY += 10;
    }
  } else if (filterType === 'impressora') {
    // 'sales' array already contains only printer sales due to page-level filtering
    addSection('Serviços de Impressora', sales, printerColumnHeaders, true);
  } else if (filterType === 'toner') {
    // 'sales' array already contains only toner sales
    addSection('Serviços de Recarga de Toner', sales, tonerColumnHeaders, false);
  }
  
  // Only show grand total if there were any sales processed based on the filter
  if (sales.length > 0) {
    const grandTotalCommission = sales.reduce((sum, sale) => sum + sale.commissionValue, 0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');

    // Ensure grand total is below any drawn tables/text
    const lastTableY = (doc as any).lastAutoTable?.finalY;
    if (lastTableY && currentY <= lastTableY) {
        currentY = lastTableY + 10;
    } else if (!lastTableY && (filterType === 'all' && sales.filter(s=>s.productType === 'impressora').length === 0 && sales.filter(s=>s.productType === 'toner').length === 0 ) ) {
        // if 'all' was selected and both were empty, currentY might be where "Nenhum serviço..." was printed
        // No need to print grand total if everything was empty
    }


    if ( (filterType === 'all' && sales.length > 0) || (filterType !== 'all') ){ // If filter is 'all', ensure sales exist. If specific filter, always show total for that.
         doc.text(`Comissão Total (${filterType === 'all' ? 'Geral' : filterType === 'impressora' ? 'Impressoras' : 'Rec. Toner'}): ${formatCurrency(grandTotalCommission)}`, 14, currentY);
    }

  }


  doc.save(filename);
}
