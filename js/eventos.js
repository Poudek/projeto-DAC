const API_URL = "https://projeto-dac-production.up.railway.app";
let listaEventos = [];
let eventoIdEmEdicao = null; // 1. Movido para o topo para ser global e acessível

document.addEventListener('DOMContentLoaded', () => {
    carregarEventos();
});

// --- BUSCAR EVENTOS DO BANCO ---
async function carregarEventos() {
    const grid = document.querySelector('.events-grid');
    if (grid) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:#a0aec0;">Sincronizando com o banco...</p>';
    }

    try {
        const response = await fetch(`${API_URL}/api/eventos`);
        if (response.ok) {
            listaEventos = await response.json();
            renderizarEventos(listaEventos);
        }
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        if (grid) grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:red;">Erro ao carregar dados.</p>';
    }
}

// --- RENDERIZAR CARDS NA TELA (COM BOTÃO EDITAR) ---
function renderizarEventos(eventos) {
    const grid = document.querySelector('.events-grid');
    if (!grid) return;
    grid.innerHTML = '';

    eventos.forEach(evento => {
        const dataFmt = new Date(evento.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        const categoriaClasse = evento.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const card = `
            <article class="event-card" data-category="${evento.categoria}">
                <div class="card-header">
                    <span class="tag ${categoriaClasse}"><i class="fas fa-tag"></i> ${evento.categoria}</span>
                    <div class="card-actions">
                        <button class="edit-btn" onclick="editarEvento(${evento.id})"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" onclick="deletarEvento(${evento.id})"><i class="far fa-trash-alt"></i></button>
                    </div>
                </div>
                <h3 class="event-title">${evento.titulo}</h3>
                <div class="event-info">
                    <p><i class="far fa-calendar"></i> ${dataFmt}</p>
                    <p><i class="far fa-clock"></i> ${evento.hora_inicio.substring(0,5)}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${evento.local}</p>
                </div>
                <hr>
                <p class="event-description">${evento.descricao || 'Sem descrição.'}</p>
            </article>
        `;
        grid.innerHTML += card;
    });
}

// --- FUNÇÃO SALVAR ÚNICA (UNIFICA NOVO E EDIÇÃO) ---
window.salvarEvento = async function(e) {
    if (e) e.preventDefault();
    
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    const dados = {
        titulo: document.getElementById('tituloEvento').value,
        data: document.getElementById('dataEvento').value,
        categoria: document.getElementById('categoriaEvento').value,
        hora_inicio: document.getElementById('horaInicioEvento').value,
        local: document.getElementById('localEvento').value,
        descricao: document.getElementById('descricaoEvento').value || "",
        usuario_id: usuarioLogado ? usuarioLogado.id : null
    };

    // 2. Lógica de URL e Método baseada no ID de edição
    const url = eventoIdEmEdicao ? `${API_URL}/api/eventos/${eventoIdEmEdicao}` : `${API_URL}/api/eventos`;
    const metodo = eventoIdEmEdicao ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            alert(eventoIdEmEdicao ? "✅ Evento atualizado!" : "✅ Evento criado!");
            eventoIdEmEdicao = null; 
            closeModal();
            carregarEventos();
        }
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }
}; // 3. Fechamento correto da função salvarEvento

// --- EXCLUIR EVENTO (GLOBAL) ---
window.deletarEvento = async function(id) {
    if (!confirm("⚠️ Tem certeza que deseja excluir este evento?")) return;

    try {
        const response = await fetch(`${API_URL}/api/eventos/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert("🗑️ Evento removido!");
            carregarEventos();
        }
    } catch (error) {
        console.error("Erro ao deletar:", error);
    }
};

// --- PREPARAR EDIÇÃO ---
window.editarEvento = function(id) {
    const evento = listaEventos.find(e => e.id === id);
    if (!evento) return;

    eventoIdEmEdicao = id; 

    document.getElementById('tituloEvento').value = evento.titulo;
    document.getElementById('dataEvento').value = evento.data.split('T')[0];
    document.getElementById('categoriaEvento').value = evento.categoria;
    document.getElementById('horaInicioEvento').value = evento.hora_inicio;
    document.getElementById('localEvento').value = evento.local;
    document.getElementById('descricaoEvento').value = evento.descricao;

    const tituloModal = document.querySelector('#modalEvento h2');
    if (tituloModal) tituloModal.innerText = "Alterar Evento";
    
    openModal();
};

// --- FILTROS ---
window.filtrar = function(categoria, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (categoria === 'Todas') {
        renderizarEventos(listaEventos);
    } else {
        const filtrados = listaEventos.filter(e => e.categoria === categoria);
        renderizarEventos(filtrados);
    }
};

// --- CONTROLE DO MODAL ---
window.openModal = () => {
    const modal = document.getElementById('modalEvento');
    if (modal) modal.style.display = 'flex';
};

window.closeModal = () => {
    const modal = document.getElementById('modalEvento');
    const form = document.getElementById('formEvento');
    const tituloModal = document.querySelector('#modalEvento h2');

    if (modal) modal.style.display = 'none';
    if (form) form.reset();
    if (tituloModal) tituloModal.innerText = "Novo Evento"; // Reseta o título ao fechar
    eventoIdEmEdicao = null; // Limpa o ID para o próximo não ser uma edição por engano
};