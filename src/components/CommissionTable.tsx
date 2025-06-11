
"use client";

import type { SaleEntry } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Printer, Droplets, Edit3, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CommissionTableProps {
  sales: SaleEntry[];
  onEdit: (sale: SaleEntry) => void;
  onDelete: (saleId: string) => void;
  currentMonthYear: string;
}

export function CommissionTable({ sales, onEdit, onDelete, currentMonthYear }: CommissionTableProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return "Data inválida";
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Serviços de {currentMonthYear}</CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Nenhum serviço registrado para este período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Produto/Serviço</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Serviço Feito</TableHead>
                <TableHead className="text-right">Valor Serviço</TableHead>
                <TableHead className="text-right">Taxa Com.</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell className="font-medium">{sale.clientName}</TableCell>
                  <TableCell className="text-center">
                    {sale.productType === 'impressora' ? 
                      <Printer className="inline-block h-5 w-5 text-primary" /> : 
                      <Droplets className="inline-block h-5 w-5 text-blue-400" />}
                  </TableCell>
                  <TableCell>{sale.printerModel || '-'}</TableCell>
                  <TableCell className="text-xs max-w-xs truncate">{sale.servicePerformed || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sale.saleValue)}</TableCell>
                  <TableCell className="text-right">{sale.commissionRate}%</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(sale.commissionValue)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(sale)} aria-label="Editar">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(sale.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
