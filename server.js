require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// --- MIDDLEWARES ---
// Mantenha o cors no topo para evitar bloqueios do navegador
app.use(cors({ origin: '*' })); 
app.use(express.json()); 

/* ============================================================
   CONFIGURAÇÃO DO POOL
   ============================================================ */
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erro crítico ao conectar ao MySQL:', err.message);
    } else {
        console.log('✅ Pool de conexões estabelecido com sucesso!');
        connection.release();
    }
});

/* ============================================================
   ROTAS
   ============================================================ */

// --- CADASTRAR ---
app.post('/cadastro', (req, res) => {
    const { nome, email, matricula, senha, tipo_id } = req.body;
    const sql = "INSERT INTO tbUsuarios (nome, email, matricula, senha, tipo_id) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [nome, email, matricula, senha, tipo_id], (err, result) => {
        if (err) {
            console.error('❌ Erro no INSERT:', err.message);
            return res.status(500).json({ error: "Erro ao cadastrar no banco" });
        }
        res.status(201).json({ message: "Usuário cadastrado!", id: result.insertId });
    });
});

// --- LISTAR TODOS ---
app.get('/api/usuarios', (req, res) => {
    console.log("📢 Requisição recebida em /api/usuarios");
    const query = `
        SELECT u.id, u.nome, u.email, t.descricao AS cargo 
        FROM tbUsuarios u
        INNER JOIN tbPessoaTipo t ON u.tipo_id = t.id
        ORDER BY u.nome ASC`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Erro SQL:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(results); 
    });
});

// --- EXCLUIR (A ROTA QUE FALTA) ---
app.delete('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    console.log(`--- 🗑️ Tentativa de exclusão: ID ${id} ---`);

    const sql = "DELETE FROM tbUsuarios WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('❌ Erro no DELETE:', err.message);
            return res.status(500).json({ error: "Erro ao excluir usuário" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        console.log('✅ Usuário removido com sucesso!');
        res.status(200).json({ message: "Sucesso" });
    });
});

// --- LOGIN ---
app.post('/login', (req, res) => {
    const { matricula, senha } = req.body;
    const sql = "SELECT * FROM tbUsuarios WHERE matricula = ? AND senha = ?";
    
    db.query(sql, [matricula, senha], (err, results) => {
        if (err) {
            console.error('❌ Erro no SELECT:', err.message);
            return res.status(500).json({ error: "Erro interno" });
        }

        if (results.length > 0) {
            res.status(200).json({ message: "Sucesso", user: results[0] });
        } else {
            res.status(401).json({ error: "Credenciais incorretas" });
        }
    });
});

// --- ATUALIZAR USUÁRIO ---
app.put('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nome, email, matricula, tipo_id } = req.body;
    
    console.log(`--- 📝 Tentativa de atualização: ID ${id} ---`);

    const sql = `
        UPDATE tbUsuarios 
        SET nome = ?, email = ?, matricula = ?, tipo_id = ? 
        WHERE id = ?`;

    db.query(sql, [nome, email, matricula, tipo_id, id], (err, result) => {
        if (err) {
            console.error('❌ Erro no UPDATE:', err.message);
            return res.status(500).json({ error: "Erro ao atualizar usuário no banco" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        console.log('✅ Usuário atualizado com sucesso!');
        res.status(200).json({ message: "Sucesso" });
    });
});

// --- BUSCAR UM USUÁRIO PELO ID ---
app.get('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT id, nome, email, matricula, senha, tipo_id FROM tbUsuarios WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
        res.json(result[0]);
    });
});

/* ============================================================
   ROTAS DE AGENDA (AULAS) - OPÇÃO 2
   ============================================================ */

