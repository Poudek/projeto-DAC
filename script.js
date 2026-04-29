const API_URL = "https://projeto-dac-production.up.railway.app"; 

/* ============================================================
   CONTROLE DE ACESSO (PROTEÇÃO DE PÁGINAS)
   ============================================================ */
if (!window.location.pathname.includes('index.html') && !window.location.pathname.includes('login.html')) {
    Auth.validarAcesso();
}

/* ============================================================
   UTILITÁRIOS DE VALIDAÇÃO
   ============================================================ */
function validarDados(email, senha, matricula, isCadastro = true) {
    const matriculaRegex = /^\d-\d{10}$/;
    if (!matriculaRegex.test(matricula)) {
        alert("Formato de matrícula inválido! Use o padrão: 0-0000000000");
        return false;
    }

    const senhaRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (isCadastro && !senhaRegex.test(senha)) {
        alert("A senha deve ter pelo menos 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial.");
        return false;
    }

    if (isCadastro) {
        const dominiosPermitidos = ['gmail.com', 'hotmail.com', 'unifametro.edu.br', 'yahoo.com', 'icloud.com', 'outlook.com'];
        const dominioExtraido = email.split('@')[1]?.toLowerCase();
        if (!dominiosPermitidos.includes(dominioExtraido)) {
            alert("Use um e-mail de um servidor permitido.");
            return false;
        }
    }
    return true;
}

/* ============================================================
   LÓGICA DE LOGIN (CORRIGIDA)
   ============================================================ */
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const matricula = document.getElementById('matricula').value;
        const senha = document.getElementById('senha').value;

        const matriculaRegex = /^\d-\d{10}$/;
        if (!matriculaRegex.test(matricula)) {
            alert("Formato de matrícula inválido!");
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
                // CORREÇÃO CRÍTICA: Garantir que pegamos o objeto 'user' de dentro de 'data'
                const usuarioParaSalvar = data.user;
                
                // Criamos um mapa para traduzir o ID numérico em Cargo (texto)
                const nomesCargos = {
                 1: 'Professor',
        2: 'Coordenador',
        3: 'Aluno',
        4: 'Secretaria',
        5: 'Administrador' // O seu caso!
                                    };
                // Adicionamos o campo 'cargo' ao objeto do usuário para facilitar o controle de acesso
                if (usuarioParaSalvar) {
                    usuarioParaSalvar.cargo = nomesCargos[usuarioParaSalvar.tipo_id] || 'Desconecido';
                }

                if (usuarioParaSalvar) {
                    alert(`Bem-vindo, ${usuarioParaSalvar.nome}!`);
                    
                    // SALVAMENTO UNIFICADO: Salva o objeto completo (id, nome, cargo, tipo_id...)
                    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioParaSalvar));
                    
                    // Mantemos os campos individuais para compatibilidade com o restante do código
                    localStorage.setItem('usuarioNome', usuarioParaSalvar.nome);
                    localStorage.setItem('usuarioTipo', usuarioParaSalvar.tipo_id);

                    window.location.href = 'dashboard.html';
                } else {
                    alert("⚠️ Erro: Dados do usuário não retornados pelo servidor.");
                }
            } else {
                alert("❌ " + (data.error || "Matrícula ou senha incorretos"));
            }
        } catch (error) {
            console.error("Erro no login:", error);
            alert("⚠️ Erro de conexão com o servidor.");
        }
    });
}

/* ============================================================
   LÓGICA DE CADASTRO
   ============================================================ */
/* ============================================================
   LÓGICA DE CADASTRO (CORRIGIDA E VALIDADA)
   ============================================================ */
/* ============================================================
   LÓGICA DE CADASTRO (SINCRONIZADA COM OS NOVOS CARGOS)
   ============================================================ */
const cadastroForm = document.getElementById('cadastroForm');

