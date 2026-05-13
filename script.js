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
   MÁSCARA DE MATRÍCULA (PADRÃO 0-0000000000)
   ============================================================ */
function aplicarMascaraMatricula(event) {
    let input = event.target;
    let valor = input.value.replace(/\D/g, ''); // Remove o que não é número

    if (valor.length > 1) {
        valor = valor.substring(0, 1) + '-' + valor.substring(1, 11);
    }
    input.value = valor;
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
    const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const hojeData = new Date();
    const hojeNome = diasSemana[hojeData.getDay()]; 
    const hojeISO = hojeData.toISOString().split('T')[0];

    let totalAulasCadastradas = 0;
    let aulasHojeCount = 0;
    let eventosHojeCount = 0; // Nova variável para o banco

    try {
        // 1. BUSCA AULAS (API)
        const resAulas = await fetch(`${API_URL}/api/agenda/aulas`);
        if (resAulas.ok) {
            const listaAulas = await resAulas.json();
            totalAulasCadastradas = listaAulas.length;
            aulasHojeCount = listaAulas.filter(aula => aula.dia === hojeNome).length;
        }

        // 2. BUSCA EVENTOS (API) - Ajuste aqui
        const resEventos = await fetch(`${API_URL}/api/eventos`); // Certifique-se que a rota é esta
        if (resEventos.ok) {
            const listaEventos = await resEventos.json();
            // Filtra os eventos que acontecem hoje, comparando com a data do banco
            eventosHojeCount = listaEventos.filter(e => {
                // Ajuste o campo 'e.data' conforme o nome da coluna no seu banco (ex: data_evento)
                const dataFormatada = new Date(e.data).toISOString().split('T')[0];
                return dataFormatada === hojeISO;
            }).length;
        }

    } catch (err) {
        console.error("Erro ao buscar dados da API:", err);
    }

    // Mantém o LocalStorage apenas para Reuniões (se ainda não migrou para o banco)
    const reunioes = JSON.parse(localStorage.getItem('minhasReunioes')) || [];
    const reunioesHoje = reunioes.filter(r => r.data === hojeISO && !r.concluida).length;

    const aplicarEstiloCard = (idElemento, valor) => {
        const elemento = document.getElementById(idElemento);
        if (!elemento) return;

        elemento.textContent = valor;
        elemento.style.color = '#1a1a1a'; 
        elemento.style.fontWeight = '800';

        const cardContainer = elemento.closest('.dash-card');
        if (cardContainer) {
            if (valor > 0) {
                cardContainer.style.backgroundColor = '#e9f5ee'; 
                cardContainer.style.borderLeft = '5px solid #2d7a50';
            } else {
                cardContainer.style.backgroundColor = '#f8fafc';
                cardContainer.style.borderLeft = '5px solid #e2e8f0';
            }
        }
    };
    
    // --- DISTRIBUIÇÃO DOS VALORES ATUALIZADA ---
    aplicarEstiloCard('count-aulas', totalAulasCadastradas);
    aplicarEstiloCard('count-reunioes', reunioesHoje);
    // Card de Horários: Aulas de hoje + Eventos de hoje
    const totalCompromissosHoje = aulasHojeCount + eventosHojeCount;
    aplicarEstiloCard('count-horarios', totalCompromissosHoje);
    // Agora usa o valor vindo do Banco de Dados
    aplicarEstiloCard('count-eventos-total', eventosHojeCount);

    // BUSCA USUÁRIOS (API)
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
/* ============================================================
   INICIALIZAÇÃO GLOBAL (LOGIN, CADASTRO E DASHBOARD)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Aplica a máscara em todos os campos de matrícula presentes na página atual
    // O seletor [id*="matricula"] pega qualquer ID que contenha a palavra 'matricula'
    const inputsMatricula = document.querySelectorAll('input[id*="matricula"]');
    
    inputsMatricula.forEach(input => {
        input.setAttribute('maxlength', '12');
        input.addEventListener('input', aplicarMascaraMatricula);
    });

    // 2. Exibição do nome do usuário no Dashboard
    const user = Auth.getUsuarioLogado();
    const userNameDisplay = document.getElementById('user-name');
    
    if (user && userNameDisplay) {
        userNameDisplay.textContent = user.nome;
    }

    // 3. Configuração do Logout
    const btnSair = document.querySelector('.btn-logout') || document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
    
    // 4. Só executa o refresh do dashboard se os cards existirem na página
    if (document.getElementById('count-aulas')) {
        atualizarDashboardGeral();
    }
    
});

function togglePassword(inputId) {
    const passInput = document.getElementById(inputId);
    if (!passInput) return;
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
}