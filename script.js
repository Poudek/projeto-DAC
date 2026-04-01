/* ============================================================
   LÓGICA DE LOGIN E ACESSO
   ============================================================ */

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Redireciona para o dashboard principal
        window.location.href = 'dashboard.html';
    });
}

// Função de Logout (usada em todas as páginas no botão "Sair")
function logout() {
    window.location.href = 'index.html';
}

// Mostrar/Esconder Senha (usada no Login e Cadastro)
function togglePassword() {
    const passInput = document.getElementById('senha');
    const eyeIcon = document.querySelector('.toggle-eye');
    
    if (!passInput || !eyeIcon) return; // Evita erro se o elemento não existir na página

    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.textContent = 'visibility_off'; // Ou a classe do seu ícone
    } else {
        passInput.type = 'password';
        eyeIcon.textContent = 'visibility';
    }
}

/* ============================================================
   LÓGICA DA SIDEBAR (GLOBAL PARA DASHBOARD, AULAS, ETC)
   ============================================================ */

// Se você usa o hover do CSS, talvez não precise de JS aqui. 
// Mas se quiser um botão de "fechar/abrir" fixo, a lógica ficaria aqui.
const sidebar = document.querySelector('.sidebar');
if (sidebar) {
    // Exemplo: manter aberta ao clicar (opcional)
    // sidebar.addEventListener('click', () => sidebar.classList.toggle('open'));
}

function atualizarDash() {
    // 1. Pega os dados do LocalStorage
    const aulas = JSON.parse(localStorage.getItem('minhasAulas')) || [];
    
    // 2. Atualiza o Card "Aulas" (Total Geral)
    const elAulas = document.getElementById('count-aulas');
    if (elAulas) elAulas.textContent = aulas.length;

    // 3. Atualiza o Card "Horários" (Apenas o que é para HOJE)
    const elHorarios = document.getElementById('count-horarios');
    if (elHorarios) {
        // Pega o dia da semana atual (ex: "Quarta-feira")
        const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
        const hoje = diasSemana[new Date().getDay()];
        
        // Filtra as aulas que batem com o dia de hoje
        const aulasHoje = aulas.filter(aula => aula.dia.includes(hoje));
        elHorarios.textContent = aulasHoje.length;
    }
}

// Executa quando a página carregar
document.addEventListener('DOMContentLoaded', atualizarDash);