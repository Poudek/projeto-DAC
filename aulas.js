/* ============================================================
   1. DADOS E PERSISTÊNCIA (LocalStorage)
   ============================================================ */

// Tenta carregar do LocalStorage. Se não existir, começa com o array vazio.
let minhasAulas = JSON.parse(localStorage.getItem('minhasAulas')) || [];

// Variável de controle de visão (Professor/Aluno)
let visaoAtual = 'professor'; 

// Função auxiliar para salvar no navegador
function salvarNoLocalStorage() {
    localStorage.setItem('minhasAulas', JSON.stringify(minhasAulas));
}

/* ============================================================
   2. CONTROLE DO MODAL (ABRIR / FECHAR)
   ============================================================ */
const modal = document.getElementById('modalAula');
const btnNovaAula = document.querySelector('.btn-nova-aula');
const btnCancelar = document.getElementById('btnCancelar');
const btnFecharX = document.querySelector('.close-modal');

if (btnNovaAula) {
    btnNovaAula.onclick = () => {
        modal.style.display = 'block';
    };
}

const fecharModal = () => {
    modal.style.display = 'none';
    const form = document.getElementById('formAula');
    if (form) form.reset(); 
};

if (btnCancelar) btnCancelar.onclick = fecharModal;
if (btnFecharX) btnFecharX.onclick = fecharModal;

window.onclick = (event) => {
    if (event.target == modal) fecharModal();
};

/* ============================================================
   3. GERENCIAMENTO DA TABELA E VISÕES
   ============================================================ */

function alternarVisao(tipo) {
    visaoAtual = tipo;

    document.getElementById('btn-view-professor').classList.toggle('active', tipo === 'professor');
    document.getElementById('btn-view-aluno').classList.toggle('active', tipo === 'aluno');

    const btnNova = document.querySelector('.btn-nova-aula');
    if (btnNova) {
        btnNova.style.display = (tipo === 'professor') ? 'block' : 'none';
    }

    renderizarTabela();
}

function renderizarTabela() {
    const corpoTabela = document.getElementById('lista-aulas');
    const thAcoes = document.querySelector('th:last-child'); 
    
    if (!corpoTabela) return;

    if (thAcoes) {
        thAcoes.style.display = (visaoAtual === 'professor') ? 'table-cell' : 'none';
    }

    corpoTabela.innerHTML = '';

    minhasAulas.forEach((aula) => {
        const tr = document.createElement('tr');
        
        let htmlConteudo = `
            <td><strong>${aula.disciplina}</strong></td>
            <td><span class="badge-turma">${aula.turma}</span></td>
            <td>${aula.sala}</td>
            <td>${aula.dia}</td>
            <td>${aula.horario}</td>
        `;

        if (visaoAtual === 'professor') {
            htmlConteudo += `
                <td style="text-align: right;">
                    <button class="btn-action" title="Visualizar"><i class="fa-regular fa-eye"></i></button>
                    <button class="btn-action btn-delete" onclick="excluirAula(${aula.id})" title="Excluir">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </td>
            `;
        }

        tr.innerHTML = htmlConteudo;
        corpoTabela.appendChild(tr);
    });
}

/* ============================================================
   4. FORMULÁRIO E AUXILIARES
   ============================================================ */

const formAula = document.getElementById('formAula');
if (formAula) {
    formAula.onsubmit = (e) => {
        e.preventDefault();

        const horaInicio = document.getElementById('horarioInicio').value;
        const horaTermino = document.getElementById('horarioTermino').value;

        const novaAula = {
            id: Date.now(),
            tipo: 'aula', // <--- IMPORTANTE: Prepara para a tela de Horários identificar como Aula
            disciplina: document.getElementById('materia').value,
            turma: document.getElementById('turma').value,
            sala: document.getElementById('sala').value,
            dia: document.getElementById('diaSemana').value,
            horario: `${horaInicio} - ${horaTermino}`
        };

        minhasAulas.push(novaAula);
        salvarNoLocalStorage();
        renderizarTabela();
        fecharModal();
    };
}

function excluirAula(id) {
    if (confirm('Tem certeza que deseja remover esta aula?')) {
        minhasAulas = minhasAulas.filter(aula => aula.id !== id);
        salvarNoLocalStorage();
        renderizarTabela();
    }
}

function preencherHorarios() {
    const selects = [document.getElementById('horarioInicio'), document.getElementById('horarioTermino')];
    
    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">--:--</option>';
        
        for (let hora = 7; hora <= 22; hora++) {
            ["00", "15", "30", "45"].forEach(minuto => {
                const h = hora < 10 ? `0${hora}` : hora;
                const valor = `${h}:${minuto}`;
                const option = new Option(valor, valor);
                select.add(option);
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    preencherHorarios();
    renderizarTabela();
});
document.addEventListener('DOMContentLoaded', () => {
    // Isso garante que, ao entrar na tela, a visão de professor seja carregada
    alternarVisao('professor'); 
});