const API_URL = "https://projeto-dac-production.up.railway.app"; 

/* ============================================================
   UTILITÁRIOS DE VALIDAÇÃO (Regras Atualizadas)
   ============================================================ */

function validarDados(email, senha, matricula, isCadastro = true) {
    // 1. Validar Matrícula (Padrão 0-0000000000)
    const matriculaRegex = /^\d-\d{10}$/;
    if (!matriculaRegex.test(matricula)) {
        alert("Formato de matrícula inválido! Use o padrão: 0-0000000000");
        return false;
    }

    // 2. Validar Senha (Maiúscula, Número, Caractere Especial, min 8 caracteres)
    const senhaRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!senhaRegex.test(senha)) {
        alert("A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, um número e um caractere especial.");
        return false;
    }

    // 3. Validar Domínio de E-mail Específico (Apenas no Cadastro)
    if (isCadastro) {
        // Lista restrita conforme sua solicitação
        const dominiosPermitidos = [
            'gmail.com', 
            'hotmail.com', 
            'unifametro.edu.br', 
            'yahoo.com', 
            'icloud.com',
            'outlook.com'
        ];
        
        const dominioExtraido = email.split('@')[1]?.toLowerCase(); // Pega o que vem após o @

        if (!dominiosPermitidos.includes(dominioExtraido)) {
            alert("Use um e-mail de um servidor permitido: Gmail, Hotmail, Unifametro, Yahoo ou iCloud.");
            return false;
        }
    }

    return true;
}

/* ============================================================
   CONFIGURAÇÕES GERAIS
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
   LÓGICA DE LOGIN (Simplificada)
   ============================================================ */
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const matricula = document.getElementById('matricula').value;
        const senha = document.getElementById('senha').value;

        // No Login, apenas validamos o formato da matrícula para poupar o servidor
        const matriculaRegex = /^\d-\d{10}$/;
        if (!matriculaRegex.test(matricula)) {
            alert("Formato de matrícula inválido (0-0000000000)");
            return;
        }

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
                // Aqui o erro vem do banco (senha errada ou usuário não existe)
                alert("❌ " + (data.error || "Matrícula ou senha incorretos"));
            }
        } catch (error) {
            alert("⚠️ Erro de conexão com o servidor.");
        }
    });
}

/* ============================================================
   LÓGICA DE CADASTRO (Com Validação de Domínio e Duplicidade)
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

        // 1. Verificar se as senhas batem
        if (senha !== confirmarSenha) {
            alert("As senhas não coincidem!");
            return;
        }

        // 2. CHAMADA DA VALIDAÇÃO (Regras de e-mail, senha forte e matrícula)
        // Isso vai garantir que @unifametro.edu.br, @gmail, etc., sejam respeitados
        if (typeof validarDados === "function") {
            const dadosValidos = validarDados(email, senha, matricula, true);
            if (!dadosValidos) return; // Se a validação falhar (alert), para o código aqui
        }

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
                // Tratamento para e-mail ou matrícula já cadastrados no banco
                if (data.error && data.error.includes("Duplicate entry")) {
                    if (data.error.includes(email)) {
                        alert("❌ Este e-mail já está cadastrado!");
                    } else if (data.error.includes(matricula)) {
                        alert("❌ Esta matrícula já está em uso!");
                    }
                } else {
                    alert("❌ Erro no cadastro: " + (data.error || "Tente novamente"));
                }
            }
        } catch (error) {
            alert("⚠️ Erro de conexão. Verifique se o servidor no Railway está ativo.");
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