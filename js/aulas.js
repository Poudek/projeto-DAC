// aulas.js - Mude o início para isto:
if (typeof API_URL === 'undefined') {
    window.API_URL = "https://projeto-dac-production.up.railway.app";
}


let minhasAulas = []; 
let aulaEmEdicaoId = null; 

// Função para carregar imagem local e retornar uma Promise
const carregarImagemLocal = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
    });
};

function obterUsuarioLogado() {
    const usuario = localStorage.getItem('usuarioLogado');
    return usuario ? JSON.parse(usuario) : null;
}

function ehAdmin() {
    const userJson = localStorage.getItem('usuarioLogado');
    const tipoDireto = localStorage.getItem('usuarioTipo'); 

    if (userJson) {
        const user = JSON.parse(userJson);
        // Wesley (Admin) tem tipo 5 no seu LocalStorage
        if (user.tipo == 5 || user.usuarioTipo == 5 || tipoDireto == 5) {
            return true;
        }
    }
    return tipoDireto == 5;
}

/* ============================================================
   2. COMUNICAÇÃO COM O BACKEND (FETCH)
   ============================================================ */

async function carregarAulasDoBanco() {
    try {
        const response = await fetch(`${API_URL}/api/agenda/aulas`); // Ajuste para sua rota completa
        if (!response.ok) throw new Error('Erro ao buscar aulas');
        
        minhasAulas = await response.json();
        renderizarTabela();
    } catch (error) {
        console.error("❌ Erro ao carregar banco:", error);
        // Fallback para LocalStorage se o Railway estiver fora ou demorar
        minhasAulas = JSON.parse(localStorage.getItem('minhasAulas')) || [];
        renderizarTabela();
    }
}

async function excluirAula(id) {
    if (!confirm('Tem certeza que deseja remover esta aula?')) return;

    try {
        const response = await fetch(`${API_URL}/api/agenda/aulas/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await carregarAulasDoBanco(); 
        } else {
            alert("Erro ao excluir aula no servidor.");
        }
    } catch (error) {
        console.error("Erro na exclusão:", error);
    }
}

/* ============================================================
   3. CONTROLE DO MODAL E TABELA
   ============================================================ */
const modal = document.getElementById('modalAula');
const btnNovaAula = document.getElementById('btnAbrirModalAula');
const tituloModal = document.querySelector('.modal-header h2');

function renderizarTabela() {
    const corpoTabela = document.getElementById('lista-aulas');
    const adminMode = ehAdmin();
    
    if (!corpoTabela) return;
    
    // Libera o botão "Nova Aula" se for Admin
    if (btnNovaAula) {
        btnNovaAula.style.display = adminMode ? 'block' : 'none';
    }

    corpoTabela.innerHTML = '';

    minhasAulas.forEach((aula) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${aula.disciplina}</strong></td>
            <td><span class="badge-turma">${aula.turma}</span></td>
            <td>${aula.sala}</td>
            <td>${aula.dia}</td>
            <td>${aula.horario}</td>
            <td style="text-align: right;">
                ${adminMode ? `
                    <button class="btn-action" onclick="prepararEdicao(${aula.id})" title="Editar">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="excluirAula(${aula.id})" title="Excluir">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                ` : '---'}
            </td>
        `;
        corpoTabela.appendChild(tr);
    });
}

function prepararEdicao(id) {
    const aula = minhasAulas.find(a => a.id === id);
    if (!aula) return;

    aulaEmEdicaoId = id;
    tituloModal.innerText = "Editar Aula";

    document.getElementById('materia').value = aula.disciplina;
    document.getElementById('turma').value = aula.turma;
    document.getElementById('sala').value = aula.sala;
    document.getElementById('diaSemana').value = aula.dia;
    
    const [inicio, termino] = aula.horario.split(' - ');
    document.getElementById('horarioInicio').value = inicio;
    document.getElementById('horarioTermino').value = termino;

    modal.style.display = 'block';
}

const fecharModal = () => {
    modal.style.display = 'none';
    const form = document.getElementById('formAula');
    if (form) form.reset();
    aulaEmEdicaoId = null;
};