if (cadastroForm) {
    cadastroForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o "sumiço" dos dados/refresh da página

        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const matricula = document.getElementById('matricula').value.trim();
        const tipoConta = document.getElementById('tipo-conta').value;
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;

        // 1. Validação de senhas iguais
        if (senha !== confirmarSenha) {
            alert("❌ As senhas não coincidem!");
            return;
        }

        // 2. Validação de Regras (E-mail @unifametro, Matrícula 0-0000000000 e Senha Forte)
        // Esta função deve estar definida no topo do seu script.js
        if (typeof validarDados === 'function') {
            if (!validarDados(email, senha, matricula, true)) return;
        }

        // 3. Mapeamento de IDs (Sincronizado com o seu banco de dados)
        const mapaCadastro = {
            'professor': 1,
            'coordenador': 2,
            'aluno': 3,
            'secretaria': 4,
            'administrador': 5
        };

        const tipo_id = mapaCadastro[tipoConta];
        if (!tipo_id) {
            alert("⚠️ Selecione o Tipo de Conta.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/cadastro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, matricula, senha, tipo_id })
            });

            if (response.ok) {
                alert("✅ Cadastro realizado com sucesso!");
                window.location.href = 'login.html';
            } else {
                const data = await response.json();
                alert("❌ Erro no cadastro: " + (data.error || "Verifique os dados."));
            }
        } catch (error) {
            console.error("Erro na conexão:", error);
            alert("⚠️ Erro de conexão com o servidor.");
        }
    });
}

/* ============================================================
   DASHBOARD E UI
   ============================================================ */
/* ============================================================
   DASHBOARD - ATUALIZAÇÃO GERAL E ESTILIZAÇÃO
   ============================================================ */
async function atualizarDashboardGeral() {
    const aulas = JSON.parse(localStorage.getItem('minhasAulas')) || [];
    const reunioes = JSON.parse(localStorage.getItem('minhasReunioes')) || [];
    const eventos = JSON.parse(localStorage.getItem('eventos_db')) || [];

    const aplicarEstiloCard = (idElemento, valor) => {
        const elemento = document.getElementById(idElemento);
        if (!elemento) return;

        elemento.textContent = valor;
        
        // Estilização do número para garantir visibilidade
        elemento.style.color = '#1a1a1a'; 
        elemento.style.fontWeight = '800';

        // CORREÇÃO AQUI: O seletor deve ser .dash-card, conforme seu HTML
        const cardContainer = elemento.closest('.dash-card');
        
        if (cardContainer) {
            if (valor > 0) {
                // Estilo de destaque (Verde)
                cardContainer.style.backgroundColor = '#e9f5ee'; 
                cardContainer.style.borderLeft = '5px solid #2d7a50';
            } else {
                // Estilo neutro (Cinza)
                cardContainer.style.backgroundColor = '#f8fafc';
                cardContainer.style.borderLeft = '5px solid #e2e8f0';
            }
        }
    };
    
    // Chamadas das funções
    aplicarEstiloCard('count-aulas', aulas.length);
    aplicarEstiloCard('count-reunioes', reunioes.filter(r => !r.concluida).length);
    aplicarEstiloCard('count-eventos-total', eventos.length);
    // Adicionei o count-horarios para bater com seu HTML
    aplicarEstiloCard('count-horarios', 0); 

    if (document.getElementById('total-usuarios')) {
        try {
            const res = await fetch(`${API_URL}/api/usuarios`);
            if (res.ok) {
                const lista = await res.json();
                aplicarEstiloCard('total-usuarios', lista.length);
            }
        } catch (err) { console.error(err); }
    }
}

/* ============================================================
   DASHBOARD E UI
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Puxar o usuário logado via Auth.js
    const user = Auth.getUsuarioLogado();
    const userNameDisplay = document.getElementById('user-name');
    
    // Se o elemento no seu HTML for o <h1> que diz "Bem-vindo... Usuário!", 
    // certifique-se de que ele tem o id="user-name" ou ajuste aqui:
    if (user && userNameDisplay) {
        userNameDisplay.textContent = user.nome;
    }

    // 2. Configurar o botão de Sair (Logout)
    const btnSair = document.querySelector('.btn-logout') || document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout(); // Usa a função centralizada no auth.js
        });
    }
    
    atualizarDashboardGeral();
});

function togglePassword(inputId) {
    const passInput = document.getElementById(inputId);
    if (!passInput) return;
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
}