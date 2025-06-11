
"use client";

import type { SaleEntry, ProductType } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMemo } from 'react';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface MonthlyCommissionChartProps {
  sales: SaleEntry[];
  chartPeriodLabel: string; 
}

const chartConfig = {
  impressora: {
    label: "Impressora",
    color: "hsl(var(--chart-1))",
  },
  toner: {
    label: "Rec. Toner",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export function MonthlyCommissionChart({ sales, chartPeriodLabel }: MonthlyCommissionChartProps) {
  const chartData = useMemo(() => {
    const aggregates: Record<ProductType, number> = {
      impressora: 0,
      toner: 0,
    };

    sales.forEach(sale => {
      if (sale.productType === 'impressora') {
        aggregates.impressora += sale.commissionValue;
      } else if (sale.productType === 'toner') {
        aggregates.toner += sale.commissionValue;
      }
    });

    const result = [];
    // Adiciona ao resultado apenas se houver valor e o tipo de produto corresponder
    if (aggregates.impressora > 0) {
      result.push({ category: 'impressora' as ProductType, total: aggregates.impressora, fill: "var(--color-impressora)" });
    }
    if (aggregates.toner > 0) {
      result.push({ category: 'toner' as ProductType, total: aggregates.toner, fill: "var(--color-toner)" });
    }
    return result;
  }, [sales]);

  if (chartData.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Detalhe Comissão</CardTitle>
          <CardDescription>
            Distribuição da comissão em {chartPeriodLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            Sem dados de comissão para exibir no gráfico para o filtro atual.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Detalhe Comissão</CardTitle>
        <CardDescription>
            Distribuição da comissão em {chartPeriodLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart 
            accessibilityLayer 
            data={chartData} 
            layout="vertical" 
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              tickMargin={5}
              axisLine={false}
              tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label || value}
              width={80} 
            />
            <XAxis 
              dataKey="total"
              type="number" 
              tickLine={false}
              axisLine={false}
              tickMargin={5}
              tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`}
            />
            <ChartTooltip
              cursor={{fill: 'hsl(var(--muted))'}}
              content={<ChartTooltipContent
                  formatter={(value, name, props) => {
                    const categoryKey = props.payload.category as keyof typeof chartConfig;
                    const label = chartConfig[categoryKey]?.label || categoryKey;
                    const formattedValue = `R$${Number(value).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                    return [formattedValue, label];
                  }}
                  labelFormatter={(label, payload) => {
                     if (payload && payload.length > 0) {
                       const categoryKey = payload[0].payload.category as keyof typeof chartConfig;
                       return chartConfig[categoryKey]?.label || categoryKey;
                     }
                     return label;
                  }}
              />}
            />
            <Bar dataKey="total" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
