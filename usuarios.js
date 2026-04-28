/* ============================================================
   CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
   ============================================================ */
let usuarioIdEmEdicao = null;
let listaCompletaUsuarios = [];

// Seletores do DOM
const formUsuario = document.getElementById('formUsuario');
const modalUsuario = document.getElementById('modalUsuario');
const tabelaCorpo = document.getElementById('lista-usuarios');
const senhaInput = document.getElementById('senhaUsuario');
const toggleSenha = document.getElementById('toggleSenha');

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    carregarUsuariosServidor();
    configurarToggleSenha();
});

/* ============================================================
   VALIDAÇÃO DE DADOS (CRITÉRIOS DE CADASTRO)
   ============================================================ */
function validarDadosUsuario(dados) {
    const emailSufixo = "@unifametro.edu.br";
    
    // REGEX ATUALIZADA: 1 dígito, hífen, 10 dígitos (Ex: 1-1234567890)
    const matriculaRegex = /^\d{1}-\d{10}$/; 
    
    // REGEX DA SENHA: Mínimo 8 caracteres, 1 maiúscula, 1 especial
    const senhaRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

    // 1. Validação de E-mail
    if (!dados.email.endsWith(emailSufixo)) {
        alert(`O e-mail deve ser institucional: exemplo${emailSufixo}`);
        return false;
    }

    // 2. Validação de Matrícula (Padrão 0-0000000000)
    if (!matriculaRegex.test(dados.matricula)) {
        alert("A matrícula deve seguir o padrão: 0-0000000000");
        return false;
    }

    // 3. Validação de Senha
    if (!senhaRegex.test(dados.senha)) {
        alert("A senha não atende aos critérios:\n• Mínimo 8 caracteres\n• 1 Letra Maiúscula\n• 1 Caractere Especial");
        return false;
    }

    return true; 
}

/* ============================================================
   GESTÃO DO MODAL
   ============================================================ */
window.abrirModalNovoUsuario = function() {
    usuarioIdEmEdicao = null;
    if (formUsuario) formUsuario.reset(); 

    document.querySelector('#modalUsuario h2').innerText = "Novo Usuário";
    document.querySelector('#modalUsuario p').innerText = "Cadastre um novo membro na plataforma.";
    
    if (senhaInput) senhaInput.type = 'password';
    if (toggleSenha) {
        toggleSenha.classList.add('fa-eye');
        toggleSenha.classList.remove('fa-eye-slash');
    }

    modalUsuario.style.display = 'block';
};

window.fecharLimparModal = function() {
    usuarioIdEmEdicao = null;
    if (formUsuario) formUsuario.reset();
    modalUsuario.style.display = 'none';
};

/* ============================================================
   FILTRAGEM E RENDERIZAÇÃO
   ============================================================ */
