// Lógica do Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Aqui você poderia validar os dados
        // Por enquanto, apenas redirecionamos
        window.location.href = 'dashboard.html';
    });
}

// Mostrar/Esconder Senha
function togglePassword() {
    const passInput = document.getElementById('senha');
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
}

// Lógica de Logout
function logout() {
    window.location.href = 'index.html';
}

function togglePassword() {
    const passInput = document.getElementById('senha');
    const eyeIcon = document.querySelector('.toggle-eye');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.textContent = 'visibility_off';
    } else {
        passInput.type = 'password';
        eyeIcon.textContent = 'visibility';
    }
}

