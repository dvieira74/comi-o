// 'use server';

/**
 * @fileOverview Generates motivational alerts for sales representatives based on their commission goals.
 *
 * - generateMotivationalAlert - A function that generates motivational alerts.
 * - MotivationalAlertInput - The input type for the generateMotivationalAlert function.
 * - MotivationalAlertOutput - The return type for the generateMotivationalAlert function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MotivationalAlertInputSchema = z.object({
  salesRepresentativeName: z.string().describe('The name of the sales representative.'),
  currentCommission: z.number().describe('The current commission earned.'),
  targetCommission: z.number().describe('The target commission for the month.'),
});
export type MotivationalAlertInput = z.infer<typeof MotivationalAlertInputSchema>;

const MotivationalAlertOutputSchema = z.object({
  alertMessage: z.string().describe('The motivational alert message.'),
  isRelevant: z.boolean().describe('Whether the alert is relevant to the sales representative.'),
});
export type MotivationalAlertOutput = z.infer<typeof MotivationalAlertOutputSchema>;

export async function generateMotivationalAlert(input: MotivationalAlertInput): Promise<MotivationalAlertOutput> {
  return generateMotivationalAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'motivationalAlertPrompt',
  input: {schema: MotivationalAlertInputSchema},
  output: {schema: MotivationalAlertOutputSchema},
  prompt: `Você é um especialista em motivação de equipes de vendas.

  Crie uma mensagem motivacional para o representante de vendas {{salesRepresentativeName}}.
  A mensagem deve ser inspiradora e focada em incentivá-lo a atingir sua meta de comissão.

  Informações do representante:
  - Nome: {{salesRepresentativeName}}
  - Comissão atual: {{currentCommission}}
  - Meta de comissão: {{targetCommission}}

  A mensagem deve ser concisa e relevante para a situação atual do representante.
  Determine se a mensagem é relevante com base na proximidade da meta de comissão.
  Se a comissão atual estiver próxima da meta, a mensagem deve ser mais urgente e encorajadora.
  Se a comissão atual estiver distante da meta, a mensagem deve ser mais motivacional e inspiradora.
  Se a comissão atual já tiver atingido a meta, a mensagem deve ser de parabéns e reconhecimento.
  Considere que a mensagem deve ser em português.
`,
});

const generateMotivationalAlertFlow = ai.defineFlow(
  {
    name: 'generateMotivationalAlertFlow',
    inputSchema: MotivationalAlertInputSchema,
    outputSchema: MotivationalAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
