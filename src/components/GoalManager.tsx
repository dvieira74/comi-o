// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateMotivationalAlert, type MotivationalAlertInput } from '@/ai/flows/generate-motivational-alerts';
import { Loader2, Target, Wand2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface GoalManagerProps {
  currentTotalCommission: number;
}

const SALES_REP_NAME = "Campeão(a) de Vendas"; 

export function GoalManager({ currentTotalCommission }: GoalManagerProps) {
  const [targetCommission, setTargetCommission] = useState<number | null>(null);
  const [motivationalAlert, setMotivationalAlert] = useState<string | null>(null);
  const [isGeneratingAlert, setIsGeneratingAlert] = useState(false);
  const [inputGoal, setInputGoal] = useState<string>("");

  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGoal = localStorage.getItem('commissionGoal');
      const initialGoal = savedGoal ? parseFloat(savedGoal) : null;
      setTargetCommission(initialGoal);
      setInputGoal(initialGoal?.toString() || "");
    }
  }, []);
  

  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (targetCommission !== null) {
            localStorage.setItem('commissionGoal', targetCommission.toString());
        } else {
            localStorage.removeItem('commissionGoal');
        }
    }
  }, [targetCommission]);

  const handleSetGoal = () => {
    const newGoal = parseFloat(inputGoal);
    if (!isNaN(newGoal) && newGoal > 0) {
      setTargetCommission(newGoal);
      toast({
        title: "Meta Definida!",
        description: `Sua nova meta de comissão é de ${newGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor de meta válido.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAlert = async () => {
    if (targetCommission === null || targetCommission <= 0) {
      toast({
        title: "Atenção",
        description: "Defina uma meta de comissão antes de gerar um alerta.",
        variant: "default",
      });
      return;
    }

    setIsGeneratingAlert(true);
    setMotivationalAlert(null); // Clear previous alert shown in the card
    try {
      const alertInput: MotivationalAlertInput = {
        salesRepresentativeName: SALES_REP_NAME,
        currentCommission: currentTotalCommission,
        targetCommission: targetCommission,
      };
      const result = await generateMotivationalAlert(alertInput);
      if (result.isRelevant) {
        setMotivationalAlert(result.alertMessage); // Set for card display
         toast({
          title: "Alerta Motivacional Gerado!",
          description: result.alertMessage,
          duration: 8000, 
        });
      } else {
        const neutralMessage = "Nenhum alerta específico no momento, mas continue focado no seu objetivo!";
        setMotivationalAlert(neutralMessage); // Set for card display
         toast({
          title: "Tudo Certo por Aqui!",
          description: neutralMessage,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Erro ao gerar alerta motivacional:", error);
      const errorMessage = "Erro ao buscar mensagem. Tente novamente mais tarde.";
      setMotivationalAlert(errorMessage); // Set for card display
      toast({
        title: "Erro de Geração",
        description: "Não foi possível gerar o alerta motivacional.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAlert(false);
    }
  };
  
  const progressPercentage = targetCommission && targetCommission > 0 ? Math.min((currentTotalCommission / targetCommission) * 100, 100) : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Target className="mr-2 h-6 w-6 text-primary" />
          Gerenciador de Metas
        </CardTitle>
        <CardDescription>Defina sua meta de comissão mensal e receba alertas motivacionais personalizados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="flex-grow">
            <label htmlFor="goal" className="block text-sm font-medium text-foreground mb-1">
              Meta de Comissão Mensal (R$)
            </label>
            <Input
              id="goal"
              type="number"
              placeholder="Ex: 5000"
              value={inputGoal}
              onChange={(e) => setInputGoal(e.target.value)}
              className="w-full"
            />
          </div>
          <Button onClick={handleSetGoal} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            Definir Meta
          </Button>
        </div>

        {targetCommission !== null && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Progresso Atual</span>
              <span>{currentTotalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {targetCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-accent h-3 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
                aria-valuenow={progressPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
                role="progressbar"
                aria-label={`Progresso da meta: ${progressPercentage.toFixed(0)}%`}
              ></div>
            </div>
          </div>
        )}
        
        <Button 
            onClick={handleGenerateAlert} 
            disabled={isGeneratingAlert || targetCommission === null} 
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isGeneratingAlert ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Gerar Alerta Motivacional IA
        </Button>

        {motivationalAlert && !isGeneratingAlert && (
          <Alert variant={motivationalAlert.startsWith("Erro") ? "destructive" : "default"} className="mt-4">
            <Wand2 className="h-4 w-4" />
            <AlertTitle className="font-headline">Mensagem da IA</AlertTitle>
            <AlertDescription>{motivationalAlert}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