function renderizarTabela(usuarios) {
    if (!tabelaCorpo) return;
    tabelaCorpo.innerHTML = '';

    if (usuarios.length === 0) {
        tabelaCorpo.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum usuário encontrado.</td></tr>';
        return;
    }

    usuarios.forEach(user => {
        let classeCargo = 'tag-cargo';
        const cargoNome = user.cargo || 'Não definido';
        const cargoNormalizado = cargoNome.toLowerCase();

        if (cargoNormalizado === 'administrador') classeCargo += ' admin';
        else if (cargoNormalizado === 'coordenador') classeCargo += ' coord';
        else if (cargoNormalizado === 'professor') classeCargo += ' prof';
        else if (cargoNormalizado === 'secretaria') classeCargo += ' suporte';
        else if (cargoNormalizado === 'aluno') classeCargo += ' aluno';
        
        const row = `
            <tr>
                <td><strong>${user.nome}</strong></td>
                <td>${user.email}</td>
                <td><span class="${classeCargo}">${cargoNome}</span></td>
                <td><span class="status-ativo">● Ativo</span></td>
                <td style="text-align: right;">
                    <button class="btn-acao-tabela" onclick="editarCargo(${user.id})">
                        <i class="fa-solid fa-user-gear"></i>
                    </button>
                    <button class="btn-acao-tabela btn-delete" onclick="removerUsuario(${user.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        tabelaCorpo.innerHTML += row;
    });
}

window.filtrarUsuarios = function(categoria) {
    document.querySelectorAll('.toggle-user button').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    
    const tabela = document.getElementById('lista-usuarios');
    tabela.style.opacity = '0';

    setTimeout(() => {
        if (categoria === 'todos') {
            renderizarTabela(listaCompletaUsuarios);
        } else {
            const filtrados = listaCompletaUsuarios.filter(user => {
                const cargo = (user.cargo || "").toLowerCase();
                if (categoria === 'admin') return cargo === 'administrador';
                if (categoria === 'professores') return cargo === 'professor';
                if (categoria === 'coordenadores') return cargo === 'coordenador';
                if (categoria === 'suportes') return cargo === 'secretaria';
                if (categoria === 'alunos') return cargo === 'aluno';
                return false;
            });
            renderizarTabela(filtrados);
        }
        tabela.style.opacity = '1';
        tabela.style.transition = 'opacity 0.2s ease';
    }, 100);
};

/* ============================================================
   OPERACIONAL (API)
   ============================================================ */
async function carregarUsuariosServidor() {
    try {
        const response = await fetch('http://localhost:3000/api/usuarios');
        listaCompletaUsuarios = await response.json();
        renderizarTabela(listaCompletaUsuarios);
    } catch (error) {
        console.error('Erro:', error);
    }
}

if (formUsuario) {
    formUsuario.addEventListener('submit', async (event) => {
        event.preventDefault();

        const dados = {
            nome: document.getElementById('nomeUsuario').value,
            email: document.getElementById('emailUsuario').value,
            tipo_id: document.getElementById('cargoUsuario').value,
            matricula: document.getElementById('matriculaUsuario').value,
            senha: senhaInput.value
        };

        // Validação antes do Fetch
        if (!validarDadosUsuario(dados)) return;

        const url = usuarioIdEmEdicao 
            ? `http://localhost:3000/api/usuarios/${usuarioIdEmEdicao}` 
            : 'http://localhost:3000/cadastro';
        
        const metodo = usuarioIdEmEdicao ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (response.ok) {
                alert(usuarioIdEmEdicao ? "✅ Atualizado!" : "✅ Cadastrado!");
                fecharLimparModal();
                carregarUsuariosServidor();
            }
        } catch (error) {
            console.error("Erro:", error);
        }
    });
}

window.editarCargo = async function(id) {
    usuarioIdEmEdicao = id;
    try {
        const response = await fetch(`http://localhost:3000/api/usuarios/${id}`);
        const user = await response.json();

        document.getElementById('nomeUsuario').value = user.nome;
        document.getElementById('emailUsuario').value = user.email;
        document.getElementById('matriculaUsuario').value = user.matricula;
        document.getElementById('senhaUsuario').value = user.senha;
        document.getElementById('cargoUsuario').value = user.tipo_id;

        document.querySelector('#modalUsuario h2').innerText = "Editar Usuário";
        modalUsuario.style.display = 'block';
    } catch (error) { console.error(error); }
};

window.removerUsuario = async function(id) {
    if (confirm("⚠️ Excluir usuário definitivamente?")) {
        try {
            await fetch(`http://localhost:3000/api/usuarios/${id}`, { method: 'DELETE' });
            carregarUsuariosServidor();
        } catch (error) { console.error(error); }
    }
};

function configurarToggleSenha() {
    if (toggleSenha && senhaInput) {
        toggleSenha.onclick = function() {
            const type = senhaInput.type === 'password' ? 'text' : 'password';
            senhaInput.type = type;
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        };
    }
}