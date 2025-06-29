import { Printer } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center">
        <Printer className="h-8 w-8 mr-3" />
        <h1 className="text-2xl font-headline font-semibold">Comissão Deone</h1>
      </div>
    </header>
  );
}
