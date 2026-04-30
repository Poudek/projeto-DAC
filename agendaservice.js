// agendaService.js

const AgendaService = {
    // 1. Puxa o ID do Wesley diretamente do que vimos no print
    obterIdUsuarioLogado: () => {
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            const objetoUsuario = JSON.parse(usuario);
            return objetoUsuario.id; // Retorna o ID 1, no seu caso
        }
        return null;
    },

    // 2. A lógica para salvar a Aula Teórica (Tipo 1)
    cadastrarAula: async (dadosDaAula) => {
        const idUsuario = AgendaService.obterIdUsuarioLogado();

        if (!idUsuario) {
            console.error("Usuário não está logado!");
            return;
        }

        // Montamos o objeto final exatamente como o banco espera
        const novaAula = {
            titulo: dadosDaAula.titulo,
            descricao: dadosDaAula.descricao,
            dataHora: dadosDaAula.dataHora,
            idUsuario: idUsuario,
            idTipo: 1 // Conforme você explicou, 1 é "Aula Teórica" na tbAgendaTipo
        };

        console.log("Enviando aula para o banco de dados...", novaAula);
        
        // Aqui você faria o fetch para o seu backend (PHP, Node, etc.)
        // return await fetch('sua_api/agenda', { method: 'POST', body: JSON.stringify(novaAula) });
    }
};