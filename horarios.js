// 1. Função para selecionar o dia (Visual)
function selecionarDia(diaNome, diaNumero) {
    const todosCards = document.querySelectorAll('.day-card');
    todosCards.forEach(card => card.classList.remove('active'));

    const cardClicado = event.currentTarget;
    cardClicado.classList.add('active');

    const labelDia = document.getElementById('dia-selecionado-label');
    // Ajuste dinâmico para o mês (ex: Março ou Abril baseado no dia)
    const mes = diaNumero > 25 ? 'MARÇO' : 'ABRIL'; 
    labelDia.textContent = `${diaNome.toUpperCase()}-FEIRA, ${diaNumero < 10 ? '0' + diaNumero : diaNumero} DE ${mes}`;

    // Chama a renderização passando o nome do dia e o número
    renderizarAgendaPorDia(diaNome, diaNumero);
}

// 2. Função principal para filtrar e mostrar Aulas, Reuniões e EVENTOS
function renderizarAgendaPorDia(diaSemana, diaNumero) {
    const lista = document.getElementById('lista-agenda');
    
    // --- BUSCA OS DADOS (Agora incluindo Eventos) ---
    const aulasSalvas = JSON.parse(localStorage.getItem('minhasAulas')) || [];
    const reunioesSalvas = JSON.parse(localStorage.getItem('minhasReunioes')) || [];
    const eventosSalvos = JSON.parse(localStorage.getItem('eventos_db')) || []; // <--- O banco de eventos
    
    // --- FILTRA AS AULAS (por nome do dia) ---
    const aulasFiltradas = aulasSalvas.filter(aula => 
        aula.dia.toLowerCase().includes(diaSemana.toLowerCase())
    );

    // --- FILTRA AS REUNIÕES (por número do dia) ---
    const diaFormatado = diaNumero < 10 ? '0' + diaNumero : diaNumero.toString();
    const reunioesFiltradas = reunioesSalvas.filter(reuniao => {
        const diaDaReuniao = reuniao.data.split('-')[2]; 
        return diaDaReuniao === diaFormatado && !reuniao.concluida;
    });

    // --- FILTRA OS EVENTOS (por data completa) ---
    // Como os eventos são pontuais, filtramos pela data exata de 2026
    const eventosFiltrados = eventosSalvos.filter(evento => {
        const dataPartes = evento.data.split('-'); // [2026, 04, 01]
        const diaDoEvento = dataPartes[2];
        return diaDoEvento === diaFormatado;
    });

    lista.innerHTML = ''; // Limpa a lista atual

    // Se não houver NADA, mostra mensagem
    if (aulasFiltradas.length === 0 && reunioesFiltradas.length === 0 && eventosFiltrados.length === 0) {
        lista.innerHTML = '<p style="text-align:center; color:#a0aec0; margin-top:20px;">Nenhuma atividade para este dia.</p>';
        return;
    }

    // --- RENDERIZA OS EVENTOS (Novo!) ---
    // Dentro da sua função renderizarAgendaPorDia, na parte de EVENTOS:
eventosFiltrados.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-agenda'; // Garante o card branco
    div.innerHTML = `
        <div class="item-time">
            <strong>${item.inicio}</strong>
            <span>${item.categoria || '--:--'}</span>
             
        </div>
        <div class="item-info">
            <span class="badge evento">
                <i class="fa-solid fa-calendar-check"></i> Evento: ${item.categoria}
            </span>
            <h4>${item.titulo}</h4>
            <p><i class="fa-solid fa-location-dot"></i> ${item.local}</p>
        </div>
    `;
    lista.appendChild(div);
});

    // --- RENDERIZA AS REUNIÕES ---
    reunioesFiltradas.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-agenda';
        div.innerHTML = `
            <div class="item-time">
                <strong>${item.horario}</strong>
                <span>Reunião</span>
            </div>
            <div class="item-info">
                <span class="badge reuniao"><i class="fa-solid fa-users"></i> Reunião</span>
                <h4>${item.titulo}</h4>
                <p><i class="fa-solid fa-location-dot"></i> ${item.local}</p>
            </div>
        `;
        lista.appendChild(div);
    });

    // --- RENDERIZA AS AULAS ---
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

// Inicializa a página
document.addEventListener('DOMContentLoaded', () => {
    renderizarAgendaPorDia('Quarta', 1);
});

let dataReferencia = new Date(); // Começa na data de hoje
// --- CONFIGURAÇÃO INICIAL ---
document.addEventListener('DOMContentLoaded', () => {
    atualizarSemana();
});

function atualizarSemana() {
    const diasCards = document.querySelectorAll('.day-card');
    const labelSemana = document.querySelector('.current-week');
    
    // 1. Encontrar a Segunda-feira da semana da 'dataReferencia'
    const dataAux = new Date(dataReferencia);
    const diaDaSemana = dataAux.getDay(); // 0 (Dom) a 6 (Sáb)
    const diferencaParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
    dataAux.setDate(dataAux.getDate() + diferencaParaSegunda);

    const segundaFeira = new Date(dataAux);
    const sabado = new Date(dataAux);
    sabado.setDate(segundaFeira.getDate() + 5);

    // 2. Atualizar o Texto do Cabeçalho (Ex: 30 de março — 04 de abril, 2026)
    const options = { day: '2-digit', month: 'long' };
    labelSemana.textContent = `${segundaFeira.toLocaleDateString('pt-BR', options)} — ${sabado.toLocaleDateString('pt-BR', { ...options, year: 'numeric' })}`;

    // 3. Atualizar os números nos Cards (Segunda a Sábado)
    diasCards.forEach((card, index) => {
        const dataDia = new Date(segundaFeira);
        dataDia.setDate(segundaFeira.getDate() + index);
        
        const numeroTag = card.querySelector('strong');
        const diaNome = card.querySelector('span').textContent;
        const diaNumero = dataDia.getDate();

        numeroTag.textContent = diaNumero < 10 ? `0${diaNumero}` : diaNumero;

        // Atualizar o onclick para passar a data correta
        card.setAttribute('onclick', `selecionarDia('${diaNome}', ${diaNumero})`);
        
        // Estética: Destacar se for o dia de HOJE real
        const hoje = new Date();
        if (dataDia.toDateString() === hoje.toDateString()) {
            card.classList.add('today-highlight'); // Crie essa classe no CSS se quiser
        } else {
            card.classList.remove('today-highlight');
        }
    });

    // 4. Renderizar a agenda do dia selecionado (ex: o primeiro card)
    selecionarDia('SEGUNDA', segundaFeira.getDate());
}

// --- FUNÇÕES DOS BOTÕES DE NAVEGAÇÃO ---
function proximaSemana() {
    dataReferencia.setDate(dataReferencia.getDate() + 7);
    atualizarSemana();
}

function semanaAnterior() {
    dataReferencia.setDate(dataReferencia.getDate() - 7);
    atualizarSemana();
}