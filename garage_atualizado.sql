-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 27/04/2026 às 17:14
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `garage`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `cartoes_cliente`
--

CREATE TABLE `cartoes_cliente` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `numero_cartao` varchar(20) NOT NULL,
  `nome_impresso` varchar(150) NOT NULL,
  `bandeira` varchar(50) NOT NULL,
  `cvv` varchar(4) NOT NULL,
  `is_preferencial` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `cartoes_cliente`
--

INSERT INTO `cartoes_cliente` (`id`, `cliente_id`, `numero_cartao`, `nome_impresso`, `bandeira`, `cvv`, `is_preferencial`) VALUES
(2, 3, '1234567890123456', 'Joana A Fernandes', 'MASTERCARD', '', 1),
(3, 3, '6543210987651432', 'Joana A Fernandes', 'AMEX', '', 0),
(4, 1, '1561891562998498', 'Lucas Alexandre L A', 'VISA', '', 1),
(5, 1, '5848694684418444', 'Lucas Alexandre L A', 'MASTERCARD', '', 0),
(7, 12, '5456465464646846', 'Sueli S A Martins', 'VISA', '', 0),
(8, 12, '2655561456156156', 'Gabriel A Fernandes', 'MASTERCARD', '', 0),
(9, 13, '1818916816841516', 'Neymar Cai cai Jr', 'VISA', '', 1),
(10, 11, '5827871542467197', 'MATHEUS B M OLIVEIRA', 'VISA', '', 1),
(11, 11, '7645531215498446', 'Jacinto f lopes', 'MASTERCARD', '', 0),
(12, 9, '4546548426845146', 'ABNER j MANGUES', 'VISA', '', 0),
(13, 9, '8498428949846654', 'abner j mangues', 'AMEX', '', 0);

-- --------------------------------------------------------

--
-- Estrutura para tabela `categorias`
--

CREATE TABLE `categorias` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nome` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `categorias`
--

INSERT INTO `categorias` (`id`, `nome`) VALUES
(1, 'Peças'),
(11, 'Veículos Alemães'),
(9, 'Veículos Americanos'),
(10, 'Veículos Italianos'),
(8, 'Veículos JDM');

-- --------------------------------------------------------

--
-- Estrutura para tabela `clientes`
--

CREATE TABLE `clientes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `codigo_cliente` varchar(50) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `genero` varchar(20) NOT NULL,
  `data_nascimento` date NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `telefone_tipo` varchar(20) NOT NULL,
  `telefone_ddd` varchar(3) NOT NULL,
  `telefone_numero` varchar(15) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `ranking` varchar(20) DEFAULT 'Iniciante',
  `pontos_garagem` int(11) DEFAULT 0,
  `status` tinyint(1) DEFAULT 1,
  `is_admin` tinyint(1) DEFAULT 0,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `clientes`
--

