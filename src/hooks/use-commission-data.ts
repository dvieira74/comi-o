
"use client";

import type { SaleEntry, ProductType } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { getMonth, getYear, parseISO } from 'date-fns';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy
} from 'firebase/firestore';

const SALES_COLLECTION = 'salesDeone';

export function useCommissionData() {
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const salesCollectionRef = collection(db, SALES_COLLECTION);
    const q = query(salesCollectionRef, orderBy('date', 'desc')); 

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const salesData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          date: data.date, 
          clientName: data.clientName,
          productType: data.productType,
          saleValue: data.saleValue,
          commissionRate: data.commissionRate,
          commissionValue: data.commissionValue,
          printerModel: data.printerModel,
          servicePerformed: data.servicePerformed,
        } as SaleEntry;
      });
      setSales(salesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Falha ao carregar dados do Firestore:", error);
      setSales([]); 
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addSale = useCallback(async (newSaleData: Omit<SaleEntry, 'id'>) => {
    // commissionValue is now expected to be part of newSaleData
    const saleToFirestore = {
      ...newSaleData,
    };
    try {
      await addDoc(collection(db, SALES_COLLECTION), saleToFirestore);
    } catch (error) {
      console.error("Falha ao adicionar venda no Firestore:", error);
    }
  }, []);

  const updateSale = useCallback(async (updatedSale: SaleEntry) => {
    const saleDocRef = doc(db, SALES_COLLECTION, updatedSale.id);
    const { id, ...dataToUpdate } = updatedSale; 
    // commissionValue is now expected to be correct in updatedSale
    // No need to recalculate it here.
    try {
      await updateDoc(saleDocRef, dataToUpdate);
    } catch (error) {
      console.error("Falha ao atualizar venda no Firestore:", error);
    }
  }, []);

  const deleteSale = useCallback(async (saleId: string) => {
    const saleDocRef = doc(db, SALES_COLLECTION, saleId);
    try {
      await deleteDoc(saleDocRef);
    } catch (error) {
      console.error("Falha ao deletar venda no Firestore:", error);
    }
  }, []);

  const getSalesForMonth = useCallback((year: number, month: number): SaleEntry[] => {
    return sales.filter(sale => {
      if (!sale.date || typeof sale.date !== 'string') return false;
      try {
        const saleDate = parseISO(sale.date); 
        return getYear(saleDate) === year && getMonth(saleDate) === month;
      } catch (e) {
        console.warn(`Data inválida encontrada: ${sale.date}`, sale);
        return false;
      }
    });
  }, [sales]);

  const getSalesForPeriod = useCallback((startDate: Date, endDate: Date): SaleEntry[] => {
    return sales.filter(sale => {
      if (!sale.date || typeof sale.date !== 'string') return false;
      try {
        const saleDate = parseISO(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
      } catch (e) {
        console.warn(`Data inválida encontrada durante filtragem de período: ${sale.date}`, sale);
        return false;
      }
    });
  }, [sales]);
  
  const getYearsWithData = useCallback((): number[] => {
    const years = new Set<number>();
    sales.forEach(sale => {
      if (!sale.date || typeof sale.date !== 'string') return;
      try {
        years.add(getYear(parseISO(sale.date)));
      } catch (e) {
        console.warn(`Data inválida encontrada ao extrair anos: ${sale.date}`, sale);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [sales]);


  return {
    sales,
    isLoading,
    addSale,
    updateSale,
    deleteSale,
    getSalesForMonth,
    getSalesForPeriod,
    getYearsWithData,
  };
}

