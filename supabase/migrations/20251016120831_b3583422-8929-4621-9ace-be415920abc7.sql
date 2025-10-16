-- Poblar fees_matrix con tarifas iniciales realistas
-- Fuente: Tarifas típicas de remesas RD → Haití

-- Canal MonCash (wallet)
INSERT INTO public.fees_matrix (
  channel,
  corridor,
  fx_dop_htg_mid,
  spread_bps,
  fx_usd_dop,
  percent_fee_client,
  fixed_fee_dop,
  acquiring_dop,
  gov_fee_usd,
  partner_fee_flat_htg,
  partner_fee_percent,
  min_partner_fee_htg,
  store_commission_pct,
  platform_commission_pct,
  is_active,
  notes
) VALUES (
  'MONCASH',
  'RD->HT',
  7.8500,  -- 1 DOP ≈ 7.85 HTG mid rate
  150,      -- 1.5% spread (150 basis points)
  59.50,    -- 1 USD ≈ 59.50 DOP
  2.50,     -- 2.5% fee al cliente
  50.00,    -- RD$50 fee fijo
  15.00,    -- RD$15 costo acquiring
  1.50,     -- USD$1.50 fee gubernamental BRH
  25.00,    -- HTG 25 fee plano partner
  0.80,     -- 0.8% fee partner
  50.00,    -- HTG 50 fee mínimo partner
  1.20,     -- 1.2% comisión tienda
  0.80,     -- 0.8% margen plataforma
  true,
  'Tarifa para transferencias vía MonCash. Spread competitivo.'
) ON CONFLICT DO NOTHING;

-- Canal SPIH (banco)
INSERT INTO public.fees_matrix (
  channel,
  corridor,
  fx_dop_htg_mid,
  spread_bps,
  fx_usd_dop,
  percent_fee_client,
  fixed_fee_dop,
  acquiring_dop,
  gov_fee_usd,
  partner_fee_flat_htg,
  partner_fee_percent,
  min_partner_fee_htg,
  store_commission_pct,
  platform_commission_pct,
  is_active,
  notes
) VALUES (
  'SPIH',
  'RD->HT',
  7.8500,  -- mismo mid rate
  200,      -- 2.0% spread (mayor por banco)
  59.50,
  3.00,     -- 3% fee al cliente (mayor por banco)
  75.00,    -- RD$75 fee fijo (mayor)
  20.00,    -- RD$20 costo acquiring
  1.50,     -- USD$1.50 fee BRH
  40.00,    -- HTG 40 fee plano partner
  1.00,     -- 1% fee partner
  75.00,    -- HTG 75 fee mínimo partner
  1.50,     -- 1.5% comisión tienda (mayor)
  0.70,     -- 0.7% margen plataforma
  true,
  'Tarifa para transferencias bancarias SPIH. Procesamiento 24-48h.'
) ON CONFLICT DO NOTHING;