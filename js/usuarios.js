/* ============================================================
   usuarios.js - GESTÃO RESTRITA (ADMINISTRADOR)
   ============================================================ */

// 1. Bloqueio imediato se não for Admin
Auth.validarAcesso('administrador');

const API_URL = "https://projeto-dac-production.up.railway.app";
let listaCompletaUsuarios = [];
let usuarioIdEmEdicao = null;

// Cache de Seletores do DOM
const dom = {
    tabela: document.getElementById('lista-usuarios'),
    form: document.getElementById('formUsuario'),
    modal: document.getElementById('modalUsuario'),
    senha: document.getElementById('senhaUsuario'),
    toggle: document.getElementById('toggleSenha')
};
const inputMatricula = document.getElementById('matriculaUsuario');
    if (inputMatricula) {
        inputMatricula.addEventListener('input', aplicarMascaraMatricula);
    }

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    carregarUsuariosServidor();
    configurarToggleSenha();
    configurarEnvioFormulario(); // Adicionado: ativa a escuta do formulário
});

/* ============================================================
   LÓGICA DE SALVAMENTO (NOVO OU EDIÇÃO)
   ============================================================ */
/* ============================================================
   LÓGICA DE SALVAMENTO COM VALIDAÇÃO RÍGIDA
   ============================================================ */
function configurarEnvioFormulario() {
    if (!dom.form) return;

    dom.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dados = {
            nome: document.getElementById('nomeUsuario').value.trim(),
            email: document.getElementById('emailUsuario').value.trim(),
            tipo_id: document.getElementById('cargoUsuario').value,
            matricula: document.getElementById('matriculaUsuario').value.trim(),
            senha: dom.senha.value
        };

        // --- INÍCIO DA VALIDAÇÃO (OS REQUISITOS VOLTARAM!) ---

        // 1. Validação de E-mail Institucional
        const emailSufixo = "@unifametro.edu.br";
        if (!dados.email.endsWith(emailSufixo)) {
            alert(`Erro: O e-mail deve ser institucional (${emailSufixo}).`);
            return;
        }

        // 2. Validação de Matrícula (Padrão 0-0000000000)
        const matriculaRegex = /^\d{1}-\d{10}$/; 
        if (!matriculaRegex.test(dados.matricula)) {
            alert("Erro: A matrícula deve seguir o padrão: 0-0000000000");
            return;
        }

        // 3. Validação de Senha (Apenas se estiver criando ou se o campo não estiver vazio)
        // Regra: Mínimo 8 caracteres, 1 Letra Maiúscula, 1 Número, 1 Especial
        const senhaRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        
        // Se for NOVO usuário, a senha é obrigatória e precisa ser forte
        // Se for EDIÇÃO, validamos apenas se o usuário digitou algo para trocar a senha
        if (!usuarioIdEmEdicao || dados.senha.length > 0) {
            if (!senhaRegex.test(dados.senha)) {
                alert("Erro: A senha não atende aos critérios de segurança:\n- Mínimo 8 caracteres\n- Pelo menos uma letra maiúscula\n- Pelo menos um número\n- Pelo menos um caractere especial (@$!%*?&)");
                return;
            }
        }

        // --- FIM DA VALIDAÇÃO ---

        const url = usuarioIdEmEdicao 
            ? `${API_URL}/api/usuarios/${usuarioIdEmEdicao}` 
            : `${API_URL}/cadastro`;
        
        const metodo = usuarioIdEmEdicao ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (response.ok) {
                alert(usuarioIdEmEdicao ? "✅ Usuário atualizado!" : "✅ Usuário cadastrado com sucesso!");
                fecharLimparModal();
                carregarUsuariosServidor();
            } else {
                const erro = await response.json();
                alert("❌ Erro no servidor: " + (erro.error || "Falha na operação"));
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("⚠️ Erro de conexão com o servidor.");
        }
    });
}

/* ============================================================
   FUNÇÕES DE CARREGAMENTO E RENDERIZAÇÃO
   ============================================================ */
async function carregarUsuariosServidor() {
    try {
        const response = await fetch(`${API_URL}/api/usuarios`);
        listaCompletaUsuarios = await response.json();
        renderizarTabela(listaCompletaUsuarios);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
    }
}

