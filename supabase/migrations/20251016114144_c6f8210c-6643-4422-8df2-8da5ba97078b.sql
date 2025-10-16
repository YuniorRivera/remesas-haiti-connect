-- Renombrar monto_enviado_dop a principal_dop para claridad
ALTER TABLE public.remittances 
  RENAME COLUMN monto_enviado_dop TO principal_dop;

-- Renombrar monto_recibido_htg a monto_recibido_htg (mantener nombre pero agregar índice)
CREATE INDEX IF NOT EXISTS idx_remittances_principal_dop ON public.remittances(principal_dop);