function carregarAgenda() {
    const lista = document.getElementById('lista-agenda');
    // Puxa as aulas do localStorage (ou usa as fixas se estiver vazio)
    const aulasSalvas = JSON.parse(localStorage.getItem('minhasAulas')) || [];
    
    lista.innerHTML = '';

    aulasSalvas.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-agenda';
        
        // Separando Início e Fim (ex: "08:00 - 09:40")
        const [inicio, fim] = item.horario.split(' - ');

        div.innerHTML = `
            <div class="item-time">
                <strong>${inicio}</strong>
                <span>${fim}</span>
            </div>
            <div class="item-info">
                <div class="badge aula"><i class="fa-solid fa-book-open"></i> Aula</div>
                <h4>${item.disciplina} - ${item.turma}</h4>
                <p style="color: #a0aec0; font-size: 0.9rem;">${item.sala}</p>
            </div>
        `;
        lista.appendChild(div);
    });
}

document.addEventListener('DOMContentLoaded', carregarAgenda);

// 1. Função para selecionar o dia
function selecionarDia(diaNome, diaNumero) {
    // A) Remover a classe 'active' de todos os cards
    const todosCards = document.querySelectorAll('.day-card');
    todosCards.forEach(card => card.classList.remove('active'));

    // B) Adicionar a classe 'active' no card que foi clicado
    // Vamos procurar o card pelo número ou pelo evento de clique
    const cardClicado = event.currentTarget;
    cardClicado.classList.add('active');

    // C) Atualizar o título da agenda (Ex: QUARTA-FEIRA, 01 DE ABRIL)
    // Para simplificar, vamos apenas mudar o texto do label
    const labelDia = document.getElementById('dia-selecionado-label');
    labelDia.textContent = `${diaNome}-FEIRA, ${diaNumero < 10 ? '0' + diaNumero : diaNumero} DE ABRIL`;

    // D) Filtrar as aulas
    renderizarAgendaPorDia(diaNome);
}

// 2. Função para filtrar e mostrar apenas as aulas do dia selecionado
function renderizarAgendaPorDia(diaSemana) {
    const lista = document.getElementById('lista-agenda');
    
    // Puxamos as aulas que foram salvas no localStorage (da página de Aulas)
    const aulasSalvas = JSON.parse(localStorage.getItem('minhasAulas')) || [];
    
    // Filtramos o array: apenas aulas onde aula.dia seja igual ao dia clicado
    // Nota: Ajusta 'Segunda', 'Terça' conforme gravaste no select de aulas
    const aulasFiltradas = aulasSalvas.filter(aula => 
        aula.dia.toLowerCase().includes(diaSemana.toLowerCase())
    );

    lista.innerHTML = ''; // Limpa a lista atual

    if (aulasFiltradas.length === 0) {
        lista.innerHTML = '<p style="text-align:center; color:#a0aec0; margin-top:20px;">Nenhuma atividade para este dia.</p>';
        return;
    }

    // Renderiza os cards das aulas filtradas
    aulasFiltradas.forEach(item => {
        const [inicio, fim] = item.horario.split(' - ');
        
        const div = document.createElement('div');
        div.className = 'item-agenda';
        div.innerHTML = `
            <div class="item-time">
                <strong>${inicio}</strong>
                <span>${fim}</span>
            </div>
            <div class="item-info">
                <span class="badge aula"><i class="fa-solid fa-book-open"></i> Aula</span>
                <h4>${item.disciplina} - ${item.turma}</h4>
                <p>${item.sala}</p>
            </div>
        `;
        lista.appendChild(div);
    });
}

// Inicializa a página mostrando a Quarta-feira (ou o dia atual)
document.addEventListener('DOMContentLoaded', () => {
    renderizarAgendaPorDia('Quarta');
});