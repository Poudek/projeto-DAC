require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json()); 

/* ============================================================
   CONFIGURAÇÃO DO POOL (Essencial para Produção)
   ============================================================ */
// O Pool gerencia várias conexões automaticamente e as reabre se caírem.
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

// Teste de conexão inicial
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erro crítico ao conectar ao MySQL no Railway:', err.message);
    } else {
        console.log('✅ Pool de conexões estabelecido com sucesso!');
        connection.release(); // Libera a conexão de teste de volta para o pool
    }
});

/* ============================================================
   ROTAS
   ============================================================ */

app.post('/cadastro', (req, res) => {
    const { nome, email, matricula, senha, tipo_id } = req.body;
    console.log(`--- Tentativa de cadastro: ${nome} (${matricula}) ---`);

    // Nota de QA: Verifique se a tabela no Railway é exatamente 'tbUsuarios' (Case Sensitive)
    const sql = "INSERT INTO tbUsuarios (nome, email, matricula, senha, tipo_id) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [nome, email, matricula, senha, tipo_id], (err, result) => {
        if (err) {
            console.error('❌ Erro no INSERT:', err.message);
            return res.status(500).json({ error: "Erro ao cadastrar no banco" });
        }
        res.status(201).json({ message: "Usuário cadastrado!", id: result.insertId });
    });
});

app.post('/login', (req, res) => {
    const { matricula, senha } = req.body;
    console.log(`--- Tentativa de Login: Matrícula ${matricula} ---`);

    const sql = "SELECT * FROM tbUsuarios WHERE matricula = ? AND senha = ?";
    
    db.query(sql, [matricula, senha], (err, results) => {
        if (err) {
            console.error('❌ Erro no SELECT:', err.message);
            return res.status(500).json({ error: "Erro interno no servidor" });
        }

        if (results.length > 0) {
            console.log('✅ Login autorizado!');
            res.status(200).json({ message: "Sucesso", user: results[0] });
        } else {
            console.log('⚠️ Login negado.');
            res.status(401).json({ error: "Matrícula ou senha incorretos" });
        }
    });
});

// Inicialização
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});