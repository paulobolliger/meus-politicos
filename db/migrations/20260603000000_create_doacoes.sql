-- Migration para criar a tabela de doações dos gateways de pagamento.
CREATE TABLE IF NOT EXISTS public.doacoes (
  order_nsu         varchar(100) primary key,
  transaction_nsu   varchar(100) not null,
  invoice_slug      varchar(255),
  amount_centavos   integer not null,
  capture_method    varchar(50),
  receipt_url       text,
  tipo              varchar(20) not null check (tipo in ('unica', 'mensal')),
  status            varchar(20) not null default 'pendente',
  pago_em           timestamp with time zone,
  raw_payload       jsonb,
  criado_em         timestamp with time zone default now()
);

