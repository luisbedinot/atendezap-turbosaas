import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, Power, QrCode } from "lucide-react";
import { brand } from "@/config/brand";
import { connectWhatsapp, checkWhatsappStatus, disconnectWhatsapp } from "@/lib/evolution.functions";

export const Route = createFileRoute("/_authenticated/conexao")({
  head: () => ({ meta: [{ title: `${brand.name} — Conexão` }] }),
  component: ConexaoPage,
});

function ConexaoPage() {
  const connect = useServerFn(connectWhatsapp);
  const check = useServerFn(checkWhatsappStatus);
  const disconnect = useServerFn(disconnectWhatsapp);

  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("disconnected");
  const [numero, setNumero] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void doCheck();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      void doCheck(true);
    }, 5000);
  }
  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }

  async function doCheck(silent = false) {
    try {
      const r = await check();
      setStatus(r.status);
      setNumero(r.numero ?? null);
      if (r.status === "connected") {
        setQr(null);
        stopPolling();
        if (!silent) toast.success("WhatsApp conectado!");
      }
    } catch (e: any) {
      if (!silent) toast.error(e?.message || "Erro ao consultar status");
    }
  }

  async function doConnect() {
    setLoading(true);
    setQr(null);
    try {
      const r = await connect();
      setQr(r.qrBase64 ?? null);
      setStatus(r.state === "open" ? "connected" : "connecting");
      if (r.state === "open") {
        toast.success("Já está conectado!");
      } else if (r.qrBase64) {
        toast.message("QR Code gerado. Escaneie no WhatsApp.");
        startPolling();
      } else {
        toast.message("Instância criada. Buscando QR…");
        startPolling();
      }
    } catch (e: any) {
      toast.error(e?.message || "Falha ao conectar");
    } finally {
      setLoading(false);
    }
  }

  async function doDisconnect() {
    setLoading(true);
    try {
      await disconnect();
      setStatus("disconnected");
      setNumero(null);
      setQr(null);
      stopPolling();
      toast.success("Desconectado");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao desconectar");
    } finally {
      setLoading(false);
    }
  }

  const statusBadge =
    status === "connected" ? (
      <Badge className="bg-primary">Conectado</Badge>
    ) : status === "connecting" ? (
      <Badge variant="secondary" className="bg-amber-500/15 text-amber-700">Conectando…</Badge>
    ) : (
      <Badge variant="outline">Desconectado</Badge>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conexão WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Conecte sua linha do WhatsApp via Evolution API (servidor que você configurou).
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="flex items-center gap-3 mt-1">
              {statusBadge}
              {numero && <span className="text-sm text-muted-foreground">· {numero}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => doCheck()} disabled={loading}>
              <RefreshCw className="size-4 mr-1.5" /> Atualizar
            </Button>
            {status === "connected" ? (
              <Button variant="destructive" size="sm" onClick={doDisconnect} disabled={loading}>
                <Power className="size-4 mr-1.5" /> Desconectar
              </Button>
            ) : (
              <Button size="sm" onClick={doConnect} disabled={loading}>
                {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <QrCode className="size-4 mr-1.5" />}
                {qr ? "Gerar novo QR" : "Conectar WhatsApp"}
              </Button>
            )}
          </div>
        </div>

        {qr ? (
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="bg-white p-4 rounded-xl border w-fit mx-auto">
              <img src={qr} alt="QR Code WhatsApp" className="size-72 object-contain" />
            </div>
            <div className="space-y-3 text-sm">
              <h3 className="font-semibold text-base">Como escanear</h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-muted-foreground">
                <li>Abra o WhatsApp no seu celular.</li>
                <li>Toque em <b>Mais opções</b> (ou <b>Configurações</b>) → <b>Aparelhos conectados</b>.</li>
                <li>Toque em <b>Conectar um aparelho</b>.</li>
                <li>Aponte o celular para esta tela e escaneie o QR Code.</li>
              </ol>
              <p className="text-xs text-muted-foreground">Estamos verificando a conexão a cada 5 segundos.</p>
            </div>
          </div>
        ) : status === "connected" ? (
          <div className="text-sm text-muted-foreground">
            Tudo certo! As mensagens recebidas serão respondidas automaticamente pelo agente IA.
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Clique em <b>Conectar WhatsApp</b> para gerar o QR Code.
          </div>
        )}
      </Card>

      <Card className="p-5 text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground mb-1">Sobre a integração</h3>
        Esta conexão usa um servidor Evolution API que você configurou (self-hosted). Você precisa ter os
        secrets <code className="px-1 rounded bg-muted">EVOLUTION_API_URL</code> e
        {" "}<code className="px-1 rounded bg-muted">EVOLUTION_API_KEY</code> definidos no Lovable Cloud.
      </Card>
    </div>
  );
}
