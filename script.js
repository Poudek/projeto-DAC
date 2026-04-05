/* ============================================================
   LÓGICA DE REDIRECIONAMENTO (PROTÓTIPO)
   ============================================================ */

// 1. Fluxo de LOGIN
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Como não há banco de dados, qualquer dado inserido redireciona
        console.log("Login simulado com sucesso.");
        window.location.href = 'dashboard.html';
    });
}

// 2. Fluxo de CADASTRO
// Importante: No HTML de cadastro, certifique-se que o id do form seja 'cadastroForm'
const cadastroForm = document.getElementById('cadastroForm');
if (cadastroForm) {
    cadastroForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const senha = document.getElementById('senha').value;
        const confirmar = document.getElementById('confirmar-senha').value;

        // Validação básica de QA para o cadastro
        if (senha !== confirmar) {
            alert("As senhas não coincidem!");
            return;
        }

        console.log("Cadastro simulado com sucesso.");
        window.location.href = 'dashboard.html';
    });
}

// 3. Função de LOGOUT (Sair)
function logout() {
    // Redireciona para a página inicial ou de login
    window.location.href = 'login.html'; 
}

/* ============================================================
   UTILITÁRIOS (VISIBILIDADE DE SENHA)
   ============================================================ */
function togglePassword(inputId) {
    const passInput = document.getElementById(inputId);
    if (!passInput) return;
    
    // Pega o ícone que está logo após o input selecionado
    const eyeIcon = passInput.nextElementSibling;

    if (passInput.type === 'password') {
        passInput.type = 'text';
        if (eyeIcon) eyeIcon.textContent = 'visibility_off';
    } else {
        passInput.type = 'password';
        if (eyeIcon) eyeIcon.textContent = 'visibility';
    }
}

/* ============================================================
   LÓGICA UNIFICADA DO DASHBOARD (Aulas, Reuniões e Eventos)
   ============================================================ */
function atualizarDashboardGeral() {
    // 1. Obter Data Local de hoje (Formato AAAA-MM-DD)
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hojeDataFormatada = `${ano}-${mes}-${dia}`;
    
    // 2. Obter Dia da Semana para as Aulas
    const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const hojeDiaNome = diasSemana[agora.getDay()];

    // 3. Buscar fontes de dados
    const aulas = JSON.parse(localStorage.getItem('minhasAulas')) || [];
    const reunioes = JSON.parse(localStorage.getItem('minhasReunioes')) || [];
    const eventos = JSON.parse(localStorage.getItem('eventos_db')) || [];

    // --- FUNÇÃO MÁGICA: APLICA O VISUAL VERDE SE O VALOR FOR > 0 ---
    const aplicarEstiloCard = (idElemento, valor) => {
        const elemento = document.getElementById(idElemento);
        if (!elemento) return;

        const statusLabel = elemento.parentElement;
        
        if (valor > 0) {
            statusLabel.style.backgroundColor = '#e9f5ee'; // Verde claro
            statusLabel.style.color = '#2d7a4d';           // Texto verde escuro
            elemento.style.backgroundColor = '#2d7a4d';    // Fundo do número verde escuro
            elemento.style.color = 'white';                // Número branco
        } else {
            statusLabel.style.backgroundColor = '#f1f5f9'; // Cinza neutro
            statusLabel.style.color = '#64748b';
            elemento.style.backgroundColor = '#64748b';
            elemento.style.color = 'white';
        }
        elemento.textContent = valor;
    };
    
    // --- EXECUTANDO OS CÁLCULOS E APLICANDO O ESTILO ---

    // 1. AULAS CADASTRADAS (Total)
    aplicarEstiloCard('count-aulas', aulas.length);

    // 2. REUNIÕES PENDENTES (Total)
    const totalReunioesPendentes = reunioes.filter(r => !r.concluida).length;
    aplicarEstiloCard('count-reunioes', totalReunioesPendentes);

    // 3. EVENTOS ATIVOS (Total)
    aplicarEstiloCard('count-eventos-total', eventos.length);

    // 4. HORÁRIOS PARA HOJE (Soma Aulas + Reuniões Hoje + Eventos Hoje)
    const totalAulasHoje = aulas.filter(a => a.dia.includes(hojeDiaNome)).length;
    const totalReunioesHoje = reunioes.filter(r => r.data === hojeDataFormatada && !r.concluida).length;
    const totalEventosHoje = eventos.filter(e => e.data === hojeDataFormatada).length;
    
    const somaTotalHoje = totalAulasHoje + totalReunioesHoje + totalEventosHoje;
    aplicarEstiloCard('count-horarios', somaTotalHoje);
}

// Inicialização
document.addEventListener('DOMContentLoaded', atualizarDashboardGeral);
window.addEventListener('focus', atualizarDashboardGeral);

