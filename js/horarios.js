let dataReferencia = new Date(); 
let todasAsAulasAPI = []; 
let todosEventosAPI = []; // 1. Adicionada variável para Eventos da API

document.addEventListener('DOMContentLoaded', () => {
    const lista = document.getElementById('lista-agenda');
    if (lista) lista.innerHTML = '<p style="text-align:center; color:#a0aec0; margin-top:20px;">Carregando agenda...</p>';

    carregarDadosAPI(); // 2. Chamada unificada
});

/* ============================================================
   BUSCA UNIFICADA (AULAS + EVENTOS)
   ============================================================ */
async function carregarDadosAPI() {
    try {
        // Busca ambos simultaneamente para ganhar performance
        const [resAulas, resEventos] = await Promise.all([
            fetch(`${API_URL}/api/agenda/aulas`),
            fetch(`${API_URL}/api/eventos`) // Rota que vamos criar no server.js
        ]);

        if (resAulas.ok) todasAsAulasAPI = await resAulas.json();
        if (resEventos.ok) todosEventosAPI = await resEventos.json();

    } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
    }
    atualizarSemana(); 
}

/* ============================================================
   1. ATUALIZAÇÃO DO TEXTO DA DATA SELECIONADA
   ============================================================ */
function atualizarTextoDataDestaque(dataObjeto) {
    const elementoData = document.getElementById('data-atual-exibicao');
    if (!elementoData) return;

    const opcoes = { weekday: 'long', day: '2-digit', month: 'long' };
    let dataFormatada = dataObjeto.toLocaleDateString('pt-BR', opcoes);

    dataFormatada = dataFormatada.replace('-feira', '-FEIRA').toUpperCase();
    elementoData.innerText = dataFormatada;
}

/* ============================================================
   2. CONTROLE DA SEMANA (ESTÁVEL)
   ============================================================ */
function atualizarSemana() {
    const diasCards = document.querySelectorAll('.day-card');
    const labelSemana = document.querySelector('.current-week');
    if (!diasCards.length) return;

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

        const dataParaClique = new Date(dataDia);
        card.onclick = () => selecionarDia(card, diaNome, dataParaClique);
        
        if (dataDia.toDateString() === hojeReal.toDateString()) {
            card.classList.add('today-highlight');
            cardParaAtivar = { elemento: card, nome: diaNome, data: dataParaClique };
        } else {
            card.classList.remove('today-highlight');
        }
    });

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
   3. SELEÇÃO E FILTRAGEM (AJUSTADO PARA API)
   ============================================================ */
function selecionarDia(elemento, diaNome, dataObjeto) {
    document.querySelectorAll('.day-card').forEach(c => c.classList.remove('active'));
    elemento.classList.add('active');

    const lista = document.getElementById('lista-agenda');
    if (lista) lista.innerHTML = '';

    atualizarTextoDataDestaque(dataObjeto);
    renderizarAgendaPorDia(diaNome, dataObjeto);
}

function renderizarAgendaPorDia(diaSemana, dataObjeto) {
    const lista = document.getElementById('lista-agenda');
    if (!lista) return;

    const aulas = todasAsAulasAPI; 
    const eventos = todosEventosAPI; // 3. Agora os eventos vêm da API
    const reunioes = JSON.parse(localStorage.getItem('minhasReunioes')) || [];

    const diaStr = dataObjeto.getDate().toString().padStart(2, '0');
    const mesStr = (dataObjeto.getMonth() + 1).toString().padStart(2, '0');
    const anoStr = dataObjeto.getFullYear();
    const dataCompletaISO = `${anoStr}-${mesStr}-${diaStr}`;

    // Filtro de Aulas (Por Nome do Dia)
    const aulasFiltradas = aulas.filter(a => 
        a.dia.toLowerCase().includes(diaSemana.toLowerCase())
    );
    
    // Filtro de Eventos (Por Data Exata)
    const eventosFiltrados = eventos.filter(e => {
        // Trata a data da API (remove o T00:00:00.000Z se houver)
        const dataEvento = e.data.split('T')[0];
        return dataEvento === dataCompletaISO;
    });

    const reunioesFiltradas = reunioes.filter(r => {
        return (r.data === dataCompletaISO || r.data.includes(`${diaStr}/${mesStr}`)) && !r.concluida;
    });

    if (aulasFiltradas.length === 0 && reunioesFiltradas.length === 0 && eventosFiltrados.length === 0) {
        lista.innerHTML = '<p style="text-align:center; color:#a0aec0; margin-top:20px;">Nenhuma atividade para este dia.</p>';
        return;
    }

    // Renderização
    eventosFiltrados.forEach(item => {
        // Ajustamos os nomes das propriedades conforme o banco de dados
        criarItem(lista, item.hora_inicio, '', item.categoria, `Evento: ${item.titulo}`, item.local, 'evento', 'fa-calendar-check');
    });

    reunioesFiltradas.forEach(item => criarItem(lista, item.horario, 'Reunião', 'Reunião', item.titulo, item.local, 'reuniao', 'fa-users'));
    
    aulasFiltradas.forEach(item => {
        const horas = item.horario.includes(' - ') ? item.horario.split(' - ') : [item.horario, ''];
        criarItem(lista, horas[0], horas[1], 'Aula', `${item.disciplina} - ${item.turma}`, item.sala, 'aula', 'fa-book-open');
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