// 1. CADASTRAR AULA
// server.js - Rota de Cadastro de Aula atualizada
app.post('/api/agenda/aulas', (req, res) => {
    const { disciplina, turma, sala, dia, horario, idUsuario, idTipo } = req.body;
    
    if (!horario || !horario.includes(' - ')) {
        return res.status(400).json({ error: "Horário inválido" });
    }

    const [inicio, fim] = horario.split(' - ');

    // Adicionamos 'titulo' no INSERT para resolver o erro do log
    const sql = `
        INSERT INTO tbAgenda 
        (titulo, disciplina, turma, sala, dia_semana, hora_inicio, hora_fim, usuario_id, tipo_agenda_id, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo')`;
    
    // Passamos 'disciplina' duas vezes: uma para o campo titulo e outra para disciplina
    db.query(sql, [disciplina, disciplina, turma, sala, dia, inicio, fim, idUsuario, idTipo], (err, result) => {
        if (err) {
            console.error("❌ Erro ao inserir aula:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Sucesso", id: result.insertId });
    });
});

//* ============================================================
   
// Garanta que o caminho comece exatamente com /api/agenda/aulas
app.get('/api/agenda/aulas', (req, res) => {
    console.log("📢 Buscando aulas no banco de dados...");
    
    // Filtramos pelo tipo_agenda_id = 1 (Aulas Teóricas)
    const sql = "SELECT * FROM tbAgenda WHERE tipo_agenda_id = 1 ORDER BY id DESC";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Erro SQL ao listar aulas:", err.message);
            return res.status(500).json({ error: "Erro ao buscar dados no banco" });
        }
        
        // Mapeamos os nomes das colunas do banco para o padrão do seu frontend
        const formatado = results.map(aula => ({
            id: aula.id,
            disciplina: aula.disciplina,
            turma: aula.turma,
            sala: aula.sala,
            dia: aula.dia_semana, // Mapeia dia_semana do banco para 'dia' do front
            horario: `${aula.hora_inicio} - ${aula.hora_fim}` // Recria a string de horário
        }));
        
        console.log(`✅ ${formatado.length} aulas encontradas e enviadas.`);
        res.json(formatado);
    });
});

// 3. EDITAR AULA
app.put('/api/agenda/aulas/:id', (req, res) => {
    const { id } = req.params;
    const { disciplina, turma, sala, dia, horario } = req.body;
    const [inicio, fim] = horario.split(' - ');

    const sql = `
        UPDATE tbAgenda 
        SET disciplina = ?, turma = ?, sala = ?, dia_semana = ?, hora_inicio = ?, hora_fim = ? 
        WHERE id = ?`;
    
    db.query(sql, [disciplina, turma, sala, dia, inicio, fim, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Aula atualizada com sucesso!" });
    });
});

// 4. EXCLUIR AULA
app.delete('/api/agenda/aulas/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM tbAgenda WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('❌ Erro no DELETE da aula:', err.message);
            return res.status(500).json({ error: "Erro ao excluir aula no banco" });
        }
        res.status(200).json({ message: "Sucesso" });
    });
});

// --- ROTA PARA SALVAR EVENTO NO BANCO ---
app.post('/api/eventos', (req, res) => {
    const { titulo, categoria, data, hora_inicio, local, descricao, usuario_id } = req.body;
    
    const sql = "INSERT INTO tbEventos (titulo, categoria, data, hora_inicio, local, descricao, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [titulo, categoria, data, hora_inicio, local, descricao, usuario_id], (err, result) => {
        if (err) {
            console.error("Erro SQL:", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Evento criado com sucesso!" });
    });
});

// --- ROTA PARA BUSCAR EVENTOS ---
app.get('/api/eventos', (req, res) => {
    const sql = "SELECT * FROM tbEventos ORDER BY data ASC, hora_inicio ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- EXCLUIR EVENTO ---
app.delete('/api/eventos/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM tbEventos WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Evento excluído com sucesso!" });
    });
});

// --- ALTERAR EVENTO ---
app.put('/api/eventos/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, categoria, data, hora_inicio, local, descricao } = req.body;
    const sql = "UPDATE tbEventos SET titulo=?, categoria=?, data=?, hora_inicio=?, local=?, descricao=? WHERE id=?";
    db.query(sql, [titulo, categoria, data, hora_inicio, local, descricao, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Evento atualizado!" });
    });
});

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});