-- Colunas: id, codigo_cliente, nome, genero, data_nascimento, cpf, telefone_tipo, telefone_ddd, telefone_numero, email, senha_hash, ranking, pontos_garagem, status, is_admin, data_cadastro
INSERT INTO `clientes` (`id`, `codigo_cliente`, `nome`, `genero`, `data_nascimento`, `cpf`, `telefone_tipo`, `telefone_ddd`, `telefone_numero`, `email`, `senha_hash`, `ranking`, `pontos_garagem`, `status`, `is_admin`, `data_cadastro`) VALUES
-- Admin: admin@garage.com / admin123
(14, 'CLI-ADMIN001', 'Administrador', 'Nao Informado', '1990-01-01', '000.000.000-00', 'Celular', '11', '999999999', 'admin@garage.com', '$2b$10$LzGvwVwB1COZ.LRbboBLq.DRORdTPVCumD28txfqhWuFacd7J9.5e', 'Iniciante', 0, 1, 1, '2026-01-01 00:00:00'),
(1, 'CLI-MN3SC9F3', 'Lucas Alexandre de Lima Alves', 'Masculino', '2005-12-04', '123.456.789-09', '', '11', '999999999', 'exemplo@gmail.com', '$2b$10$w1ZlknfMPWziCbfZ4xQELeo78.5Z1AlEFyZJ8RJ3aN0f2io1UcK16', 'Iniciante', 0, 1, 0, '2026-03-23 22:56:43'),
(3, 'CLI-MN4PX60O', 'Joana', 'Feminino', '2008-03-24', '145.029.280-11', 'Celular', '11', '999999999', 'joana@gmail.com', '$2b$10$N9MTa06mWHaA6EdDwwBSNOtqCj8S8ry1SFOSil1V5EwcbFiD0maDu', 'Iniciante', 0, 1, 0, '2026-03-24 14:36:46'),
(9, 'CLI-MN4YTIEA', 'Banas Armety', 'Nao Informado', '2005-05-04', '724.481.190-07', 'Celular', '11', '756756745', 'abner@gmail.com', '$2b$10$6u21MGGVRcOFDSEs1E0d9uF/O2fM2igkeBfJPl../.g4oLMd7db5W', 'Iniciante', 0, 1, 0, '2026-03-24 18:45:52'),
(11, 'CLI-MN52YPIX', 'Matheus Bryan', 'Masculino', '2003-02-04', '589.884.630-13', 'Celular', '11', '555546456', 'matheus@gmail.com', '$2b$10$JXUr9.3uIWQKWpoY/QdwJeLAOmxhZ.ykbKMxohtYdvySrJOPrjrgm', 'Iniciante', 0, 1, 0, '2026-03-24 20:41:53'),
(12, 'CLI-MN56RBBF', 'Sueli', 'Feminino', '1995-08-01', '210.319.770-40', 'Celular', '11', '646486786', 'sueli@gmail.com', '$2b$10$fuKKvdB1bCtfd46cpYBlwuMJAiKvmeCDxBhSFBaNz/0NMUj6JNq/K', 'Iniciante', 0, 1, 0, '2026-03-24 22:28:06'),
(13, 'CLI-MN58I9GQ', 'Cai cai', 'Masculino', '2003-12-04', '084.646.600-73', 'Celular', '11', '468484998', 'neymar@gmail.com', '$2b$10$tkXbmaFK3h0Kqqw04xsKK.jpoXqBlXOSvx4njAYMkOXbWoA2md/Ei', 'Iniciante', 0, 0, 0, '2026-03-24 23:17:03');

-- --------------------------------------------------------

--
-- Estrutura para tabela `cupons`
--

CREATE TABLE `cupons` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `tipo_cupom` varchar(20) DEFAULT NULL,
  `data_validade` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` tinyint(1) DEFAULT 1,
  `usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `cupons`
--

