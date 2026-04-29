/* ============================================================
   AUTH.JS - CENTRAL DE AUTENTICAÇÃO E PERMISSÕES
   ============================================================ */

const Auth = {
    // Recupera os dados do usuário do LocalStorage
    // No seu auth.js, altere a função getUsuarioLogado
getUsuarioLogado() {
    const dados = localStorage.getItem('usuarioLogado');
    const user = dados ? JSON.parse(dados) : null;
    console.log("Usuário detectado no Auth:", user); // Verifique o que aparece aqui no F12
    return user;
},

    // Verifica se o usuário está logado e tem o cargo necessário
    validarAcesso(cargoRequerido = null) {
        const usuario = this.getUsuarioLogado();

        // 1. Se não estiver logado, manda pro login
        if (!usuario) {
            window.location.href = 'index.html'; // ou login.html
            return false;
        }

        // 2. Se exigir um cargo específico (ex: administrador)
        if (cargoRequerido) {
            const cargoAtual = (usuario.cargo || "").toLowerCase();
            if (cargoAtual !== cargoRequerido.toLowerCase()) {
                alert("Acesso negado! Você não tem permissão para acessar esta área.");
                window.location.href = 'dashboard.html';
                return false;
            }
        }
        return true;
    },

    // Remove os dados e desloga o usuário
    logout() {
        localStorage.removeItem('usuarioLogado');
        window.location.href = 'index.html';
    }
};

// Tornar global para usar em outros scripts
window.Auth = Auth;

function gerenciarMenuLateral() {
    const usuario = Auth.getUsuarioLogado();
    const btnUsuarios = document.getElementById('item-menu-usuarios');

    if (usuario && btnUsuarios) {
        // Se NÃO for admin, esconde o botão de gestão
        if (usuario.cargo.toLowerCase() !== 'administrador') {
            btnUsuarios.style.display = 'none';
        }
    }
}

// Executa assim que a página carregar
document.addEventListener('DOMContentLoaded', gerenciarMenuLateral);