const API_URL = "https://mysql-tthd-production.up.railway.app"; // URL do seu back-end no Railway

/* ============================================================
   CONFIGURAÇÕES GERAIS E UTILITÁRIOS
   ============================================================ */

// Função para mostrar/esconder senha (compartilhada entre Login e Cadastro)
function togglePassword(inputId) {
    const passInput = document.getElementById(inputId);
    if (!passInput) return;
    
    const eyeIcon = passInput.nextElementSibling;

    if (passInput.type === 'password') {
        passInput.type = 'text';
        if (eyeIcon) eyeIcon.textContent = 'visibility_off';
    } else {
        passInput.type = 'password';
        if (eyeIcon) eyeIcon.textContent = 'visibility';
    }
}

// Função de Logout
function logout() {
    localStorage.clear(); // Limpa os dados do usuário para segurança
    window.location.href = 'login.html'; 
}

/* ============================================================
   LÓGICA DE LOGIN (VERIFICAÇÃO NO BANCO)
   ============================================================ */
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const matricula = document.getElementById('matricula').value;
        const senha = document.getElementById('senha').value;

        try {
            const response = await fetch('${API_URL}/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matricula, senha })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Bem-vindo, ${data.user.nome}!`);
                
                // Salvando dados na sessão para o Dashboard
                localStorage.setItem('usuarioNome', data.user.nome);
                localStorage.setItem('usuarioTipo', data.user.tipo_id);
                
                window.location.href = 'dashboard.html';
            } else {
                alert("❌ " + (data.error || "Matrícula ou senha incorretos"));
            }

        } catch (error) {
            console.error("Erro na conexão:", error);
            alert("⚠️ Servidor offline! Inicie o 'node server.js' no terminal.");
        }
    });
}

/* ============================================================
   LÓGICA DE CADASTRO REAL (CONECTADA AO BACK-END)
   ============================================================ */
const cadastroForm = document.getElementById('cadastroForm');

if (cadastroForm) {
    cadastroForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const matricula = document.getElementById('matricula').value;
        const tipoConta = document.getElementById('tipo-conta').value;
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;

        if (senha !== confirmarSenha) {
            alert("As senhas não coincidem!");
            return;
        }

        // Professor = 1, Aluno = 3 (conforme tbPessoaTipo)
        const tipo_id = (tipoConta === 'professor') ? 1 : 3;

        try {
            const response = await fetch('${API_URL}/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, matricula, senha, tipo_id })
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ Cadastro realizado com sucesso!");
                window.location.href = 'login.html'; // Manda para o login após cadastrar
            } else {
                alert("❌ Erro no cadastro: " + (data.error || "Tente novamente"));
            }

        } catch (error) {
            alert("⚠️ O servidor está desligado! Ligue o node server.js");
        }
    });
}

/* ============================================================
   LÓGICA DO DASHBOARD (Visual e Contadores)
   ============================================================ */
function atualizarDashboardGeral() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hojeDataFormatada = `${ano}-${mes}-${dia}`;
    
    const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const hojeDiaNome = diasSemana[agora.getDay()];

    const aulas = JSON.parse(localStorage.getItem('minhasAulas')) || [];
    const reunioes = JSON.parse(localStorage.getItem('minhasReunioes')) || [];
    const eventos = JSON.parse(localStorage.getItem('eventos_db')) || [];

    const aplicarEstiloCard = (idElemento, valor) => {
        const elemento = document.getElementById(idElemento);
        if (!elemento) return;

        const statusLabel = elemento.parentElement;
        
        if (valor > 0) {
            statusLabel.style.backgroundColor = '#e9f5ee'; 
            statusLabel.style.color = '#2d7a4d';           
            elemento.style.backgroundColor = '#2d7a4d';    
            elemento.style.color = 'white';                
        } else {
            statusLabel.style.backgroundColor = '#f1f5f9'; 
            statusLabel.style.color = '#64748b';
            elemento.style.backgroundColor = '#64748b';
            elemento.style.color = 'white';
        }
        elemento.textContent = valor;
    };
    
    // Atualização dos contadores
    aplicarEstiloCard('count-aulas', aulas.length);
    aplicarEstiloCard('count-reunioes', reunioes.filter(r => !r.concluida).length);
    aplicarEstiloCard('count-eventos-total', eventos.length);

    const totalHoje = aulas.filter(a => a.dia.includes(hojeDiaNome)).length +
                      reunioes.filter(r => r.data === hojeDataFormatada && !r.concluida).length +
                      eventos.filter(e => e.data === hojeDataFormatada).length;
    
    aplicarEstiloCard('count-horarios', totalHoje);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    atualizarDashboardGeral();
    // QA: Mostrar nome do usuário logado se houver um elemento com id "user-name"

    // No final do seu script.js (dentro do DOMContentLoaded)
const userNameDisplay = document.getElementById('user-name');
if (userNameDisplay) {
    // Busca o nome que salvamos no localStorage durante o login
    const nomeSalvo = localStorage.getItem('usuarioNome');
    userNameDisplay.textContent = nomeSalvo || "Convidado";
}
});
// 1. Executa os cálculos dos cards (se estiver no dashboard)
    if (typeof atualizarDashboardGeral === "function") {
        atualizarDashboardGeral();
    }
    
    // 2. Busca o nome no LocalStorage e exibe no elemento 'user-name'
    const userNameDisplay = document.getElementById('user-name');
    if (userNameDisplay) {
        const nomeSalvo = localStorage.getItem('usuarioNome');
        userNameDisplay.textContent = nomeSalvo || "Usuário";
    }

// Mantém o listener de foco para atualizar os números em tempo real
window.addEventListener('focus', () => {
    if (typeof atualizarDashboardGeral === "function") {
        atualizarDashboardGeral();
    }
});