let dataReferencia = new Date(); 

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a semana e o dia atual
    atualizarSemana(); 
});

/* ============================================================
   1. ATUALIZAÇÃO DO TEXTO DA DATA SELECIONADA
   ============================================================ */
function atualizarTextoDataDestaque(dataObjeto) {
    const elementoData = document.getElementById('data-atual-exibicao');
    if (!elementoData) return;

    const opcoes = { weekday: 'long', day: '2-digit', month: 'long' };
    let dataFormatada = dataObjeto.toLocaleDateString('pt-BR', opcoes);

    // Formata para: TERÇA-FEIRA, 28 DE ABRIL
    dataFormatada = dataFormatada.replace('-feira', '-FEIRA').toUpperCase();
    elementoData.innerText = dataFormatada;
}

/* ============================================================
   2. CONTROLE DA SEMANA
   ============================================================ */
function atualizarSemana() {
    const diasCards = document.querySelectorAll('.day-card');
    const labelSemana = document.querySelector('.current-week');
    if (!diasCards.length) return;

    // Calcula a segunda-feira da semana de referência
    const dataAux = new Date(dataReferencia);
    const diaDaSemana = dataAux.getDay(); 
    const diferencaParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
    dataAux.setDate(dataAux.getDate() + diferencaParaSegunda);

    const segundaFeira = new Date(dataAux);

    if (labelSemana) {
        const options = { day: '2-digit', month: 'long' };
        const sabado = new Date(segundaFeira);
        sabado.setDate(segundaFeira.getDate() + 5);
        labelSemana.textContent = `${segundaFeira.toLocaleDateString('pt-BR', options)} — ${sabado.toLocaleDateString('pt-BR', { ...options, year: 'numeric' })}`;
    }

    let cardParaAtivar = null;
    const hojeReal = new Date();

    diasCards.forEach((card, index) => {
        const dataDia = new Date(segundaFeira);
        dataDia.setDate(segundaFeira.getDate() + index);
        
        const numeroTag = card.querySelector('strong');
        const spanTag = card.querySelector('span');
        const diaNome = spanTag ? spanTag.textContent.trim() : "Segunda";
        const diaNumero = dataDia.getDate();

        if (numeroTag) {
            numeroTag.textContent = diaNumero < 10 ? `0${diaNumero}` : diaNumero;
        }

        // Criamos uma cópia da data para o escopo do clique
        const dataParaClique = new Date(dataDia);

        // Configura o clique manual
        card.onclick = () => selecionarDia(card, diaNome, dataParaClique);
        
        // Verifica se é hoje
        if (dataDia.toDateString() === hojeReal.toDateString()) {
            card.classList.add('today-highlight');
            cardParaAtivar = { elemento: card, nome: diaNome, data: dataParaClique };
        } else {
            card.classList.remove('today-highlight');
        }
    });

    // Ativação automática ao carregar ou mudar de semana
    if (cardParaAtivar) {
        selecionarDia(cardParaAtivar.elemento, cardParaAtivar.nome, cardParaAtivar.data);
    } else if (diasCards.length > 0) {
        const dataPrimeiroCard = new Date(segundaFeira);
        selecionarDia(diasCards[0], 'Segunda', dataPrimeiroCard);
    }
}

function proximaSemana() {
    dataReferencia.setDate(dataReferencia.getDate() + 7);
    atualizarSemana();
}

function semanaAnterior() {
    dataReferencia.setDate(dataReferencia.getDate() - 7);
    atualizarSemana();
}

/* ============================================================
   3. SELEÇÃO E FILTRAGEM
   ============================================================ */
function selecionarDia(elemento, diaNome, dataObjeto) {
    // Interface
    document.querySelectorAll('.day-card').forEach(c => c.classList.remove('active'));
    elemento.classList.add('active');

    // Limpeza e Atualização
    const lista = document.getElementById('lista-agenda');
    if (lista) lista.innerHTML = '';

    atualizarTextoDataDestaque(dataObjeto);
    renderizarAgendaPorDia(diaNome, dataObjeto);
}

function renderizarAgendaPorDia(diaSemana, dataObjeto) {
    const lista = document.getElementById('lista-agenda');
    if (!lista) return;

    const aulas = JSON.parse(localStorage.getItem('minhasAulas')) || [];
    const reunioes = JSON.parse(localStorage.getItem('minhasReunioes')) || [];
    const eventos = JSON.parse(localStorage.getItem('eventos_db')) || [];

    const diaStr = dataObjeto.getDate().toString().padStart(2, '0');
    const mesStr = (dataObjeto.getMonth() + 1).toString().padStart(2, '0');
    const anoStr = dataObjeto.getFullYear();
    
    const dataCompletaISO = `${anoStr}-${mesStr}-${diaStr}`; // AAAA-MM-DD

    // Filtros
    const aulasFiltradas = aulas.filter(a => a.dia.toLowerCase().includes(diaSemana.toLowerCase()));
    
    const reunioesFiltradas = reunioes.filter(r => {
        // Aceita formatos AAAA-MM-DD ou apenas DD/MM se o ano for omitido
        return (r.data === dataCompletaISO || r.data.includes(`${diaStr}/${mesStr}`)) && !r.concluida;
    });

    const eventosFiltrados = eventos.filter(e => e.data.includes(`${mesStr}-${diaStr}`) || e.data === dataCompletaISO);

    if (aulasFiltradas.length === 0 && reunioesFiltradas.length === 0 && eventosFiltrados.length === 0) {
        lista.innerHTML = '<p style="text-align:center; color:#a0aec0; margin-top:20px;">Nenhuma atividade para este dia.</p>';
        return;
    }

    // Renderização organizada por tipo
    eventosFiltrados.forEach(item => criarItem(lista, item.inicio, item.categoria, `Evento: ${item.categoria}`, item.titulo, item.local, 'evento', 'fa-calendar-check'));
    reunioesFiltradas.forEach(item => criarItem(lista, item.horario, 'Reunião', 'Reunião', item.titulo, item.local, 'reuniao', 'fa-users'));
    aulasFiltradas.forEach(item => {
        const horas = item.horario.split(' - ');
        criarItem(lista, horas[0], horas[1] || '', 'Aula', `${item.disciplina} - ${item.turma}`, item.sala, 'aula', 'fa-book-open');
    });
}

function criarItem(container, h1, h2, badge, tit, loc, classe, icone) {
    const div = document.createElement('div');
    div.className = 'item-agenda';
    div.innerHTML = `
        <div class="item-time"><strong>${h1}</strong><span>${h2}</span></div>
        <div class="item-info">
            <span class="badge ${classe}"><i class="fa-solid ${icone}"></i> ${badge}</span>
            <h4>${tit}</h4>
            <p><i class="fa-solid fa-location-dot"></i> ${loc}</p>
        </div>`;
    container.appendChild(div);
}