function renderizarTabela(usuarios) {
    if (!dom.tabela) return;
    dom.tabela.innerHTML = '';

    if (usuarios.length === 0) {
        dom.tabela.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum usuário encontrado.</td></tr>';
        return;
    }

    usuarios.forEach(user => {
        const cargo = user.cargo || 'Não definido';
        const cargoClasse = cargo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('aria', '').replace('ador', '');

        const row = `
            <tr>
                <td><strong>${user.nome}</strong></td>
                <td>${user.email}</td>
                <td><span class="tag-cargo ${cargoClasse}">${cargo}</span></td>
                <td style="text-align: right;">
                    <button class="btn-acao-tabela" onclick="editarCargo(${user.id})" title="Editar">
                        <i class="fa-solid fa-user-gear"></i>
                    </button>
                    <button class="btn-acao-tabela btn-delete" onclick="removerUsuario(${user.id})" title="Excluir">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        dom.tabela.innerHTML += row;
    });
}

/* ============================================================
   FILTROS E MODAL
   ============================================================ */
window.filtrarUsuarios = function(categoria) {
    // 1. Atualiza visualmente os botões
    document.querySelectorAll('.toggle-user button').forEach(btn => btn.classList.remove('active'));
    if (event?.currentTarget) event.currentTarget.classList.add('active');

    // 2. Se for 'todos', renderiza a lista completa e encerra
    if (categoria === 'todos') {
        renderizarTabela(listaCompletaUsuarios);
        return;
    }

    // 3. Lógica de filtro aprimorada
    const filtrados = listaCompletaUsuarios.filter(user => {
        // Transformamos o cargo do banco em algo fácil de comparar (minúsculo e sem acento)
        const cargoBanco = (user.cargo || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        // Mapeamos o que vem do botão para o que está no banco
        const termosBusca = {
            'admin': 'administrador',
            'professores': 'professor',
            'coordenadores': 'coordenador',
            'suportes': 'secretaria',
            'alunos': 'aluno'
        };

        const alvo = termosBusca[categoria] || categoria;
        
        // Compara se o cargo do banco contém o termo de busca
        return cargoBanco.includes(alvo);
    });

    renderizarTabela(filtrados);
};

window.abrirModalNovoUsuario = function() {
    usuarioIdEmEdicao = null;
    dom.form?.reset();
    document.querySelector('#modalUsuario h2').innerText = "Novo Usuário";
    dom.modal.style.display = 'block';
};

window.fecharLimparModal = function() {
    usuarioIdEmEdicao = null;
    dom.form?.reset();
    dom.modal.style.display = 'none';
};

window.editarCargo = async function(id) {
    usuarioIdEmEdicao = id;
    try {
        const res = await fetch(`${API_URL}/api/usuarios/${id}`);
        const user = await res.json();

        document.getElementById('nomeUsuario').value = user.nome;
        document.getElementById('emailUsuario').value = user.email;
        document.getElementById('matriculaUsuario').value = user.matricula;
        document.getElementById('cargoUsuario').value = user.tipo_id;
        
        document.querySelector('#modalUsuario h2').innerText = "Editar Usuário";
        dom.modal.style.display = 'block';
    } catch (error) { console.error(error); }
};

window.removerUsuario = async function(id) {
    if (!confirm("⚠️ Excluir usuário definitivamente?")) return;
    try {
        const res = await fetch(`${API_URL}/api/usuarios/${id}`, { method: 'DELETE' });
        if (res.ok) carregarUsuariosServidor();
    } catch (error) { console.error(error); }
};

/* ============================================================
   6. EXPORTAÇÃO PDF DINÂMICA (FILTRADA) COM LOGO
   ============================================================ */

// Função auxiliar para carregar a logo local
const carregarImagemLocal = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
    });
};

window.exportarUsuariosPDF = async function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); // 'p', 'mm', 'a4' padrão
    const verde = [39, 174, 96];

    // 1. Carregamento da Logo (Canto Superior Direito)
    try {
        const logo = await carregarImagemLocal('imgs/logo-unifametro.png');
        // Posicionamento: x=170 (numa folha de 210mm), y=10, largura=25, altura=25
        doc.addImage(logo, 'PNG', 160, 10, 50, 25);
    } catch (error) {
        console.warn("Logo local não encontrada para o PDF de usuários.", error);
    }

    // 2. Coleta de dados da tabela visível
    const linhasTabela = document.querySelectorAll('#lista-usuarios tr');
    if (linhasTabela.length === 0 || (linhasTabela.length === 1 && linhasTabela[0].innerText.includes("Nenhum"))) {
        alert("Não há dados visíveis para exportar.");
        return;
    }

    const dadosParaPDF = [];
    linhasTabela.forEach(linha => {
        const colunas = linha.querySelectorAll('td');
        if (colunas.length >= 3) {
            dadosParaPDF.push([
                colunas[0].innerText.trim(), // Nome
                colunas[1].innerText.trim(), // E-mail
                colunas[2].innerText.trim()  // Cargo
            ]);
        }
    });

    const botaoAtivo = document.querySelector('.toggle-user button.active');
    const categoriaNome = botaoAtivo ? botaoAtivo.innerText : "Geral";

    // 3. Design do Cabeçalho
    doc.setFontSize(18);
    doc.setTextColor(...verde);
    doc.text(`Relatório de Usuários - ${categoriaNome}`, 14, 20);
    
    doc.setDrawColor(...verde);
    doc.line(14, 23, 160, 23); // Linha um pouco menor para não bater na logo

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

    // 4. Geração da Tabela
    doc.autoTable({
        head: [["Nome", "E-mail", "Cargo"]],
        body: dadosParaPDF,
        startY: 40, // Começa após a logo e título
        theme: 'striped',
        headStyles: { fillColor: verde, textColor: 255 },
        alternateRowStyles: { fillColor: [235, 245, 238] }
    });

    const nomeArquivo = `usuarios_${categoriaNome.toLowerCase().replace(/\s/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
    doc.save(nomeArquivo);
};

function configurarToggleSenha() {
    if (dom.toggle && dom.senha) {
        dom.toggle.onclick = () => {
            const type = dom.senha.type === 'password' ? 'text' : 'password';
            dom.senha.type = type;
            dom.toggle.classList.toggle('fa-eye');
            dom.toggle.classList.toggle('fa-eye-slash');
        };
    }
}

/* ============================================================
   MÁSCARA DE MATRÍCULA (PADRÃO 0-0000000000)
   ============================================================ */
function aplicarMascaraMatricula(event) {
    let input = event.target;
    // Remove qualquer caractere que não seja número
    let valor = input.value.replace(/\D/g, '');

    // Se tiver mais de um número, insere o traço após o primeiro dígito
    if (valor.length > 1) {
        valor = valor.substring(0, 1) + '-' + valor.substring(1, 11);
    }

    input.value = valor;
}