INSERT INTO `cupons` (`id`, `codigo`, `valor`, `tipo_cupom`, `data_validade`, `status`, `usuario_id`) VALUES
(1, 'BOAS-VINDAS', 10.00, 'PERCENTUAL', '2026-04-14 23:24:47', 0, NULL),
(2, 'GARAGEM15', 15.00, 'PERCENTUAL', '2026-10-01 02:59:59', 1, NULL),
(3, 'TROCA50', 50.00, 'PERCENTUAL', '2026-04-14 22:54:08', 0, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `enderecos_cliente`
--

CREATE TABLE `enderecos_cliente` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `identificacao` varchar(50) NOT NULL,
  `tipo_endereco` varchar(20) NOT NULL,
  `tipo_residencia` varchar(50) NOT NULL,
  `tipo_logradouro` varchar(50) NOT NULL,
  `logradouro` varchar(150) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `bairro` varchar(100) NOT NULL,
  `cep` varchar(10) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `estado` varchar(2) NOT NULL,
  `pais` varchar(50) DEFAULT 'Brasil',
  `observacoes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `enderecos_cliente`
--

INSERT INTO `enderecos_cliente` (`id`, `cliente_id`, `identificacao`, `tipo_endereco`, `tipo_residencia`, `tipo_logradouro`, `logradouro`, `numero`, `bairro`, `cep`, `cidade`, `estado`, `pais`, `observacoes`) VALUES
(1, 1, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO', 'Rua Vinte e Cinco', '450', 'Residencial Paradise I', '08766-450', 'Mogi das Cruzes', 'SP', 'Brasil', ''),
(2, 2, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO', 'Rua Vinte e Cinco', '25', 'Residencial Paradise I', '08766-450', 'Mogi das Cruzes', 'SP', 'Brasil', ''),
(3, 1, 'Casa da Prima', 'ENTREGA', 'Casa', 'Rua', 'Rua talba', '3445', 'Lair', '08760440', 'Mogi', 'SP', 'Brasil', ''),
(4, 3, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO', 'Rua Padre Orfeu Miatto', '408', 'Vila Sagrado Coração de Maria', '08742-120', 'Mogi das Cruzes', 'SP', 'Brasil', ''),
(5, 6, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO', 'Rua Vinte e Cinco', '408', 'Residencial Paradise I', '08766-450', 'Mogi das Cruzes', 'SP', 'Brasil', ''),
(6, 9, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO', 'Rua Padre Orfeu Miatto', '234', 'Vila Sagrado Coração de Maria', '08742-120', 'Mogi das Cruzes', 'SP', 'Brasil', ''),
(7, 10, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO', 'Rua Vinte e Cinco', '450', 'Residencial Paradise I', '08766-450', 'Mogi das Cruzes', 'SP', 'Brasil', ''),
(8, 11, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO', 'Rua Vinte e Cinco', '25', 'Residencial Paradise I', '08766-450', 'Mogi das Cruzes', 'SP', 'Brasil', ''),
(9, 12, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO', 'Rua Vinte e Cinco', '405', 'Residencial Paradise I', '08766-450', 'Mogi das Cruzes', 'SP', 'Brasil', ''),
(10, 12, 'Casa da praia', 'ENTREGA', 'Casa', 'Rua', 'Rua Jamal', '3445', 'Vila Amorim', '08760440', 'Mogi das Cruzes', 'SP', 'Brasil', ''),
(11, 13, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO', 'Rua Vinte e Cinco', '126', 'Residencial Paradise I', '08766-450', 'Mogi das Cruzes', 'SP', 'Brasil', '');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedidos`
--

CREATE TABLE `pedidos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `codigo_pedido` varchar(20) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `endereco_entrega_id` int(11) DEFAULT NULL,
  `cupom_id` int(11) DEFAULT NULL,
  `data_pedido` timestamp NOT NULL DEFAULT current_timestamp(),
  `valor_frete` decimal(10,2) DEFAULT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `status` varchar(30) DEFAULT 'EM PROCESSAMENTO',
  `metodo_pagamento` varchar(30) DEFAULT 'CARTAO_CREDITO',
  `pagamento_dados` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`pagamento_dados`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `pedidos`
--

INSERT INTO `pedidos` (`id`, `codigo_pedido`, `usuario_id`, `endereco_entrega_id`, `cupom_id`, `data_pedido`, `valor_frete`, `valor_total`, `status`, `metodo_pagamento`, `pagamento_dados`) VALUES
(1, 'GT-2026-0001', 1, 1, NULL, '2026-04-14 16:14:51', 0.00, 8579.00, 'APROVADO', 'CARTAO_CREDITO', NULL),
(2, 'GT-2026-0002', 11, 8, NULL, '2026-04-14 16:18:14', 0.00, 389000.00, 'EM TRANSPORTE', 'CARTAO_CREDITO', NULL),
(3, 'GT-2026-0003', 11, 8, NULL, '2026-04-14 18:00:40', 0.00, 169000.00, 'REPROVADO', 'CARTAO_CREDITO', NULL),
(4, 'GT-2026-0004', 9, 6, NULL, '2026-04-14 22:28:23', 0.00, 1490.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', NULL),
(5, 'GT-2026-0005', 9, 6, 1, '2026-04-14 22:40:10', 0.00, 166500.00, 'EM TROCA', 'CARTAO_CREDITO', NULL),
(6, 'GT-2026-0006', 1, 1, 3, '2026-04-14 22:54:08', 0.00, 2995.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', NULL),
(7, 'GT-2026-0007', 1, 1, 1, '2026-04-14 23:24:47', 0.00, 8532.00, 'ENTREGUE', 'CARTAO_CREDITO', NULL),
(8, 'GT-2026-0008', 1, 1, 2, '2026-04-27 14:22:32', 0.00, 1343.00, 'EM PROCESSAMENTO', 'DOIS_CARTOES', '{\"metodo\":\"DOIS_CARTOES\",\"cartao1Id\":4,\"valor1\":342.99,\"cartao2Id\":5,\"valor2\":1000.01}');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedido_itens`
--

CREATE TABLE `pedido_itens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pedido_id` int(11) DEFAULT NULL,
  `produto_id` int(11) DEFAULT NULL,
  `quantidade` int(11) NOT NULL,
  `preco_unitario` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `pedido_itens`
--

INSERT INTO `pedido_itens` (`id`, `pedido_id`, `produto_id`, `quantidade`, `preco_unitario`) VALUES
(1, 1, 13, 1, 7990.00),
(2, 1, 4, 1, 589.00),
(3, 2, 14, 1, 389000.00),
(4, 3, 17, 1, 169000.00),
(5, 4, 9, 1, 1490.00),
(6, 5, 16, 1, 185000.00),
(7, 6, 7, 1, 5990.00),
(8, 7, 13, 1, 7990.00),
(9, 7, 9, 1, 1490.00),
(10, 8, 6, 2, 790.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos`
--

CREATE TABLE `produtos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  `categoria_id` int(11) DEFAULT NULL,
  `preco_custo` decimal(10,2) NOT NULL,
  `preco_venda` decimal(10,2) NOT NULL,
  `estoque_atual` int(11) DEFAULT 0,
  `status` tinyint(1) DEFAULT 1,
  `grupo_precificacao` varchar(30) DEFAULT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `produtos`
--

INSERT INTO `produtos` (`id`, `codigo`, `nome`, `descricao`, `categoria_id`, `preco_custo`, `preco_venda`, `estoque_atual`, `status`, `grupo_precificacao`, `data_cadastro`) VALUES
(1, 'EST-001', 'Kit Aerofólio Traseiro Universal — Fibra de Vidro', 'Aerofólio dianteiro em fibra de vidro com acabamento liso para pintura. Compatível com hatchbacks de médio porte.', 1, 280.00, 489.90, 15, 1, 'B', '2026-01-10 03:00:00'),
(2, 'EST-002', 'Para-choque Dianteiro Esportivo VW Polo 2018–2024 Estilo GTI', 'Para-choque em ABS de alta resistência estilo GTI com entradas de ar funcionais.', 1, 620.00, 1090.00, 8, 1, 'B', '2026-01-10 03:00:00'),
(3, 'EST-003', 'Envelopamento Vinil Preto Fosco 3M 1080-M12 — Rolo 1,52m x 5m', 'Vinil adesivo premium 3M série 1080 preto fosco. Alta resistência a UV e calor.', 1, 390.00, 699.00, 22, 1, 'A', '2026-01-12 03:00:00'),
(4, 'PER-001', 'Filtro de Ar Esportivo K&N 33-2954 — VW/Audi 1.4 TSI / 1.8 TSI', 'Filtro de ar K&N em algodão. Aumento de fluxo de ar de até 15%. Lavável e reutilizável.', 1, 320.00, 589.00, 19, 1, 'A', '2026-01-10 03:00:00'),
(5, 'PER-002', 'Filtro de Ar Cônico K&N RC-2960 Ø 76mm — Universal', 'Filtro cônico K&N em algodão para intakes abertos. Rosca de entrada 76 mm.', 1, 210.00, 389.00, 25, 1, 'A', '2026-01-10 03:00:00'),
(6, 'PER-004', 'Downpipe 3\" Inox Sem Catalisador — VW 1.0/1.4 TSI EA211', 'Downpipe em aço inox 304. Remove restrição do catalisador original.', 1, 420.00, 790.00, 8, 1, 'B', '2026-01-18 03:00:00'),
(7, 'SUS-001', 'Kit Coilover Regulável BC Racing BR-Series — Honda Civic 2012–2016', 'Kit coilover completo BC Racing com regulagem de altura e 30 cliques de dureza.', 1, 3200.00, 5990.00, 3, 1, 'A', '2026-01-10 03:00:00'),
(8, 'SUS-002', 'Mola Esportiva Eibach Pro-Kit — VW Gol G5/G6', 'Jogo com 4 molas Eibach Pro-Kit. Rebaixamento de 30mm dianteiro e 35mm traseiro.', 1, 490.00, 890.00, 12, 1, 'A', '2026-01-15 03:00:00'),
(9, 'ESC-001', 'Cat-Back Inox — Chevrolet Onix 1.0 Turbo Ponteira 3,5\"', 'Sistema cat-back completo em inox 304. Som encorpado sem drone em cruzeiro.', 1, 790.00, 1490.00, 5, 1, 'B', '2026-01-10 03:00:00'),
(10, 'ESC-005', 'Válvula Cutout Ø 76mm Eletrônica — Controle por App', 'Válvula cutout de 3\" em alumínio com atuador elétrico 12V. Controle via Bluetooth.', 1, 380.00, 729.00, 6, 1, 'B', '2026-02-01 03:00:00'),
(11, 'FRE-001', 'Kit Freio Esportivo Brembo Sport — Par Dianteiro Honda Civic', 'Par de discos Brembo Sport perfurados e ranhurados + pastilhas HP2000.', 1, 980.00, 1890.00, 5, 1, 'A', '2026-01-10 03:00:00'),
(12, 'ROD-001', 'Roda Aro 18\" OZ Racing Ultraleggera HLT (Unidade)', 'Roda OZ Racing em liga de alumínio forjada. Peso ultra reduzido: 6,9 kg.', 1, 1800.00, 3490.00, 8, 1, 'A', '2026-01-10 03:00:00'),
(13, 'ELE-001', 'ECU Haltech Elite 1000 — Gerenciamento Universal', 'Central Haltech Elite 1000 para injeção direta e indireta. Mapas 3D.', 1, 4200.00, 7990.00, 1, 1, 'A', '2026-01-10 03:00:00'),
(14, 'JDM-001', 'Honda Civic Type R FK8 2018', 'Motor K20C1 2.0 VTEC Turbo 320 cv. Câmbio manual 6v.', 8, 280000.00, 389000.00, 0, 1, 'A', '2026-02-25 03:00:00'),
(15, 'USA-001', 'Chevrolet Camaro SS 6.2 V8 2018', 'Motor LT1 6.2 V8 453 cv. Câmbio automático 8 marchas.', 9, 310000.00, 419000.00, 1, 1, 'A', '2026-03-05 03:00:00'),
(16, 'ITA-001', 'Fiat 500 Abarth 595 Competizione 2019', 'Motor 1.4 T-Jet 180 cv. Suspensão Koni FSD e freios Brembo.', 10, 130000.00, 185000.00, 0, 1, 'A', '2026-02-10 03:00:00'),
(17, 'ALE-001', 'VW Golf GTI Mk7 2015', 'Motor EA888 2.0 TSI 220 cv. Câmbio manual 6v. Diferencial XDS+.', 11, 120000.00, 169000.00, 1, 1, 'competitivo', '2026-02-10 03:00:00');

-- --------------------------------------------------------

--
-- Estrutura para tabela `solicitacoes_troca`
--

CREATE TABLE `solicitacoes_troca` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pedido_id` int(11) DEFAULT NULL,
  `produto_id` int(11) DEFAULT NULL,
  `quantidade` int(11) NOT NULL,
  `motivo` text DEFAULT NULL,
  `status` varchar(30) DEFAULT 'PENDENTE',
  `data_solicitacao` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `data_nascimento` date DEFAULT NULL,
  `genero` varchar(20) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `tipo_usuario` varchar(20) DEFAULT 'CLIENTE',
  `status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `cartoes_cliente`
--
ALTER TABLE `cartoes_cliente`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);

--
-- Índices de tabela `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo_cliente` (`codigo_cliente`),
  ADD UNIQUE KEY `cpf` (`cpf`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices de tabela `cupons`
--
ALTER TABLE `cupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Índices de tabela `enderecos_cliente`
--
ALTER TABLE `enderecos_cliente`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo_pedido` (`codigo_pedido`);

--
-- Índices de tabela `pedido_itens`
--
ALTER TABLE `pedido_itens`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `produtos`
--
ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Índices de tabela `solicitacoes_troca`
--
ALTER TABLE `solicitacoes_troca`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `cpf` (`cpf`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `cartoes_cliente`
--
ALTER TABLE `cartoes_cliente`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de tabela `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de tabela `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de tabela `cupons`
--
ALTER TABLE `cupons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `enderecos_cliente`
--
ALTER TABLE `enderecos_cliente`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de tabela `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `pedido_itens`
--
ALTER TABLE `pedido_itens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de tabela `solicitacoes_troca`
--
ALTER TABLE `solicitacoes_troca`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
-- Admin padrão: admin@garage.com / admin123
INSERT INTO `usuarios` (`nome`, `email`, `senha_hash`, `cpf`, `data_nascimento`, `genero`, `telefone`, `tipo_usuario`, `status`) VALUES
('Administrador', 'admin@garage.com', '$2b$10$LzGvwVwB1COZ.LRbboBLq.DRORdTPVCumD28txfqhWuFacd7J9.5e', '000.000.000-00', '1990-01-01', 'Nao Informado', '11999999999', 'ADMIN', 1);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
