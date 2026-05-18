-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 15/05/2026 às 18:49
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

DROP TABLE IF EXISTS `cartoes_cliente`;
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
(13, 9, '8498428949846654', 'abner j mangues', 'AMEX', '', 0),
(14, 14, '4111111111111111', 'USUARIO TESTE CYPRESS', 'VISA', '', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `categorias`
--

DROP TABLE IF EXISTS `categorias`;
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

DROP TABLE IF EXISTS `clientes`;
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
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_admin` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `clientes`
--

INSERT INTO `clientes` (`id`, `codigo_cliente`, `nome`, `genero`, `data_nascimento`, `cpf`, `telefone_tipo`, `telefone_ddd`, `telefone_numero`, `email`, `senha_hash`, `ranking`, `pontos_garagem`, `status`, `data_cadastro`, `is_admin`) VALUES
(1, 'CLI-MN3SC9F3', 'Lucas Alexandre de Lima Alves', 'Masculino', '2005-12-04', '123.456.789-09', '', '11', '999999999', 'exemplo@gmail.com', '$2b$10$w1ZlknfMPWziCbfZ4xQELeo78.5Z1AlEFyZJ8RJ3aN0f2io1UcK16', 'Iniciante', 0, 1, '2026-03-23 22:56:43', 0),
(3, 'CLI-MN4PX60O', 'Joana', 'Feminino', '2008-03-24', '145.029.280-11', 'Celular', '11', '999999999', 'joana@gmail.com', '$2b$10$N9MTa06mWHaA6EdDwwBSNOtqCj8S8ry1SFOSil1V5EwcbFiD0maDu', 'Iniciante', 0, 1, '2026-03-24 14:36:46', 0),
(9, 'CLI-MN4YTIEA', 'Banas Armety', 'Nao Informado', '2005-05-04', '724.481.190-07', 'Celular', '11', '756756745', 'abner@gmail.com', '$2b$10$6u21MGGVRcOFDSEs1E0d9uF/O2fM2igkeBfJPl../.g4oLMd7db5W', 'Iniciante', 0, 1, '2026-03-24 18:45:52', 0),
(11, 'CLI-MN52YPIX', 'Matheus Bryan', 'Masculino', '2003-02-04', '589.884.630-13', 'Celular', '11', '555546456', 'matheus@gmail.com', '$2b$10$JXUr9.3uIWQKWpoY/QdwJeLAOmxhZ.ykbKMxohtYdvySrJOPrjrgm', 'Iniciante', 0, 1, '2026-03-24 20:41:53', 0),
(12, 'CLI-MN56RBBF', 'Sueli', 'Feminino', '1995-08-01', '210.319.770-40', 'Celular', '11', '646486786', 'sueli@gmail.com', '$2b$10$fuKKvdB1bCtfd46cpYBlwuMJAiKvmeCDxBhSFBaNz/0NMUj6JNq/K', 'Iniciante', 0, 1, '2026-03-24 22:28:06', 0),
(13, 'CLI-MN58I9GQ', 'Cai cai', 'Masculino', '2003-12-04', '084.646.600-73', 'Celular', '11', '468484998', 'neymar@gmail.com', '$2b$10$tkXbmaFK3h0Kqqw04xsKK.jpoXqBlXOSvx4njAYMkOXbWoA2md/Ei', 'Iniciante', 0, 0, '2026-03-24 23:17:03', 0),
(14, 'CLI-TESTE001', 'Usuário Teste Cypress', 'Masculino', '2000-01-01', '000.000.000-00', 'Celular', '11', '999999999', 'teste@garage.com', '$2b$10$UnTu3KEg9DvF2X60y7jX8.1bZRrzYnlq/BwNOCAUYci.OBvHA0i4i', 'Iniciante', 0, 1, '2026-05-04 22:24:02', 0),
(16, 'CLI-ADMIN001', 'Administrador', 'Nao Informado', '1990-01-01', '111.111.111-11', 'Celular', '11', '999999999', 'admin@garage.com', '$2b$10$LzGvwVwB1COZ.LRbboBLq.DRORdTPVCumD28txfqhWuFacd7J9.5e', 'Iniciante', 0, 1, '2026-05-15 16:00:34', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `cupons`
--

DROP TABLE IF EXISTS `cupons`;
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

DROP TABLE IF EXISTS `enderecos_cliente`;
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
(11, 13, 'Endereço Principal', 'AMBOS', 'NAO_INFORMADO', 'NAO_INFORMADO', 'Rua Vinte e Cinco', '126', 'Residencial Paradise I', '08766-450', 'Mogi das Cruzes', 'SP', 'Brasil', ''),
(12, 14, 'Endereço Principal', 'AMBOS', 'Casa', 'Rua', 'Rua Vinte e Cinco', '450', 'Residencial Paradise I', '08766-450', 'Mogi das Cruzes', 'SP', 'Brasil', '');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
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
(2, 'GT-2026-0002', 11, 8, NULL, '2026-04-14 16:18:14', 0.00, 389000.00, 'TROCA AUTORIZADA', 'CARTAO_CREDITO', NULL),
(3, 'GT-2026-0003', 11, 8, NULL, '2026-04-14 18:00:40', 0.00, 169000.00, 'REPROVADO', 'CARTAO_CREDITO', NULL),
(4, 'GT-2026-0004', 9, 6, NULL, '2026-04-14 22:28:23', 0.00, 1490.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', NULL),
(5, 'GT-2026-0005', 9, 6, 1, '2026-04-14 22:40:10', 0.00, 166500.00, 'EM TROCA', 'CARTAO_CREDITO', NULL),
(6, 'GT-2026-0006', 1, 1, 3, '2026-04-14 22:54:08', 0.00, 2995.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', NULL),
(7, 'GT-2026-0007', 1, 1, 1, '2026-04-14 23:24:47', 0.00, 8532.00, 'TROCA AUTORIZADA', 'CARTAO_CREDITO', NULL),
(8, 'GT-2026-0008', 1, 1, 2, '2026-04-27 14:22:32', 0.00, 1343.00, 'TROCA AUTORIZADA', 'DOIS_CARTOES', '{\"metodo\":\"DOIS_CARTOES\",\"cartao1Id\":4,\"valor1\":342.99,\"cartao2Id\":5,\"valor2\":1000.01}'),
(21, 'GT-2026-0014', 9, 6, 2, '2026-05-05 15:54:09', 0.00, 104550.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(22, 'GT-2026-0015', 9, 6, NULL, '2026-05-05 15:56:07', 0.00, 123000.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(23, 'GT-2026-0016', 9, 6, NULL, '2026-05-05 15:56:08', 0.00, 123000.00, 'EM PROCESSAMENTO', 'PIX', '{\"metodo\":\"PIX\"}'),
(24, 'GT-2026-0017', 9, 6, 2, '2026-05-05 15:56:09', 0.00, 104550.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(25, 'GT-2026-0018', 9, 6, NULL, '2026-05-05 15:57:21', 0.00, 123000.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(26, 'GT-2026-0019', 9, 6, NULL, '2026-05-05 15:57:21', 0.00, 123000.00, 'EM PROCESSAMENTO', 'PIX', '{\"metodo\":\"PIX\"}'),
(27, 'GT-2026-0020', 9, 6, 2, '2026-05-05 15:57:22', 0.00, 104550.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(31, 'GT-2026-0021', 9, 6, NULL, '2026-05-05 18:03:09', 0.00, 467000.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(32, 'GT-2026-0022', 9, 6, NULL, '2026-05-05 18:03:12', 0.00, 467000.00, 'EM PROCESSAMENTO', 'PIX', '{\"metodo\":\"PIX\"}'),
(33, 'GT-2026-0023', 9, 6, 2, '2026-05-05 18:03:15', 0.00, 396950.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(34, 'GT-2026-0024', 9, 6, NULL, '2026-05-05 18:10:33', 0.00, 467000.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(35, 'GT-2026-0025', 9, 6, NULL, '2026-05-05 18:10:40', 0.00, 467000.00, 'EM PROCESSAMENTO', 'PIX', '{\"metodo\":\"PIX\"}'),
(36, 'GT-2026-0026', 9, 6, 2, '2026-05-05 18:10:49', 0.00, 396950.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(37, 'GT-2026-0027', 9, 6, NULL, '2026-05-05 18:11:17', 0.00, 467000.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(38, 'GT-2026-0028', 9, 6, NULL, '2026-05-05 18:11:31', 0.00, 467000.00, 'EM PROCESSAMENTO', 'PIX', '{\"metodo\":\"PIX\"}'),
(39, 'GT-2026-0029', 9, 6, 2, '2026-05-05 18:11:48', 0.00, 396950.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(40, 'GT-2026-0030', 9, 6, NULL, '2026-05-05 18:14:39', 0.00, 467000.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(41, 'GT-2026-0031', 9, 6, NULL, '2026-05-05 18:14:53', 0.00, 467000.00, 'EM PROCESSAMENTO', 'PIX', '{\"metodo\":\"PIX\"}'),
(42, 'GT-2026-0032', 9, 6, 2, '2026-05-05 18:15:10', 0.00, 396950.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(43, 'GT-2026-0033', 9, 6, NULL, '2026-05-05 18:16:45', 0.00, 467000.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(44, 'GT-2026-0034', 9, 6, NULL, '2026-05-05 18:17:00', 0.00, 467000.00, 'EM PROCESSAMENTO', 'PIX', '{\"metodo\":\"PIX\"}'),
(45, 'GT-2026-0035', 9, 6, 2, '2026-05-05 18:17:16', 0.00, 396950.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(46, 'GT-2026-0036', 9, 6, NULL, '2026-05-05 22:36:18', 0.00, 467000.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(47, 'GT-2026-0037', 9, 6, NULL, '2026-05-05 22:36:32', 0.00, 467000.00, 'EM PROCESSAMENTO', 'PIX', '{\"metodo\":\"PIX\"}'),
(48, 'GT-2026-0038', 9, 6, 2, '2026-05-05 22:36:48', 0.00, 396950.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(49, 'GT-2026-0039', 9, 6, NULL, '2026-05-05 22:40:55', 0.00, 467000.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(50, 'GT-2026-0040', 9, 6, NULL, '2026-05-05 22:41:09', 0.00, 467000.00, 'EM PROCESSAMENTO', 'PIX', '{\"metodo\":\"PIX\"}'),
(51, 'GT-2026-0041', 9, 6, 2, '2026-05-05 22:41:26', 0.00, 396950.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(52, 'GT-2026-0042', 9, 6, NULL, '2026-05-05 22:46:18', 0.00, 467000.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(53, 'GT-2026-0043', 9, 6, NULL, '2026-05-05 22:46:32', 0.00, 467000.00, 'EM PROCESSAMENTO', 'PIX', '{\"metodo\":\"PIX\"}'),
(54, 'GT-2026-0044', 9, 6, 2, '2026-05-05 22:46:49', 0.00, 396950.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(55, 'GT-2026-0045', 9, 6, NULL, '2026-05-05 23:03:57', 0.00, 467000.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}'),
(56, 'GT-2026-0046', 9, 6, NULL, '2026-05-05 23:04:11', 0.00, 467000.00, 'EM PROCESSAMENTO', 'PIX', '{\"metodo\":\"PIX\"}'),
(57, 'GT-2026-0047', 9, 6, 2, '2026-05-05 23:04:27', 0.00, 396950.00, 'EM PROCESSAMENTO', 'CARTAO_CREDITO', '{\"metodo\":\"CARTAO_CREDITO\",\"cartaoId\":12}');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedido_itens`
--

DROP TABLE IF EXISTS `pedido_itens`;
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
(10, 8, 6, 2, 790.00),
(11, 9, 55, 1, 48000.00),
(12, 9, 51, 1, 75000.00),
(13, 10, 55, 1, 48000.00),
(14, 10, 51, 1, 75000.00),
(15, 11, 55, 1, 48000.00),
(16, 11, 51, 1, 75000.00),
(17, 12, 55, 1, 48000.00),
(18, 12, 51, 1, 75000.00),
(19, 13, 55, 1, 48000.00),
(20, 13, 51, 1, 75000.00),
(21, 14, 55, 1, 48000.00),
(22, 14, 51, 1, 75000.00),
(23, 15, 55, 1, 48000.00),
(24, 15, 51, 1, 75000.00),
(25, 16, 55, 1, 48000.00),
(26, 16, 51, 1, 75000.00),
(27, 17, 55, 1, 48000.00),
(28, 17, 51, 1, 75000.00),
(29, 18, 55, 1, 48000.00),
(30, 18, 51, 1, 75000.00),
(31, 19, 55, 1, 48000.00),
(32, 19, 51, 1, 75000.00),
(33, 20, 55, 1, 48000.00),
(34, 20, 51, 1, 75000.00),
(35, 21, 55, 1, 48000.00),
(36, 21, 51, 1, 75000.00),
(37, 22, 55, 1, 48000.00),
(38, 22, 51, 1, 75000.00),
(39, 23, 55, 1, 48000.00),
(40, 23, 51, 1, 75000.00),
(41, 24, 55, 1, 48000.00),
(42, 24, 51, 1, 75000.00),
(43, 25, 55, 1, 48000.00),
(44, 25, 51, 1, 75000.00),
(45, 26, 55, 1, 48000.00),
(46, 26, 51, 1, 75000.00),
(47, 27, 55, 1, 48000.00),
(48, 27, 51, 1, 75000.00),
(49, 31, 18, 1, 78000.00),
(50, 31, 14, 1, 389000.00),
(51, 32, 18, 1, 78000.00),
(52, 32, 14, 1, 389000.00),
(53, 33, 18, 1, 78000.00),
(54, 33, 14, 1, 389000.00),
(55, 34, 18, 1, 78000.00),
(56, 34, 14, 1, 389000.00),
(57, 35, 18, 1, 78000.00),
(58, 35, 14, 1, 389000.00),
(59, 36, 18, 1, 78000.00),
(60, 36, 14, 1, 389000.00),
(61, 37, 18, 1, 78000.00),
(62, 37, 14, 1, 389000.00),
(63, 38, 18, 1, 78000.00),
(64, 38, 14, 1, 389000.00),
(65, 39, 18, 1, 78000.00),
(66, 39, 14, 1, 389000.00),
(67, 40, 18, 1, 78000.00),
(68, 40, 14, 1, 389000.00),
(69, 41, 18, 1, 78000.00),
(70, 41, 14, 1, 389000.00),
(71, 42, 18, 1, 78000.00),
(72, 42, 14, 1, 389000.00),
(73, 43, 18, 1, 78000.00),
(74, 43, 14, 1, 389000.00),
(75, 44, 18, 1, 78000.00),
(76, 44, 14, 1, 389000.00),
(77, 45, 18, 1, 78000.00),
(78, 45, 14, 1, 389000.00),
(79, 46, 18, 1, 78000.00),
(80, 46, 14, 1, 389000.00),
(81, 47, 18, 1, 78000.00),
(82, 47, 14, 1, 389000.00),
(83, 48, 18, 1, 78000.00),
(84, 48, 14, 1, 389000.00),
(85, 49, 18, 1, 78000.00),
(86, 49, 14, 1, 389000.00),
(87, 50, 18, 1, 78000.00),
(88, 50, 14, 1, 389000.00),
(89, 51, 18, 1, 78000.00),
(90, 51, 14, 1, 389000.00),
(91, 52, 18, 1, 78000.00),
(92, 52, 14, 1, 389000.00),
(93, 53, 18, 1, 78000.00),
(94, 53, 14, 1, 389000.00),
(95, 54, 18, 1, 78000.00),
(96, 54, 14, 1, 389000.00),
(97, 55, 18, 1, 78000.00),
(98, 55, 14, 1, 389000.00),
(99, 56, 18, 1, 78000.00),
(100, 56, 14, 1, 389000.00),
(101, 57, 18, 1, 78000.00),
(102, 57, 14, 1, 389000.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos`
--

DROP TABLE IF EXISTS `produtos`;
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
(14, 'JDM-001', 'Honda Civic Type R FK8 2018', 'Motor K20C1 2.0 VTEC Turbo 320 cv. Câmbio manual 6v.', 8, 280000.00, 389000.00, 23, 1, '', '2026-02-25 03:00:00'),
(15, 'USA-001', 'Chevrolet Camaro SS 6.2 V8 2018', 'Motor LT1 6.2 V8 453 cv. Câmbio automático 8 marchas.', 9, 310000.00, 419000.00, 1, 1, 'A', '2026-03-05 03:00:00'),
(16, 'ITA-001', 'Fiat 500 Abarth 595 Competizione 2019', 'Motor 1.4 T-Jet 180 cv. Suspensão Koni FSD e freios Brembo.', 10, 130000.00, 185000.00, 0, 1, 'A', '2026-02-10 03:00:00'),
(17, 'ALE-001', 'VW Golf GTI Mk7 2015', 'Motor EA888 2.0 TSI 220 cv. Câmbio manual 6v. Diferencial XDS+.', 11, 120000.00, 169000.00, 1, 1, 'competitivo', '2026-02-10 03:00:00'),
(18, 'JDM-R01', 'Honda Civic Si (FA5) 2008', 'O rei do K20 aspirado. Manual de 6 marchas, 192cv e corta giro em 8k RPM.', 8, 55000.00, 78000.00, 23, 1, '', '2026-05-04 18:54:31'),
(19, 'JDM-R02', 'Mitsubishi Lancer HL 2015', 'Base perfeita para réplica de Evo. Motor 2.0 robusto e visual agressivo.', 8, 48000.00, 65000.00, 3, 1, 'B', '2026-05-04 18:54:31'),
(20, 'JDM-R03', 'Subaru Impreza WRX (Bugeye) 2002', 'Tração integral e o som inconfundível do motor Boxer turbo.', 8, 60000.00, 85000.00, 1, 1, 'B', '2026-05-04 18:54:31'),
(21, 'JDM-R04', 'Mazda MX-5 Miata (NA) 1993', 'Leve, tração traseira e faróis escamoteáveis. O queridinho das pistas de Autocross.', 8, 70000.00, 110000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(22, 'JDM-R05', 'Toyota Corolla \"Brad\" (XEi) 2005', 'A base preferida para turbinar no estilo sleeper. Mecânica à prova de balas.', 8, 25000.00, 38000.00, 4, 1, 'B', '2026-05-04 18:54:31'),
(23, 'JDM-R06', 'Suzuki Swift Sport 1.6 2015', 'Um pocket rocket. Leveza extrema e dirigibilidade de kart.', 8, 45000.00, 62000.00, 2, 1, 'B', '2026-05-04 18:54:31'),
(24, 'JDM-R07', 'Honda Fit (GP5) 2016', 'O \"Mugen Style\". Muito usado em Track Days pela sua agilidade e baixo custo.', 8, 42000.00, 58000.00, 3, 1, 'B', '2026-05-04 18:54:31'),
(25, 'JDM-R08', 'Nissan Tiida Hatch (Manual) 2012', 'Motor MR18DE que aceita muito bem upgrades de performance.', 8, 22000.00, 32000.00, 2, 1, 'B', '2026-05-04 18:54:31'),
(26, 'JDM-R09', 'Nissan 350Z (Z33) 2005', 'O carro de entrada para o mundo do Drift sério. Motor V6 VQ35.', 8, 85000.00, 135000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(27, 'JDM-A01', 'Nissan Skyline GT-R R34 V-Spec II', 'Godzilla. O sonho absoluto de qualquer entusiasta JDM.', 8, 600000.00, 950000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(28, 'JDM-A02', 'Toyota Supra MK4 (2JZ-GTE)', 'O motor que aguenta 1000cv com miolo original. Lenda das arrancadas.', 8, 500000.00, 800000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(29, 'JDM-A03', 'Mazda RX-7 (FD3S)', 'O mestre do motor rotativo. Design que ainda parece do futuro.', 8, 350000.00, 550000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(30, 'JDM-A04', 'Honda NSX (NA1) 1991', 'A Ferrari japonesa. Ajustada por Senna, motor VTEC central.', 8, 700000.00, 1200000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(31, 'JDM-A05', 'Mitsubishi Lancer Evolution IX', 'O ápice da linhagem 4G63. O terror dos ralis.', 8, 250000.00, 380000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(32, 'JDM-A06', 'Nissan Silvia S15 Spec-R', 'O chassi mais equilibrado para drift já fabricado.', 8, 180000.00, 290000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(33, 'USA-R01', 'Ford Fusion Titanium (AWD) 2015', 'O sleeper executivo. Motor 2.0 EcoBoost que vira um monstro com remapeamento.', 9, 65000.00, 89000.00, 3, 1, 'B', '2026-05-04 18:54:31'),
(34, 'USA-R02', 'Chevrolet Cruze Sport6 (Turbo) 2018', 'Ótima plataforma para Stage 2. Torque cedo e visual moderno.', 9, 70000.00, 92000.00, 4, 1, 'B', '2026-05-04 18:54:31'),
(35, 'USA-R03', 'Ford Focus Hatch (Duratec) 2012', 'Chassi excelente. Muito usado para swaps e preparação aspirada forte.', 9, 32000.00, 45000.00, 2, 1, 'B', '2026-05-04 18:54:31'),
(36, 'USA-R04', 'Chrysler 300C V8 Hemi 2008', 'Músculos americanos em terno de luxo. Base para projetos VIP Style.', 9, 75000.00, 115000.00, 1, 1, 'B', '2026-05-04 18:54:31'),
(37, 'USA-R05', 'Chevrolet Astra GSI 2.0 16V', 'Clássico nacional/americano. Motor robusto para preparação turbo.', 9, 28000.00, 42000.00, 2, 1, 'B', '2026-05-04 18:54:31'),
(38, 'USA-R06', 'Dodge Dakota R/T V8 2000', 'A única picape média V8 manual no Brasil. Um ícone das arrancadas.', 9, 50000.00, 85000.00, 1, 1, 'B', '2026-05-04 18:54:31'),
(39, 'USA-R07', 'Ford Maverick Lariat EcoBoost 2023', 'A nova queridinha. Picape com performance de hot-hatch.', 9, 160000.00, 210000.00, 2, 1, 'A', '2026-05-04 18:54:31'),
(40, 'USA-R08', 'Chevrolet Omega (Fittipaldi) 2011', 'Motor V6 de 292cv. Tração traseira e refinamento australiano/americano.', 9, 60000.00, 88000.00, 1, 1, 'B', '2026-05-04 18:54:31'),
(41, 'USA-R09', 'Ford Mustang V6 (Geração 5) 2012', 'Porta de entrada para os Mustangs. Muito potencial de customização estética.', 9, 120000.00, 175000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(42, 'USA-A01', 'Shelby Mustang GT500 2022', 'O Cobra definitivo. Motor Supercharged de 760cv.', 9, 600000.00, 980000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(43, 'USA-A02', 'Dodge Challenger Hellcat Redeye', 'Puro suco de Muscle Car. Fumaça de pneu e barulho de compressor.', 9, 550000.00, 890000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(44, 'USA-A03', 'Chevrolet Corvette C8 Z06', 'Superesportivo de motor central que desafia os italianos.', 9, 900000.00, 1500000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(45, 'USA-A04', 'Ford GT (Geração 2)', 'Um carro de Le Mans com placas de rua. Raridade extrema.', 9, 3000000.00, 5500000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(46, 'USA-A05', 'Dodge Viper ACR 2017', 'V10, manual e sem ajudas eletrônicas. Só para pilotos de verdade.', 9, 800000.00, 1300000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(47, 'USA-A06', 'Plymouth Hemi Cuda 1970', 'A lenda da era de ouro dos Muscle Cars.', 9, 1200000.00, 2500000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(48, 'ITA-R01', 'Fiat Marea Turbo 2000', 'A lenda. 5 cilindros, som de mini-V10 e potencial infinito de turbo.', 10, 30000.00, 55000.00, 2, 1, 'B', '2026-05-04 18:54:31'),
(49, 'ITA-R02', 'Fiat Punto T-Jet 2014', 'O melhor custo-benefício para quem quer um projeto turbo moderno.', 10, 42000.00, 62000.00, 3, 1, 'B', '2026-05-04 18:54:31'),
(50, 'ITA-R03', 'Fiat Uno Turbo i.e. 1994', 'O primeiro turbo de fábrica do Brasil. Peso pena e muita diversão.', 10, 35000.00, 60000.00, 1, 1, 'B', '2026-05-04 18:54:31'),
(51, 'ITA-R04', 'Alfa Romeo 156 V6 2003', 'O motor Busso é uma obra de arte visual e sonora. Para gearheads raiz.', 10, 45000.00, 75000.00, 25, 1, '', '2026-05-04 18:54:31'),
(52, 'ITA-R05', 'Fiat Bravo T-Jet 2016', 'Visual italiano elegante com o motor 1.4 Turbo pronto para o Stage 3.', 10, 48000.00, 68000.00, 2, 1, 'B', '2026-05-04 18:54:31'),
(53, 'ITA-R06', 'Fiat 500 Abarth 2015', 'Um escorpião raivoso. Suspensão firme e ronco que intimida gente grande.', 10, 75000.00, 115000.00, 2, 1, 'A', '2026-05-04 18:54:31'),
(54, 'ITA-R07', 'Fiat Tempra Turbo Stile 1996', 'Luxo e performance dos anos 90. Tração dianteira que \"queima tudo\".', 10, 25000.00, 45000.00, 1, 1, 'B', '2026-05-04 18:54:31'),
(55, 'ITA-R08', 'Alfa Romeo 147 2.0 TS', 'Design premiado e um dos melhores chassis de tração dianteira.', 10, 30000.00, 48000.00, 25, 1, '', '2026-05-04 18:54:31'),
(56, 'ITA-R09', 'Fiat Pulse Abarth 2024', 'O primeiro SUV preparado pela Abarth no Brasil. Muita tecnologia.', 10, 125000.00, 155000.00, 3, 1, 'A', '2026-05-04 18:54:31'),
(57, 'ITA-A01', 'Ferrari F40', 'A definição de carro analógico. Fibra de carbono e dois turbos.', 10, 10000000.00, 20000000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(58, 'ITA-A02', 'Lamborghini Aventador SVJ', 'O último grande V12 aspirado da marca. Aerodinâmica ativa.', 10, 4000000.00, 7500000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(59, 'ITA-A03', 'Lancia Delta HF Integrale', 'O rei dos ralis italianos. Tração 4x4 e visual quadrado icônico.', 10, 400000.00, 750000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(60, 'ITA-A04', 'Alfa Romeo Giulia Quadrifoglio', 'O sedã que bateu recordes em Nürburgring. Motor V6 de origem Ferrari.', 10, 350000.00, 580000.00, 43, 1, '', '2026-05-04 18:54:31'),
(61, 'ITA-A05', 'Pagani Zonda Cinque', 'Perfeição em forma de fibra de carbono e motor V12 AMG.', 10, 15000000.00, 30000000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(62, 'ITA-A06', 'Ferrari 458 Speciale', 'O último V8 aspirado. Considerada a melhor Ferrari moderna.', 10, 2000000.00, 3800000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(63, 'ALE-R01', 'VW Golf GTI (Mk7) 2015', 'A base perfeita. Stage 2 aqui é obrigação. Motor EA888 e câmbio DSG.', 11, 95000.00, 145000.00, 4, 1, 'A', '2026-05-04 18:54:31'),
(64, 'ALE-R02', 'VW Jetta GLI 2020', 'O sedã que entrega performance de esportivo com espaço de sobra.', 11, 140000.00, 185000.00, 3, 1, 'A', '2026-05-04 18:54:31'),
(65, 'ALE-R03', 'BMW 328i (E36) 1996', 'O clássico para drift ou track day. Tração traseira e motor 6 em linha.', 11, 45000.00, 85000.00, 2, 1, 'B', '2026-05-04 18:54:31'),
(66, 'ALE-R04', 'Audi A3 Sedan 1.8 TFSI 2016', 'Uma base premium para quem quer muito torque com pouco investimento.', 11, 75000.00, 105000.00, 3, 1, 'B', '2026-05-04 18:54:31'),
(67, 'ALE-R05', 'VW Fusca TSI 2014', 'Um Golf GTI disfarçado de clássico. Extremamente rápido no Stage 3.', 11, 85000.00, 125000.00, 2, 1, 'B', '2026-05-04 18:54:31'),
(68, 'ALE-R06', 'BMW 320i (F30) 2014', 'O carro mais comum nos encontros gearhead. Potencial de remape enorme.', 11, 80000.00, 115000.00, 4, 1, 'B', '2026-05-04 18:54:31'),
(69, 'ALE-R07', 'VW Polo GTS 2021', 'Hatch compacto apimentado. Ágil e pronto para upgrades de suspensão.', 11, 90000.00, 120000.00, 3, 1, 'B', '2026-05-04 18:54:31'),
(70, 'ALE-R08', 'Audi S3 (8L) 2002', 'Tração Quattro e motor 1.8T de 225cv. Um ícone da preparação antiga.', 11, 55000.00, 95000.00, 1, 1, 'B', '2026-05-04 18:54:31'),
(71, 'ALE-R09', 'Mercedes-Benz C63 AMG (W204) 2012', 'O último V8 6.2 aspirado. Uma máquina de queimar pneus.', 11, 180000.00, 280000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(72, 'ALE-A01', 'Porsche 911 GT3 RS (992)', 'O ápice da engenharia alemã para as pistas.', 11, 1500000.00, 2800000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(73, 'ALE-A02', 'BMW M3 (E30)', 'Onde tudo começou. O M3 mais puro e desejado.', 11, 400000.00, 850000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(74, 'ALE-A03', 'Audi RS6 Avant Performance', 'A perua mais rápida do mundo. V8 biturbo e muito espaço.', 11, 700000.00, 1150000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(75, 'ALE-A04', 'Mercedes-AMG GT Black Series', 'Performance de carro de corrida com a estrela no capô.', 11, 2500000.00, 4800000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(76, 'ALE-A05', 'Porsche Carrera GT', 'V10 manual com som de Fórmula 1. Uma lenda analógica.', 11, 4000000.00, 9000000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(77, 'ALE-A06', 'BMW M5 (E60) V10', 'Um sedã executivo com motor V10 inspirado na F1.', 11, 200000.00, 350000.00, 1, 1, 'A', '2026-05-04 18:54:31'),
(78, 'PEC-001', 'Kit Coilover BC Racing', 'Suspensão regulável de alta performance para pista e rua.', 1, 3500.00, 5800.00, 5, 1, 'A', '2026-05-04 18:54:31'),
(79, 'PEC-002', 'Filtro K&N Intake System', 'Aumento de fluxo de ar e ronco de admissão esportivo.', 1, 800.00, 1600.00, 15, 1, 'B', '2026-05-04 18:54:31'),
(80, 'PEC-003', 'Turbina Garrett G-Series G25', 'O estado da arte em turbocompressores para alta potência.', 1, 6000.00, 9500.00, 3, 1, 'A', '2026-05-04 18:54:31'),
(81, 'PEC-004', 'Injeção Programável FuelTech FT550', 'Gerenciamento total do motor com dashboard integrado.', 1, 4200.00, 6800.00, 8, 1, 'A', '2026-05-04 18:54:31'),
(82, 'PEC-005', 'Rodas Enkei RPF1 Aro 18', 'A roda mais leve e resistente para quem busca performance.', 1, 5000.00, 8500.00, 4, 1, 'A', '2026-05-04 18:54:31'),
(83, 'PEC-006', 'Pastilhas de Freio EBC Yellowstuff', 'Alto poder de frenagem para Track Days.', 1, 450.00, 950.00, 20, 1, 'B', '2026-05-04 18:54:31'),
(84, 'PEC-007', 'Volante Sparco L777', 'Volante em couro/alcântara para maior pegada e estilo racing.', 1, 600.00, 1200.00, 10, 1, 'B', '2026-05-04 18:54:31'),
(85, 'PEC-008', 'Banco Concha Recaro Pole Position', 'Segurança e apoio lateral extremo em curvas de alta.', 1, 3500.00, 6500.00, 2, 1, 'A', '2026-05-04 18:54:31'),
(86, 'PEC-009', 'Escape Inox Akrapovic', 'O melhor som e alívio de peso para o sistema de exaustão.', 1, 8000.00, 15000.00, 2, 1, 'A', '2026-05-04 18:54:31'),
(87, 'PEC-010', 'Intercooler Mishimoto Performance', 'Redução drástica na temperatura do ar de admissão.', 1, 1500.00, 2800.00, 6, 1, 'B', '2026-05-04 18:54:31'),
(88, 'PEC-011', 'Manômetro GReddy Sirius', 'Monitoramento de pressão de turbo com precisão japonesa.', 1, 900.00, 1800.00, 12, 1, 'B', '2026-05-04 18:54:31'),
(89, 'PEC-012', 'Kit Nitros NX Proton Plus', 'Potência instantânea com o apertar de um botão.', 1, 2500.00, 4500.00, 3, 1, 'A', '2026-05-04 18:54:31'),
(90, 'PEC-013', 'Radiador de Alumínio de 3 Passagens', 'Máxima eficiência térmica para motores preparados.', 1, 800.00, 1600.00, 10, 1, 'B', '2026-05-04 18:54:31'),
(91, 'PEC-014', 'Embreagem de Cerâmica Multidisco', 'Suporta altos torques sem patinar nas arrancadas.', 1, 1200.00, 2400.00, 5, 1, 'B', '2026-05-04 18:54:31'),
(92, 'PEC-015', 'Blow-off Valve HKS SSQV IV', 'O famoso espirro sequencial que todo gearhead ama.', 1, 600.00, 1300.00, 15, 1, 'B', '2026-05-04 18:54:31');

-- --------------------------------------------------------

--
-- Estrutura para tabela `solicitacoes_troca`
--

DROP TABLE IF EXISTS `solicitacoes_troca`;
CREATE TABLE `solicitacoes_troca` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pedido_id` int(11) DEFAULT NULL,
  `produto_id` int(11) DEFAULT NULL,
  `quantidade` int(11) NOT NULL,
  `motivo` text DEFAULT NULL,
  `status` varchar(30) DEFAULT 'PENDENTE',
  `data_solicitacao` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `solicitacoes_troca`
--

INSERT INTO `solicitacoes_troca` (`id`, `pedido_id`, `produto_id`, `quantidade`, `motivo`, `status`, `data_solicitacao`) VALUES
(1, 7, 13, 1, 'Jorge', 'NEGADO', '2026-04-27 16:34:24'),
(2, 2, 14, 1, 'Veio com delay no acelerador', 'AUTORIZADO', '2026-04-27 16:36:18'),
(3, 7, 13, 1, 'Jorge', 'AUTORIZADO', '2026-04-27 19:12:34'),
(4, 8, 6, 1, 'Jorge', 'AUTORIZADO', '2026-04-27 19:16:08');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de tabela `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de tabela `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de tabela `cupons`
--
ALTER TABLE `cupons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `enderecos_cliente`
--
ALTER TABLE `enderecos_cliente`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de tabela `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT de tabela `pedido_itens`
--
ALTER TABLE `pedido_itens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT de tabela `solicitacoes_troca`
--
ALTER TABLE `solicitacoes_troca`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
