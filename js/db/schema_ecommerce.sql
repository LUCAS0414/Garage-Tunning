--TESTE MODELO PARA TABELAS CORRIGIR QUANDO FOR FAZER O DB

SET foreign_key_checks = 0;

-- ============================================================
-- 1. PRODUTOS (estende a tabela existente com segurança)
-- ============================================================
CREATE TABLE IF NOT EXISTS produtos (
  id                  INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)      NOT NULL UNIQUE,
  nome                VARCHAR(255)     NOT NULL,
  descricao           TEXT,
  categoria           ENUM('JDM','Americanos','Italianos','Alemães','Peças') NOT NULL DEFAULT 'Peças',
  grupo_precificacao  ENUM('standard','premium','competitivo') NOT NULL DEFAULT 'standard',
  preco_custo         DECIMAL(12,2)    NOT NULL DEFAULT 0,
  preco_venda         DECIMAL(12,2)    NOT NULL DEFAULT 0,
  preco_original      DECIMAL(12,2)    NULL,           -- preço anterior para exibir riscado
  estoque_atual       INT              NOT NULL DEFAULT 0,
  estoque_minimo      INT              NOT NULL DEFAULT 0,
  peso_kg             DECIMAL(8,3)     NOT NULL DEFAULT 0.5, -- para cálculo de frete
  status              TINYINT(1)       NOT NULL DEFAULT 1,    -- 1=ativo, 0=inativo
  is_novo             TINYINT(1)       NOT NULL DEFAULT 0,
  imagem_url          VARCHAR(500)     NULL,
  criado_em           DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. CARRINHO (persistido no banco — RF0031/RF0032)
