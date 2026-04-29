const API_URL = "https://projeto-dac-production.up.railway.app"; 

/* ============================================================
   UTILITÁRIOS DE VALIDAÇÃO (Sincronizados com a Gestão)
   ============================================================ */

function validarDados(email, senha, matricula, isCadastro = true) {
    // 1. Validar Matrícula (Padrão 0-0000000000)
    const matriculaRegex = /^\d-\d{10}$/;
    if (!matriculaRegex.test(matricula)) {
        alert("Formato de matrícula inválido! Use o padrão: 0-0000000000");
        return false;
    }

    // 2. Validar Senha (Mínimo 8 caracteres, 1 Maiúscula, 1 Número, 1 Especial)
    const senhaRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!senhaRegex.test(senha)) {
        alert("A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, um número e um caractere especial.");
        return false;
    }

    // 3. Validar Domínio de E-mail (Apenas no Cadastro)
    if (isCadastro) {
        const dominiosPermitidos = [
            'gmail.com', 'hotmail.com', 'unifametro.edu.br', 
            'yahoo.com', 'icloud.com', 'outlook.com'
        ];
        const dominioExtraido = email.split('@')[1]?.toLowerCase();

        if (!dominiosPermitidos.includes(dominioExtraido)) {
            alert("Use um e-mail de um servidor permitido: Gmail, Hotmail, Unifametro, Yahoo ou iCloud.");
            return false;
        }
    }
     return true;
}

/* ============================================================
   CONFIGURAÇÕES GERAIS E UI
   ============================================================ */

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

function logout() {
     localStorage.clear();
    window.location.href = 'login.html'; 
}

/* ============================================================
   LÓGICA DE LOGIN
   ============================================================ */
/* ============================================================
   LÓGICA DE LOGIN (Corrigida)
   ============================================================ */
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const matricula = document.getElementById('matricula').value;
        const senha = document.getElementById('senha').value;

        // No LOGIN, validamos APENAS o formato da matrícula para evitar envios inúteis
        const matriculaRegex = /^\d-\d{10}$/;
        if (!matriculaRegex.test(matricula)) {
            alert("Formato de matrícula inválido! Use o padrão: 0-0000000000");
            return;
        }

        // REMOVEMOS a validação de senha forte daqui. 
        // O servidor é quem dirá se a senha está correta ou não.

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matricula, senha })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Bem-vindo, ${data.user.nome}!`);
                localStorage.setItem('usuarioNome', data.user.nome);
                localStorage.setItem('usuarioTipo', data.user.tipo_id);
                window.location.href = 'dashboard.html';
            } else {
                alert("❌ " + (data.error || "Matrícula ou senha incorretos"));
            }
        } catch (error) {
            alert("⚠️ Erro de conexão com o servidor.");
        }
    });
}

/* ============================================================
   LÓGICA DE CADASTRO
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

        if (!validarDados(email, senha, matricula, true)) return;

        const tipo_id = (tipoConta === 'professor') ? 1 : 3;

        try {
            const response = await fetch(`${API_URL}/cadastro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, matricula, senha, tipo_id })
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ Cadastro realizado com sucesso!");
                window.location.href = 'login.html';
            } else {
                alert("❌ Erro no cadastro: " + (data.error || "Tente novamente"));
            }
        } catch (error) {
            alert("⚠️ Erro de conexão com o servidor.");
        }
    });
}

/* ============================================================
   LÓGICA DO DASHBOARD (Contadores Dinâmicos)
   ============================================================ */

async function atualizarDashboardGeral() {
    const agora = new Date();
    const hojeDataFormatada = agora.toISOString().split('T')[0];
    const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const hojeDiaNome = diasSemana[agora.getDay()];

    // Dados locais (Aulas, Reuniões, Eventos)
    const aulas = JSON.parse(localStorage.getItem('minhasAulas')) || [];
    const reunioes = JSON.parse(localStorage.getItem('minhasReunioes')) || [];
    const eventos = JSON.parse(localStorage.getItem('eventos_db')) || [];

    const aplicarEstiloCard = (idElemento, valor) => {
        const elemento = document.getElementById(idElemento);
        if (!elemento) return;
        const statusLabel = elemento.parentElement;
        
        // Garante que o número dentro do círculo seja sempre branco
        elemento.style.color = 'white';
        elemento.style.fontWeight = 'bold';

        if (valor > 0) {
            statusLabel.style.backgroundColor = '#e9f5ee'; 
            statusLabel.style.color = '#2d7a4d';           
            elemento.style.backgroundColor = '#2d7a4d';    
        } else {
            statusLabel.style.backgroundColor = '#f1f5f9'; 
            statusLabel.style.color = '#64748b';
            // Cinza médio para manter contraste com o número branco
            elemento.style.backgroundColor = '#94a3b8';
        }
        elemento.textContent = valor;
    };
    
    // Contadores Locais
    aplicarEstiloCard('count-aulas', aulas.length);
    aplicarEstiloCard('count-reunioes', reunioes.filter(r => !r.concluida).length);
    aplicarEstiloCard('count-eventos-total', eventos.length);

    // Contador de Usuários (Dinâmico via API)
    const contadorUsuarios = document.getElementById('total-usuarios');
    if (contadorUsuarios) {
        try {
            const res = await fetch(`${API_URL}/api/usuarios`);
            if (res.ok) {
                const lista = await res.json();
                aplicarEstiloCard('total-usuarios', lista.length);
            }
        } catch (err) {
            console.error("Erro ao buscar usuários:", err);
        }
    }

    const totalHoje = aulas.filter(a => a.dia.includes(hojeDiaNome)).length +
                      reunioes.filter(r => r.data === hojeDataFormatada && !r.concluida).length +
                      eventos.filter(e => e.data === hojeDataFormatada).length;
    
    aplicarEstiloCard('count-horarios', totalHoje);
}

// Inicialização e Listeners
document.addEventListener('DOMContentLoaded', () => {
    // 1. Atualiza nome do usuário
    const userNameDisplay = document.getElementById('user-name');
    if (userNameDisplay) {
        userNameDisplay.textContent = localStorage.getItem('usuarioNome') || "Usuário";
    }

    // 2. Executa contadores do Dashboard
    atualizarDashboardGeral();
});

window.addEventListener('focus', () => {
    atualizarDashboardGeral();
});