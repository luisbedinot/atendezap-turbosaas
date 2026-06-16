import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return (
    <div className="w-full bg-orange-100 dark:bg-orange-950/40 border-b border-orange-300 dark:border-orange-900 px-4 py-2 text-center text-xs text-orange-800 dark:text-orange-200">
      Pagamentos em <b>modo teste</b> — use cartão <code className="font-mono">4242 4242 4242 4242</code> · CVC <code className="font-mono">123</code> · validade qualquer data futura.
    </div>
  );
}
