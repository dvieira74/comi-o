
// @ts-nocheck
"use client";

import type { SaleEntry, ProductType } from '@/lib/types';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect } from 'react';

const saleFormSchema = z.object({
  date: z.date({
    required_error: "A data da venda é obrigatória.",
  }),
  clientName: z.string().min(2, {
    message: "O nome do cliente deve ter pelo menos 2 caracteres.",
  }),
  productType: z.enum(['impressora', 'toner'], {
    required_error: "O tipo de produto é obrigatório.",
  }),
  saleValue: z.coerce.number().positive({
    message: "O valor da venda deve ser positivo.",
  }),
  commissionRate: z.coerce.number().min(0).max(100, {
    message: "A taxa de comissão deve ser entre 0 e 100.",
  }),
  printerModel: z.string().optional(),
  servicePerformed: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

interface AddSaleDialogProps {
  existingSale?: SaleEntry | null;
  onSave: (data: SaleFormValues, id?: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSaleDialog({ existingSale, onSave, open, onOpenChange }: AddSaleDialogProps) {
  
  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: existingSale
      ? {
          ...existingSale,
          date: existingSale.date ? (isValid(parseISO(existingSale.date)) ? parseISO(existingSale.date) : new Date()) : new Date(),
          saleValue: existingSale.saleValue || 0,
          commissionRate: existingSale.commissionRate || 0,
          printerModel: existingSale.printerModel || "",
          servicePerformed: existingSale.servicePerformed || "",
        }
      : { // Default values for a new sale
          date: new Date(),
          clientName: "",
          productType: "impressora", // Default product type
          saleValue: 0,
          commissionRate: 5, // Default commission for "impressora"
          printerModel: "",
          servicePerformed: "",
        },
  });

  const watchedProductType = useWatch({ control: form.control, name: "productType" });

  useEffect(() => {
    if (open) { 
      if (existingSale) {
        form.reset({
          ...existingSale,
          date: existingSale.date ? (isValid(parseISO(existingSale.date)) ? parseISO(existingSale.date) : new Date()) : new Date(),
          saleValue: existingSale.saleValue || 0,
          commissionRate: existingSale.commissionRate || 0,
          printerModel: existingSale.printerModel || "",
          servicePerformed: existingSale.servicePerformed || "",
        });
      } else {
        // Resetting for a new sale - productType will be 'impressora' by default from useForm
        // and its commissionRate also set to 5.
        // If you want to force a different default productType on open, set it here too.
        const initialProductType: ProductType = "impressora";
        form.reset({
          date: new Date(),
          clientName: "",
          productType: initialProductType,
          saleValue: 0,
          commissionRate: initialProductType === 'impressora' ? 5 : 10,
          printerModel: "",
          servicePerformed: "",
        });
      }
    }
  }, [existingSale, form, open]);

  useEffect(() => {
    // Update commission rate dynamically for NEW sales if productType changes
    if (!existingSale) {
      if (watchedProductType === 'impressora') {
        form.setValue('commissionRate', 5);
      } else if (watchedProductType === 'toner') {
        form.setValue('commissionRate', 10);
      }
    }

    // Always clear printerModel and servicePerformed if productType is toner
    if (watchedProductType === 'toner') {
      form.setValue('printerModel', '');
      form.setValue('servicePerformed', '');
    }
  }, [watchedProductType, existingSale, form]);


  function onSubmit(data: SaleFormValues) {
    const dataToSave = { ...data };
    if (data.productType === 'toner') {
      delete dataToSave.printerModel;
      delete dataToSave.servicePerformed;
    }
    onSave(dataToSave, existingSale?.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { 
        // No need to form.reset() here if `open` useEffect handles it.
        // However, if you want to ensure form is always pristine on close triggered by methods other than submit/cancel button:
        if (!isOpen && !form.formState.isSubmitSuccessful) { 
            // form.reset(); // uncomment if you want aggressive reset on any close
        }
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {existingSale ? 'Editar Serviço' : 'Adicionar Novo Serviço'}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes do serviço para calcular a comissão.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Serviço</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Produto/Serviço</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="impressora">Impressora</SelectItem>
                      <SelectItem value="toner">Recarga de Toner</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedProductType === 'impressora' && (
              <>
                <FormField
                  control={form.control}
                  name="printerModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo da Impressora</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: HP LaserJet Pro M404dn" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="servicePerformed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço Feito</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ex: Troca de fusor, limpeza geral" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="saleValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Serviço (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 500,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="commissionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Comissão (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="Ex: 10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { onOpenChange(false); }}>Cancelar</Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {existingSale ? 'Salvar Alterações' : 'Adicionar Serviço'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

