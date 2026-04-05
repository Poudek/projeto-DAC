// eventos.js
function openModal() {
    const modal = document.getElementById('modalEvento');
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('modalEvento');
    modal.style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modalEvento');
    if (event.target == modal) {
        closeModal();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const eventCards = document.querySelectorAll(".event-card");

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            // 1. Remover classe 'active' de todos os botões e colocar no clicado
            filterButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const category = button.textContent.trim();

            // 2. Lógica de Filtragem
            eventCards.forEach(card => {
                const cardCategory = card.getAttribute("data-category");

                if (category === "Todas" || cardCategory === category) {
                    card.style.display = "block"; // Mostra
                } else {
                    card.style.display = "none";  // Esconde
                }
            });
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    renderizarEventos(); // Carrega o que já existe ao abrir a página
});

const form = document.querySelector('.modal-form');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Capturando os valores do modal (ajuste os IDs se necessário)
    const novoEvento = {
        id: Date.now(), // ID único para exclusão
        titulo: document.querySelector('.input-highlight').value,
        data: document.querySelector('input[type="date"]').value,
        categoria: document.querySelector('select').value,
        inicio: document.querySelectorAll('input[type="time"]')[0].value,
        fim: document.querySelectorAll('input[type="time"]')[1].value,
        local: document.querySelector('input[placeholder="Ex: Auditório"]').value,
        descricao: document.querySelector('textarea').value
    };

    salvarEvento(novoEvento);
    form.reset();
    closeModal();
    renderizarEventos();
});

function salvarEvento(evento) {
    const eventos = JSON.parse(localStorage.getItem('eventos_db')) || [];
    eventos.push(evento);
    localStorage.setItem('eventos_db', JSON.stringify(eventos));
}

function renderizarEventos() {
    const grid = document.querySelector('.events-grid');
    const eventos = JSON.parse(localStorage.getItem('eventos_db')) || [];
    
    // Limpa a grid (mantendo apenas o que é estático se você quiser, ou limpa tudo)
    grid.innerHTML = '';

    eventos.forEach(ev => {
        const card = `
            <article class="event-card" data-category="${ev.categoria}">
                <div class="card-header">
                    <span class="tag ${ev.categoria.toLowerCase()}"><i class="fas fa-tag"></i> ${ev.categoria}</span>
                    <button class="delete-btn" onclick="removerEvento(${ev.id})"><i class="far fa-trash-alt"></i></button>
                </div>
                <h3 class="event-title">${ev.titulo}</h3>
                <div class="event-info">
                    <p><i class="far fa-calendar"></i> ${formatarData(ev.data)}</p>
                    <p><i class="far fa-clock"></i> ${ev.inicio} - ${ev.fim}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${ev.local}</p>
                </div>
                <hr>
                <p class="event-description">${ev.descricao}</p>
            </article>
        `;
        grid.innerHTML += card;
    });
}

function removerEvento(id) {
    let eventos = JSON.parse(localStorage.getItem('eventos_db')) || [];
    eventos = eventos.filter(ev => ev.id !== id);
    localStorage.setItem('eventos_db', JSON.stringify(eventos));
    renderizarEventos();
}

// Auxiliar para deixar a data bonitinha (DD/MM/AAAA)
function formatarData(data) {
    if(!data) return "";
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function filtrar(categoria, botaoClicado) {
    // 1. Gerenciar a aparência dos botões
    const botoes = document.querySelectorAll('.filter-btn');
    botoes.forEach(btn => btn.classList.remove('active'));
    botaoClicado.classList.add('active');

    // 2. Filtrar os cards
    const cards = document.querySelectorAll('.event-card');
    
    cards.forEach(card => {
        // Pega a categoria que salvamos no atributo data-category do card
        const categoriaCard = card.getAttribute('data-category');

        if (categoria === 'Todas' || categoriaCard === categoria) {
            card.style.display = 'block'; // Mostra
        } else {
            card.style.display = 'none';  // Esconde
        }
    });
}