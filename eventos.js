const API_URL = "https://projeto-dac-production.up.railway.app";
let listaEventos = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarEventos();
});

// --- BUSCAR EVENTOS DO BANCO ---
async function carregarEventos() {
    try {
        const response = await fetch(`${API_URL}/api/eventos`);
        if (response.ok) {
            listaEventos = await response.json();
            renderizarEventos(listaEventos);
        }
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
    }
}

// --- RENDERIZAR CARDS NA TELA ---
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
                    <button class="delete-btn" onclick="deletarEvento(${evento.id})"><i class="far fa-trash-alt"></i></button>
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

// --- SALVAR NOVO EVENTO (COM CORREÇÃO DE MAPEAMENTO) ---
window.salvarEvento = async function(e) {
    if (e) e.preventDefault();
    console.log("🚀 Iniciando salvamento...");

    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    // Captura dos valores do HTML
    const inputTitulo = document.getElementById('tituloEvento');
    const inputData   = document.getElementById('dataEvento');
    const inputCat    = document.getElementById('categoriaEvento');
    const inputHora   = document.getElementById('horaInicioEvento'); // ID do HTML
    const inputLocal  = document.getElementById('localEvento');
    const inputDesc   = document.getElementById('descricaoEvento');

    // Montagem do objeto JSON
    const dados = {
        titulo: inputTitulo.value,
        data: inputData.value,
        categoria: inputCat.value,
        
        // CHAVE QUE VAI PARA O SERVIDOR:
        hora_inicio: inputHora.value, 
        
        local: inputLocal.value,
        descricao: inputDesc ? inputDesc.value : "",
        
        // Agora usamos o usuario_id que você confirmou existir
        usuario_id: usuarioLogado ? usuarioLogado.id : null
    };

    console.log("Dados que serão enviados:", dados);

    try {
        const response = await fetch(`${API_URL}/api/eventos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            alert("✅ Evento salvo no banco e sincronizado!");
            localStorage.removeItem('eventos_db'); // Limpa o "fantasma" do localStorage
            closeModal();
            carregarEventos(); // Atualiza a lista na tela de eventos
        } else {
            const erro = await response.json();
            alert("❌ Erro ao salvar: " + (erro.error || "Verifique o console"));
            console.error("Erro detalhado da API:", erro);
        }
    } catch (error) {
        console.error("❌ Erro de conexão:", error);
        alert("Erro ao conectar com a Railway.");
    }
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
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
};