-- ============================================================
CREATE TABLE IF NOT EXISTS carrinho (
  id          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  cliente_id  INT UNSIGNED   NOT NULL,
  produto_id  INT UNSIGNED   NOT NULL,
  quantidade  INT            NOT NULL DEFAULT 1,
  adicionado_em  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carrinho_cliente_produto (cliente_id, produto_id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. RESERVAS DE ESTOQUE (bloqueio temporário — RN0044/RNF0045)
-- ============================================================
CREATE TABLE IF NOT EXISTS reservas_estoque (
  id          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  produto_id  INT UNSIGNED   NOT NULL,
  cliente_id  INT UNSIGNED   NOT NULL,
  quantidade  INT            NOT NULL DEFAULT 1,
  expira_em   DATETIME       NOT NULL,               -- calculado: NOW() + tempo_reserva_minutos
  criado_em   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_produto (produto_id),
  INDEX idx_expira  (expira_em),
  FOREIGN KEY (produto_id) REFERENCES produtos(id)   ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. PEDIDOS (RF0037 — status inicial: em-processamento)
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)    NOT NULL UNIQUE,      -- ex: GT-2026-0001
  cliente_id      INT UNSIGNED   NOT NULL,
  endereco_id     INT UNSIGNED   NOT NULL,             -- FK para enderecos_cliente.id
  status          ENUM(
                    'em-processamento',
                    'aprovada',
                    'reprovada',
                    'em-transporte',
                    'entregue',
                    'em-troca',
                    'troca-autorizada',
                    'trocado'
                  ) NOT NULL DEFAULT 'em-processamento',
  subtotal        DECIMAL(12,2)  NOT NULL DEFAULT 0,
  desconto        DECIMAL(12,2)  NOT NULL DEFAULT 0,
  frete           DECIMAL(8,2)   NOT NULL DEFAULT 0,
  total           DECIMAL(12,2)  NOT NULL DEFAULT 0,
  cupom_id        INT UNSIGNED   NULL,
  observacoes     TEXT           NULL,
  criado_em       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_cliente (cliente_id),
  INDEX idx_status  (status),
  FOREIGN KEY (cliente_id)  REFERENCES clientes(id)          ON DELETE RESTRICT,
  FOREIGN KEY (endereco_id) REFERENCES enderecos_cliente(id)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. ITENS DO PEDIDO (snapshot de preço no momento da compra)
-- ============================================================
CREATE TABLE IF NOT EXISTS itens_pedido (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  pedido_id       INT UNSIGNED   NOT NULL,
  produto_id      INT UNSIGNED   NOT NULL,
  nome_produto    VARCHAR(255)   NOT NULL,             -- snapshot
  codigo_produto  VARCHAR(30)    NOT NULL,             -- snapshot
  quantidade      INT            NOT NULL DEFAULT 1,
  preco_unitario  DECIMAL(12,2)  NOT NULL,             -- snapshot do preço na venda
  subtotal        DECIMAL(12,2)  NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_pedido (pedido_id),
  FOREIGN KEY (pedido_id)  REFERENCES pedidos(id)   ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. PAGAMENTOS DO PEDIDO (múltiplos cartões + boleto + pix)
--    RN0034, RN0035, RN0049
-- ============================================================
CREATE TABLE IF NOT EXISTS pagamentos_pedido (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  pedido_id       INT UNSIGNED   NOT NULL,
  tipo            ENUM('cartao','boleto','pix') NOT NULL,
  cartao_id       INT UNSIGNED   NULL,                -- FK opcional para cartoes_cliente
  valor           DECIMAL(12,2)  NOT NULL,
  status          ENUM('pendente','aprovado','reprovado') NOT NULL DEFAULT 'pendente',
  codigo_transacao VARCHAR(100)  NULL,                -- retorno simulado da operadora
  criado_em       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_pedido (pedido_id),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (cartao_id) REFERENCES cartoes_cliente(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. CUPONS (RF0044, RN0036, RN0037, RN0047)
-- ============================================================
CREATE TABLE IF NOT EXISTS cupons (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(30)    NOT NULL UNIQUE,
  tipo            ENUM('percentual','fixo') NOT NULL DEFAULT 'percentual',
  valor           DECIMAL(10,2)  NOT NULL,            -- % ou R$
  usos_maximos    INT            NULL,                -- NULL = ilimitado
  usos_atuais     INT            NOT NULL DEFAULT 0,
  validade        DATE           NULL,                -- NULL = sem expiração
  descricao       VARCHAR(255)   NULL,
  -- Tipo de origem do cupom
  origem          ENUM('admin','troca','abandono_carrinho') NOT NULL DEFAULT 'admin',
  -- Para cupons de troca ou pessoais: vincular ao cliente
  cliente_id      INT UNSIGNED   NULL,
  ativo           TINYINT(1)     NOT NULL DEFAULT 1,
  criado_em       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_codigo (codigo),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 8. LOG DE USO DE CUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS cupons_uso (
  id          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  cupom_id    INT UNSIGNED   NOT NULL,
  pedido_id   INT UNSIGNED   NOT NULL,
  cliente_id  INT UNSIGNED   NOT NULL,
  valor_descontado DECIMAL(12,2) NOT NULL,
  usado_em    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (cupom_id)   REFERENCES cupons(id)   ON DELETE CASCADE,
  FOREIGN KEY (pedido_id)  REFERENCES pedidos(id)  ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 9. TROCAS (RF0040 a RF0043)
-- ============================================================
CREATE TABLE IF NOT EXISTS trocas (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  pedido_id       INT UNSIGNED   NOT NULL,
  cliente_id      INT UNSIGNED   NOT NULL,
  motivo          TEXT           NOT NULL,
  status          ENUM('solicitada','autorizada','recebida','negada') NOT NULL DEFAULT 'solicitada',
  retornar_estoque TINYINT(1)   NULL,                -- admin decide ao confirmar recebimento
  cupom_gerado_id INT UNSIGNED   NULL,               -- cupom criado após troca autorizada
  admin_id        INT UNSIGNED   NULL,               -- quem autorizou
  criado_em       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_pedido (pedido_id),
  INDEX idx_status (status),
  FOREIGN KEY (pedido_id)  REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 10. ITENS DE TROCA
-- ============================================================
CREATE TABLE IF NOT EXISTS itens_troca (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  troca_id        INT UNSIGNED   NOT NULL,
  item_pedido_id  INT UNSIGNED   NOT NULL,
  quantidade      INT            NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  FOREIGN KEY (troca_id)       REFERENCES trocas(id)       ON DELETE CASCADE,
  FOREIGN KEY (item_pedido_id) REFERENCES itens_pedido(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 11. LOGS DE ESTOQUE (RF0053, RF0054)
-- ============================================================
CREATE TABLE IF NOT EXISTS logs_estoque (
  id          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  produto_id  INT UNSIGNED   NOT NULL,
  tipo        ENUM('venda','troca_entrada','ajuste_admin','reserva','liberacao') NOT NULL,
  quantidade  INT            NOT NULL,               -- positivo=entrada, negativo=saída
  estoque_antes  INT         NOT NULL,
  estoque_depois INT         NOT NULL,
  referencia_id  INT UNSIGNED NULL,                  -- pedido_id ou troca_id
  observacao  VARCHAR(255)   NULL,
  criado_em   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_produto (produto_id),
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 12. CONFIGURAÇÕES DO SISTEMA (tempo de reserva parametrizável)
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  chave   VARCHAR(60)   NOT NULL PRIMARY KEY,
  valor   VARCHAR(255)  NOT NULL,
  descricao VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Valores padrão
INSERT INTO configuracoes (chave, valor, descricao) VALUES
  ('tempo_reserva_minutos', '15',  'Tempo de bloqueio de estoque ao adicionar ao carrinho (RN0044)'),
  ('frete_gratis_acima',    '500', 'Valor mínimo em R$ para frete grátis'),
  ('frete_fixo',            '49.90','Valor do frete quando não é grátis'),
  ('min_valor_cartao',      '10',  'Valor mínimo por cartão em compra múltipla (RN0034)')
ON DUPLICATE KEY UPDATE valor = VALUES(valor);

SET foreign_key_checks = 1;

-- ============================================================
-- SEED: Inserir produtos da loja baseado nos dados do global.js
-- (Execute somente uma vez se a tabela produtos estiver vazia)
-- ============================================================
INSERT IGNORE INTO produtos (codigo, nome, categoria, grupo_precificacao, preco_custo, preco_venda, preco_original, estoque_atual, is_novo, peso_kg) VALUES
-- JDM
('JD-SK015','Nissan Skyline GT-R R34 V-Spec II','JDM','premium',660000,950000,1100000,1,0,1500),
('JD-SU016','Toyota Supra A80 Targa Top','JDM','premium',400000,580000,NULL,2,0,1400),
('JD-RX017','Mazda RX-7 FD3S Spirit R','JDM','premium',290000,420000,450000,3,0,1200),
('JD-NS018','Honda NSX-R NA2','JDM','premium',830000,1200000,NULL,1,0,1300),
('JD-EV019','Mitsubishi Lancer Evo VI Tommi Mäkinen','JDM','premium',242000,350000,380000,2,0,1400),
('JD-IM020','Subaru Impreza 22B STi','JDM','premium',615000,890000,NULL,1,0,1400),
('JD-SI021','Nissan Silvia S15 Spec-R','JDM','standard',152000,220000,245000,4,0,1250),
('JD-AE022','Toyota AE86 Trueno GT-Apex','JDM','standard',124000,180000,NULL,2,0,940),
('JD-MX023','Mazda MX-5 Miata NA Turbo','JDM','standard',65000,95000,110000,6,0,1060),
('JD-CV024','Honda Civic Type R EK9','JDM','standard',107000,155000,NULL,3,1,1150),
-- AMERICANOS
('US-MU025','Ford Mustang Shelby GT500 1967','Americanos','premium',1242000,1800000,2100000,1,0,1570),
('US-CH026','Dodge Challenger SRT Demon','Americanos','premium',587000,850000,NULL,2,1,2100),
('US-CO027','Chevrolet Corvette C8 Z06','Americanos','premium',760000,1100000,1250000,3,1,1530),
('US-VI028','Dodge Viper ACR 1-28 Edition','Americanos','premium',967000,1400000,NULL,1,0,1600),
('US-PL029','Plymouth Hemi Cuda 1971','Americanos','premium',1726000,2500000,2800000,1,0,1750),
('US-GT030','Ford GT Heritage Edition','Americanos','premium',3793000,5500000,NULL,1,1,1400),
('US-CA031','Chevrolet Camaro Yenko SC','Americanos','standard',310000,450000,490000,2,0,1600),
('US-SB032','Shelby Cobra 427 SC','Americanos','premium',2206000,3200000,NULL,1,0,1070),
('US-BU033','Buick GNX 1987','Americanos','standard',496000,720000,800000,2,0,1670),
('US-PO034','Pontiac Firebird Trans Am SD-455','Americanos','standard',262000,380000,NULL,1,0,1700),
-- ITALIANOS
('IT-FE035','Ferrari F40 Rosso Corsa','Italianos','premium',10344000,15000000,17500000,1,0,1100),
('IT-LA036','Lamborghini Aventador SVJ','Italianos','premium',4275000,6200000,NULL,2,1,1525),
('IT-PA037','Pagani Zonda Cinque','Italianos','premium',31034000,45000000,NULL,1,0,1210),
('IT-AL038','Alfa Romeo Giulia GTA','Italianos','premium',827000,1200000,1400000,3,1,1580),
('IT-LN039','Lancia Delta HF Integrale Evo II','Italianos','standard',517000,750000,NULL,2,0,1300),
('IT-MA040','Maserati MC20 Cielo','Italianos','premium',1931000,2800000,3100000,4,1,1470),
('IT-FE041','Ferrari Enzo','Italianos','premium',15172000,22000000,NULL,1,0,1365),
('IT-LA042','Lamborghini Miura P400SV','Italianos','premium',12413000,18000000,20000000,1,0,1125),
('IT-DT043','De Tomaso Pantera GTS','Italianos','standard',655000,950000,NULL,2,0,1400),
('IT-FE044','Ferrari Testarossa 512 TR','Italianos','premium',1103000,1600000,1850000,1,0,1580),
-- ALEMÃES
('AL-BM045','BMW M3 E30 Sport Evolution','Alemães','premium',586000,850000,950000,1,0,1210),
('AL-PO046','Porsche 911 GT3 RS (992)','Alemães','premium',1655000,2400000,NULL,3,1,1450),
('AL-ME047','Mercedes-Benz 190E 2.5-16 Evo II','Alemães','premium',1344000,1950000,2200000,1,0,1300),
('AL-AU048','Audi RS6 Avant Performance','Alemães','premium',793000,1150000,NULL,5,1,2080),
('AL-VW049','Volkswagen Golf R 20 Years','Alemães','standard',262000,380000,410000,8,1,1460),
('AL-BM050','BMW M5 CS','Alemães','premium',931000,1350000,NULL,2,1,1825),
('AL-PO051','Porsche 959 Komfort','Alemães','premium',8275000,12000000,14000000,1,0,1450),
('AL-AU052','Audi Quattro S1 Group B','Alemães','premium',3103000,4500000,NULL,1,0,1090),
('AL-ME053','Mercedes-AMG GT Black Series','Alemães','premium',3310000,4800000,5200000,2,1,1625),
('AL-BM054','BMW M1 Procar','Alemães','premium',2689000,3900000,NULL,1,0,1300),
-- PEÇAS
('PC-RE055','Banco Recaro Sportster CS Leather','Peças','standard',8620,12500,14000,10,1,12),
('PC-AK056','Escapamento Akrapovic Titanium RS6','Peças','premium',31034,45000,NULL,4,1,8),
('PC-RC057','Gaiola Roll Cage FIA Approved','Peças','standard',5862,8500,9800,5,1,35),
('PC-MI058','Intercooler Mishimoto Front Mount','Peças','standard',2896,4200,NULL,15,1,9),
('PC-SS059','Short Shifter Billet Motorsport','Peças','competitivo',1276,1850,2100,20,1,2),
('PC-AL060','Farois LED AlphaRex Nova-Series','Peças','standard',4413,6400,NULL,12,1,5),
('PC-SE061','Capo em Fibra de Carbono Seibon','Peças','standard',7724,11200,13500,6,1,8),
('PC-CB062','Discos de Freio Ceramica-Carbono','Peças','premium',44827,65000,NULL,2,1,18),
('PC-HA063','Painel Digital Haltech IC-7','Peças','standard',6138,8900,9600,8,1,3),
('PC-HO064','Cambio Sequencial Holinger 6-Speed','Peças','premium',100000,145000,NULL,1,1,45);