/* ============================================================
   4. ENVIO DO FORMULÁRIO (INSERT/UPDATE)
   ============================================================ */
const formAula = document.getElementById('formAula');
if (formAula) {
    formAula.onsubmit = async (e) => {
        e.preventDefault();
        const user = obterUsuarioLogado();

        const dadosAula = {
            disciplina: document.getElementById('materia').value,
            turma: document.getElementById('turma').value,
            sala: document.getElementById('sala').value,
            dia: document.getElementById('diaSemana').value,
            horario: `${document.getElementById('horarioInicio').value} - ${document.getElementById('horarioTermino').value}`,
            idUsuario: user ? user.id : null,
            idTipo: 1 
        };

        const url = aulaEmEdicaoId ? `${API_URL}/api/agenda/aulas/${aulaEmEdicaoId}` : `${API_URL}/api/agenda/aulas`;
        const method = aulaEmEdicaoId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAula)
            });

            if (response.ok) {
                fecharModal();
                await carregarAulasDoBanco();
            } else {
                alert("Erro ao salvar dados no servidor.");
            }
        } catch (error) {
            console.error("Erro na conexão:", error);
            alert("Erro ao conectar com o servidor.");
        }
    };
}

/* ============================================================
   5. INICIALIZAÇÃO E EVENTOS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os dados iniciais
    carregarAulasDoBanco();

    // Atribui evento ao botão de abrir modal (Garante que funcione mesmo com erro de API)
    if (btnNovaAula) {
        btnNovaAula.onclick = () => {
            aulaEmEdicaoId = null;
            tituloModal.innerText = "Nova Aula";
            modal.style.display = 'block';
        };
    }

    // Atribui botões de fechar
    const btnCancelar = document.getElementById('btnCancelar');
    const btnFecharX = document.querySelector('.close-modal');

    if (btnCancelar) btnCancelar.onclick = fecharModal;
    if (btnFecharX) btnFecharX.onclick = fecharModal;
});

/* ============================================================
    6. EXPORTAÇÃO PARA PDF
   ============================================================ */
async function exportarUsuariosPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Modo Paisagem

    try {
        // 1. Carrega a imagem local (ajuste o nome do arquivo para o seu)
        const logo = await carregarImagemLocal('imgs/logo-unifametro.png');
        
        // 2. Adiciona no canto superior direito (x=250, y=10, largura=30, altura=30)
        // O valor 250 posiciona bem próximo à borda direita de uma folha A4 (297mm)
        doc.addImage(logo, 'PNG', 220, 10, 60, 30);
    } catch (error) {
        console.warn("A imagem local não foi encontrada ou não pôde ser carregada.", error);
    }

    // --- Títulos e Dados (Mesma lógica anterior) ---
    doc.setFontSize(18);
    doc.setTextColor(45, 122, 80); 
    doc.text("Relatório de Grade Horária", 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
    const dataGeracao = new Date().toLocaleDateString('pt-BR');
    const user = obterUsuarioLogado();
    const nomeUsuario = user ? (user.nome || user.usuario) : "Wesley Costa"; 
    doc.text(`Gerado em: ${dataGeracao} | Usuário: ${nomeUsuario}`, 14, 22);

    const columns = ["Disciplina", "Turma", "Sala", "Dia", "Horário"];
    const rows = minhasAulas.map(aula => [
        aula.disciplina,
        aula.turma,
        aula.sala,
        aula.dia,
        aula.horario
    ]);

    doc.autoTable({
        head: [columns],
        body: rows,
        startY: 40, // Aumentamos para não sobrepor a logo
        theme: 'striped',
        headStyles: { fillColor: [45, 122, 80] },
        alternateRowStyles: { fillColor: [240, 248, 243] }
    });

    doc.save(`Grade_Horaria_${dataGeracao.replace(/\//g, '-')}.pdf`);
}

// Torna a função global para ser achada pelo 'onclick' do HTML
window.exportarUsuariosPDF = exportarUsuariosPDF;