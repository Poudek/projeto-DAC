require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors()); // Libera o acesso para o seu Front-end (porta 5500)
app.use(express.json()); // Permite que o servidor entenda JSON

// Configuração da conexão com o MySQL (Railway)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Teste de conexão com o Banco
db.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao MySQL no Railway:', err.message);
        return;
    }
    console.log('✅ Conectado com sucesso ao MySQL no Railway!');
});

/* ============================================================
   ROTA DE CADASTRO (Onde o seu formulário vai bater)
   ============================================================ */
app.post('/cadastro', (req, res) => {
    const { nome, email, matricula, senha, tipo_id } = req.body;

    // Log para o seu acompanhamento de QA
    console.log(`--- Nova tentativa de cadastro: ${nome} (Matrícula: ${matricula}) ---`);

    const sql = "INSERT INTO tbUsuarios (nome, email, matricula, senha, tipo_id) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [nome, email, matricula, senha, tipo_id], (err, result) => {
        if (err) {
            console.error('❌ Erro ao inserir no banco:', err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }
        console.log('✅ Usuário cadastrado com sucesso no Banco!');
        res.status(201).json({ message: "Usuário cadastrado!", id: result.insertId });
    });
});
/* ============================================================
   ROTA DE LOGIN (Busca no Banco)
   ============================================================ */
app.post('/login', (req, res) => {
    const { matricula, senha } = req.body;

    console.log(`--- Tentativa de Login: Matrícula ${matricula} ---`);

    const sql = "SELECT * FROM tbUsuarios WHERE matricula = ? AND senha = ?";
    
    db.query(sql, [matricula, senha], (err, results) => {
        if (err) {
            console.error('❌ Erro na consulta de login:', err);
            return res.status(500).json({ error: "Erro no servidor" });
        }

        if (results.length > 0) {
            // Se encontrou o usuário
            console.log('✅ Login autorizado!');
            res.status(200).json({ message: "Sucesso", user: results[0] });
        } else {
            // Se não encontrou (senha errada ou matrícula inexistente)
            console.log('⚠️ Login negado: Credenciais inválidas.');
            res.status(401).json({ error: "Matrícula ou senha incorretos" });
        }
    });
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Endpoint de cadastro: http://localhost:${PORT}/cadastro`);
});