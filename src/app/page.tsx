
// @ts-nocheck
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommissionTable } from '@/components/CommissionTable';
import { AddSaleDialog } from '@/components/AddSaleDialog';
import { GoalManager } from '@/components/GoalManager';
import { AppHeader } from '@/components/AppHeader';
import { MonthlyCommissionChart } from '@/components/MonthlyCommissionChart'; // Importado
import { useCommissionData } from '@/hooks/use-commission-data';
import type { SaleEntry, ProductType } from '@/lib/types';
import { exportToPDF } from '@/lib/export';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileText, CalendarDays, Filter as FilterIcon } from 'lucide-react'; 
import { format } from 'date-fns';

const meses = [
  { value: 0, label: 'Janeiro' }, { value: 1, label: 'Fevereiro' }, { value: 2, label: 'Março' },
  { value: 3, label: 'Abril' }, { value: 4, label: 'Maio' }, { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' }, { value: 7, label: 'Agosto' }, { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' }, { value: 10, label: 'Novembro' }, { value: 11, label: 'Dezembro' }
];

const productFilterOptions = [
  { value: 'all', label: 'Todos os Tipos' },
  { value: 'impressora', label: 'Impressora' },
  { value: 'toner', label: 'Recarga de Toner' },
];

export default function ComissaoPage() {
  const { sales, isLoading, addSale, updateSale, deleteSale, getSalesForMonth, getYearsWithData } = useCommissionData();
  
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [productFilter, setProductFilter] = useState<ProductType | 'all'>('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleEntry | null>(null);

  const availableYears = useMemo(() => {
    const dataYears = getYearsWithData();
    const currentSystemYear = new Date().getFullYear();
    if (!dataYears.includes(currentSystemYear)) {
      dataYears.push(currentSystemYear);
    }
    return dataYears.sort((a, b) => b - a);
  }, [getYearsWithData, sales]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(currentYear)) {
      setCurrentYear(availableYears[0]);
    } else if (availableYears.length === 0) {
        setCurrentYear(new Date().getFullYear());
    }
  }, [availableYears, currentYear]);

  const salesForCurrentPeriod = useMemo(() => {
    if (isLoading) return [];
    return getSalesForMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth, getSalesForMonth, isLoading, sales]);

  const filteredSalesForDisplay = useMemo(() => {
    if (productFilter === 'all') {
      return salesForCurrentPeriod;
    }
    return salesForCurrentPeriod.filter(sale => sale.productType === productFilter);
  }, [salesForCurrentPeriod, productFilter]);

  const totalCommissionForDisplay = useMemo(() => {
    return filteredSalesForDisplay.reduce((sum, sale) => sum + sale.commissionValue, 0);
  }, [filteredSalesForDisplay]);

  const handleSaveSale = (formData, id) => {
    const baseProperties = {
      date: format(formData.date, 'yyyy-MM-dd'),
      clientName: formData.clientName,
      productType: formData.productType,
      saleValue: parseFloat(formData.saleValue as any),
      commissionRate: parseFloat(formData.commissionRate as any),
    };

    const commissionValue = (baseProperties.saleValue * baseProperties.commissionRate) / 100;

    let payload: Partial<SaleEntry> & { // Usar Partial para os campos opcionais
      date: string;
      clientName: string;
      productType: ProductType;
      saleValue: number;
      commissionRate: number;
      commissionValue: number;
    };
    
    payload = {
      ...baseProperties,
      commissionValue,
    };

    if (formData.productType === 'impressora') {
      payload.printerModel = formData.printerModel || "";
      payload.servicePerformed = formData.servicePerformed || "";
    }
    // Não incluir printerModel e servicePerformed se for toner (já omitido por Partial e não adicionado)


    if (id) {
      updateSale({ ...payload, id } as SaleEntry);
    } else {
      addSale(payload as Omit<SaleEntry, 'id'>);
    }
    setEditingSale(null);
  };

  const handleEditSale = (sale: SaleEntry) => {
    setEditingSale(sale);
    setIsDialogOpen(true);
  };
  
  const handleDeleteSale = (saleId: string) => {
    deleteSale(saleId);
  };

  const handleOpenDialog = () => {
    setEditingSale(null);
    setIsDialogOpen(true);
  };

  const currentMonthYearLabelBase = `${meses[currentMonth].label} de ${currentYear}`;
  
  const currentDisplayLabel = useMemo(() => {
    if (productFilter === 'impressora') return `Impressoras - ${currentMonthYearLabelBase}`;
    if (productFilter === 'toner') return `Recargas de Toner - ${currentMonthYearLabelBase}`;
    return currentMonthYearLabelBase;
  }, [productFilter, currentMonthYearLabelBase]);


  const handleExportPDF = () => {
    let salesToExport = filteredSalesForDisplay;
    let exportLabel = currentDisplayLabel;
    let exportFilename = `comissoes_${meses[currentMonth].label.toLowerCase()}_${currentYear}`;

    if (productFilter === 'impressora') {
      exportFilename = `comissoes_impressoras_${meses[currentMonth].label.toLowerCase()}_${currentYear}.pdf`;
    } else if (productFilter === 'toner') {
      exportFilename = `comissoes_toner_${meses[currentMonth].label.toLowerCase()}_${currentYear}.pdf`;
    } else {
      exportFilename = `comissoes_todos_${meses[currentMonth].label.toLowerCase()}_${currentYear}.pdf`;
    }
    exportToPDF(salesToExport, exportLabel, exportFilename, productFilter);
  };


  const [clientSideLoaded, setClientSideLoaded] = useState(false);
  useEffect(() => {
    setClientSideLoaded(true);
  }, []);

  if (!clientSideLoaded || (isLoading && sales.length === 0)) {
     return (
        <div className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex justify-center items-center h-64">
                 <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <p className="text-center text-lg text-muted-foreground">Carregando dados...</p>
          </main>
        </div>
     );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <Card className="shadow-md">
          <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2 items-center w-full md:w-auto flex-wrap">
              <div className="flex gap-2 items-center">
                <CalendarDays className="h-6 w-6 text-primary flex-shrink-0" />
                <Select value={currentMonth.toString()} onValueChange={(value) => setCurrentMonth(parseInt(value))}>
                  <SelectTrigger className="w-[130px] sm:w-[150px] font-medium">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map(mes => <SelectItem key={mes.value} value={mes.value.toString()}>{mes.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(parseInt(value))}>
                  <SelectTrigger className="w-[90px] sm:w-[110px] font-medium">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableYears.length > 0 ? availableYears : [new Date().getFullYear()]).map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 items-center w-full sm:w-auto">
                <FilterIcon className="h-6 w-6 text-primary flex-shrink-0" />
                <Select value={productFilter} onValueChange={(value) => setProductFilter(value as ProductType | 'all')}>
                  <SelectTrigger className="w-full sm:w-[180px] font-medium">
                    <SelectValue placeholder="Tipo de Produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productFilterOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button onClick={handleOpenDialog} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar serviço
              </Button>
              <Button 
                variant="success" 
                onClick={handleExportPDF}
                disabled={filteredSalesForDisplay.length === 0}
                className="w-full sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" /> Exportar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <AddSaleDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          existingSale={editingSale}
          onSave={handleSaveSale}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CommissionTable
              sales={filteredSalesForDisplay}
              onEdit={handleEditSale}
              onDelete={handleDeleteSale}
              currentMonthYear={currentDisplayLabel}
            />
          </div>
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Resumo Mensal</CardTitle>
                <p className="text-sm text-muted-foreground">Comissões em {currentDisplayLabel}</p>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {totalCommissionForDisplay.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </CardContent>
            </Card>
            <GoalManager currentTotalCommission={totalCommissionForDisplay} />
            <MonthlyCommissionChart 
              sales={filteredSalesForDisplay} 
              chartPeriodLabel={currentMonthYearLabelBase} 
            />
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border mt-auto">
        Comissão Deone © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
