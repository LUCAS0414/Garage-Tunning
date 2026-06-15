const pool = require('../db/config');
const bcrypt = require('bcrypt');

const ClienteService = {

  async buscarPorId(id) {
    const [clientes] = await pool.execute(
      `SELECT id, codigo_cliente, nome, genero, data_nascimento, cpf,
              telefone_tipo, telefone_ddd, telefone_numero,
              email, ranking, pontos_garagem, status, data_cadastro
       FROM clientes WHERE id = ?`, [id]
    );
    if (clientes.length === 0) throw new Error('Cliente não encontrado.');

    const [enderecos] = await pool.execute(
      `SELECT * FROM enderecos_cliente WHERE cliente_id = ?`, [id]
    );
    const [cartoes] = await pool.execute(
      `SELECT id, numero_cartao, nome_impresso, bandeira, is_preferencial
       FROM cartoes_cliente WHERE cliente_id = ?`, [id]
    );

    return { ...clientes[0], enderecos, cartoes };
  },

  async atualizar(id, dados) {
    const campos = [];
    const valores = [];

    if (dados.nome)            { campos.push('nome = ?');            valores.push(dados.nome); }
    if (dados.email)           { campos.push('email = ?');           valores.push(dados.email); }
    if (dados.genero)          { campos.push('genero = ?');          valores.push(dados.genero); }
    if (dados.data_nascimento) { campos.push('data_nascimento = ?'); valores.push(dados.data_nascimento); }
    if (dados.telefone_tipo)   { campos.push('telefone_tipo = ?');   valores.push(dados.telefone_tipo); }
    if (dados.telefone_ddd)    { campos.push('telefone_ddd = ?');    valores.push(dados.telefone_ddd); }
    if (dados.telefone_numero) { campos.push('telefone_numero = ?'); valores.push(dados.telefone_numero); }

    if (campos.length === 0) throw new Error('Nenhum campo para atualizar.');

    valores.push(id);
    await pool.execute(`UPDATE clientes SET ${campos.join(', ')} WHERE id = ?`, valores);
    return { mensagem: 'Dados atualizados com sucesso.' };
  },

  async alterarSenha(id, novaSenha) {
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);
    await pool.execute('UPDATE clientes SET senha_hash = ? WHERE id = ?', [senhaHash, id]);
    return { mensagem: 'Senha alterada com sucesso.' };
  },

  async inativar(id) {
    const [result] = await pool.execute(
      'UPDATE clientes SET status = FALSE WHERE id = ?', [id]
    );
    if (result.affectedRows === 0) throw new Error('Cliente não encontrado.');
    return { mensagem: 'Conta inativada com sucesso.' };
  },

  // ENDEREÇOS
  async listarEnderecos(clienteId) {
    const [enderecos] = await pool.execute(
      'SELECT * FROM enderecos_cliente WHERE cliente_id = ?', [clienteId]
    );
    return enderecos;
  },

  async adicionarEndereco(clienteId, dados) {
    const sql = `
      INSERT INTO enderecos_cliente
        (cliente_id, identificacao, tipo_endereco, tipo_residencia, tipo_logradouro,
         logradouro, numero, bairro, cep, cidade, estado, pais, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await pool.execute(sql, [
      clienteId,
      dados.identificacao  || 'Endereço Adicional',
      dados.tipo_endereco  || 'AMBOS',
      dados.tipo_residencia  || 'NAO_INFORMADO',
      dados.tipo_logradouro  || 'NAO_INFORMADO',
      dados.logradouro, dados.numero, dados.bairro,
      dados.cep, dados.cidade, dados.estado,
      dados.pais           || 'Brasil',
      dados.observacoes    || ''
    ]);
    return { mensagem: 'Endereço adicionado com sucesso.', id: result.insertId };
  },

  async atualizarEndereco(endId, clienteId, dados) {
    const campos = [];
    const valores = [];
    const permitidos = ['identificacao','tipo_endereco','tipo_residencia','tipo_logradouro',
                        'logradouro','numero','bairro','cep','cidade','estado','pais','observacoes'];

    permitidos.forEach(campo => {
      if (dados[campo] !== undefined) {
        campos.push(`${campo} = ?`);
        valores.push(dados[campo]);
      }
    });

    if (campos.length === 0) throw new Error('Nenhum campo para atualizar.');

    valores.push(endId, clienteId);
    const [result] = await pool.execute(
      `UPDATE enderecos_cliente SET ${campos.join(', ')} WHERE id = ? AND cliente_id = ?`,
      valores
    );
    if (result.affectedRows === 0) throw new Error('Endereço não encontrado.');
    return { mensagem: 'Endereço atualizado com sucesso.' };
  },

  async removerEndereco(endId, clienteId) {
    const [result] = await pool.execute(
      'DELETE FROM enderecos_cliente WHERE id = ? AND cliente_id = ?',
      [endId, clienteId]
    );
    if (result.affectedRows === 0) throw new Error('Endereço não encontrado.');
    return { mensagem: 'Endereço removido com sucesso.' };
  },
};

module.exports = ClienteService;