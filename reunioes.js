// --- CONTROLE DO MODAL ---
function abrirModal() {
    const modal = document.getElementById('modalNovaReuniao');
    if (modal) modal.style.display = 'flex';
}

function fecharModal() {
    const modal = document.getElementById('modalNovaReuniao');
    if (modal) modal.style.display = 'none';
}

// Fechar ao clicar fora do modal
window.onclick = function(event) {
    const modal = document.getElementById('modalNovaReuniao');
    if (event.target == modal) fecharModal();
}

// --- SALVAMENTO NO LOCALSTORAGE ---
const form = document.getElementById('formNovaReuniao');

if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Evita recarregar a página antes de salvar

        // Capturar os valores usando os IDs que adicionamos no HTML
        const novaReuniao = {
            id: Date.now(),
            titulo: document.getElementById('reuniaoTitulo').value,
            data: document.getElementById('reuniaoData').value,
            horario: document.getElementById('reuniaoHora').value,
            local: document.getElementById('reuniaoLocal').value,
            participantes: document.getElementById('reuniaoParticipantes').value,
            pauta: document.getElementById('reuniaoPauta').value,
            tipo: 'reuniao'
        };

        // 1. Puxa a lista do localStorage ou cria uma nova
        const reunioesSalvas = JSON.parse(localStorage.getItem('minhasReunioes')) || [];

        // 2. Adiciona a nova
        reunioesSalvas.push(novaReuniao);

        // 3. Salva de volta
        localStorage.setItem('minhasReunioes', JSON.stringify(reunioesSalvas));

        alert('Reunião salva com sucesso!');
        
        form.reset(); // Limpa os campos
        fecharModal();
        renderizarReunioes();
        // Recarrega para atualizar a tela (ou chame a função de renderizar se já tiver uma)
        window.location.reload();
    });
}
// --- FUNÇÃO PARA MOSTRAR AS REUNIÕES NA TELA ---
function renderizarReunioes() {
    const grid = document.getElementById('gridReunioes');
    const reunioesSalvas = JSON.parse(localStorage.getItem('minhasReunioes')) || [];

    // Limpa o grid para não duplicar
    grid.innerHTML = '';

    if (reunioesSalvas.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Nenhuma reunião agendada.</p>';
        return;
    }

    reunioesSalvas.forEach((reuniao, index) => {
        const dataBR = reuniao.data.split('-').reverse().join('/');
        
        // Verifica o estado para definir as classes e textos
        const estaConcluida = reuniao.concluida === true;
        const statusTexto = estaConcluida ? 'Concluída' : 'Agendada';
        const statusClasse = estaConcluida ? 'badge-concluida' : 'badge-agendada';
        const botaoTexto = estaConcluida ? 'Reabrir' : 'Marcar como concluída';
        const cardClasse = estaConcluida ? 'card card-concluded' : 'card';

        const cardHTML = `
            <div class="${cardClasse}" id="reuniao-${index}">
                <div class="card-header">
                    <span class="badge ${statusClasse}">${statusTexto}</span>
                    <button class="btn-delete" onclick="excluirReuniao(${index})">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
                <h3 class="meeting-title">${reuniao.titulo}</h3>
                <div class="meeting-info">
                    <p><i class="fa-regular fa-calendar"></i> ${dataBR}</p>
                    <p><i class="fa-regular fa-clock"></i> ${reuniao.horario}</p>
                    <p><i class="fa-solid fa-location-dot"></i> ${reuniao.local}</p>
                    <p><i class="fa-solid fa-users"></i> ${reuniao.participantes}</p>
                </div>
                <div class="pauta">
                    <label>Pauta</label>
                    <p>${reuniao.pauta || 'Sem pauta definida.'}</p>
                </div>
                <button class="btn-action" onclick="alternarStatusReuniao(${index})">
                    ${botaoTexto}
                </button>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });
}

// --- FUNÇÃO PARA EXCLUIR ---
function excluirReuniao(index) {
    let reunioes = JSON.parse(localStorage.getItem('minhasReunioes')) || [];
    reunioes.splice(index, 1); // Remove o item pelo índice
    localStorage.setItem('minhasReunioes', JSON.stringify(reunioes));
    renderizarReunioes(); // Atualiza a tela
}

// --- EXECUTAR AO CARREGAR A PÁGINA ---
document.addEventListener('DOMContentLoaded', renderizarReunioes);

function alternarStatusReuniao(index) {
    let reunioes = JSON.parse(localStorage.getItem('minhasReunioes')) || [];
    
    // Inverte o status: se era true vira false, se era undefined/false vira true
    reunioes[index].concluida = !reunioes[index].concluida;
    
    // Salva a alteração
    localStorage.setItem('minhasReunioes', JSON.stringify(reunioes));
    
    // Atualiza a visualização
    renderizarReunioes();
}