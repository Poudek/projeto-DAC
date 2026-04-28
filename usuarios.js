// Função principal para carregar dados do servidor
async function carregarUsuariosServidor() {
    const tabelaCorpo = document.getElementById('lista-usuarios');
    
    try {
        const response = await fetch('https://projeto-agenda-production.up.railway.app/api/usuarios'); // Ajuste a porta se necessário
        const usuarios = await response.json();

        // Limpa a tabela antes de inserir novos dados
        tabelaCorpo.innerHTML = '';

        usuarios.forEach(user => {
    let classeCargo = 'tag-cargo';
    
    // Normalizamos para minúsculo para garantir que o CSS aplique corretamente
    const cargoNormalizado = user.cargo.toLowerCase();

    if (cargoNormalizado === 'administrador') classeCargo += ' admin';
    else if (cargoNormalizado === 'coordenador') classeCargo += ' coord';
    else if (cargoNormalizado === 'professor') classeCargo += ' prof';
    else if (cargoNormalizado === 'secretaria') classeCargo += ' suporte'; // Mapeando Secretaria para a cor de suporte
    else if (cargoNormalizado === 'aluno') classeCargo += ' aluno';
        
    const row = `
        <tr>
            <td><strong>${user.nome}</strong></td>
            <td>${user.email}</td>
            <td><span class="${classeCargo}">${user.cargo}</span></td>
            <td><span class="status-ativo">● Ativo</span></td>
            <td style="text-align: right;">
                <button class="btn-acao-tabela" onclick="editarCargo(${user.id})">
                    <i class="fa-solid fa-user-gear"></i>
                </button>
                <button class="btn-acao-tabela btn-delete" onclick="removerUsuario(${user.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
    tabelaCorpo.innerHTML += row;
});
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        tabelaCorpo.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--danger);">Erro ao carregar dados</td></tr>';
    };}