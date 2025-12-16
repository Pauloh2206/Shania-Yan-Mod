import fs from 'fs';
import path from 'path';

// 🚨 CAMINHO DO ARQUIVO DE CONFIGURAÇÃO 🚨
// Baseado no seu log, o caminho é resolvido a partir do diretório raiz do bot.
const GLOBAL_CONFIG_PATH = path.join(path.resolve(process.cwd()), 'dados', 'src', 'config.json'); 

function readGlobalConfig() {
    if (!fs.existsSync(GLOBAL_CONFIG_PATH)) {
        // Lança um erro se o config.json não for encontrado
        throw new Error(`Arquivo de configuração global (config.json) não encontrado em: ${GLOBAL_CONFIG_PATH}`);
    }
    return JSON.parse(fs.readFileSync(GLOBAL_CONFIG_PATH, 'utf-8'));
}

function writeGlobalConfig(data) {
    fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Define o estado de manutenção global no config.json.
 * O bot deve ler essa chave para bloquear comandos (exceto para o Dono).
 * @param {boolean} status - true para Ativar, false para Desativar.
 */
export async function setMaintenanceStatus(status) {
    try {
        const config = readGlobalConfig();
        
        // Garante que a chave 'maintenanceMode' exista e define o status
        config.maintenanceMode = !!status;

        writeGlobalConfig(config);

        return { success: true, message: `Status de manutenção atualizado para: ${status ? 'ATIVO' : 'INATIVO'}.` };
    } catch (e) {
        console.error("Erro ao definir status de manutenção:", e);
        return { success: false, message: `❌ Erro ao salvar status de manutenção: ${e.message}` };
    }
}

// ⚠️ NOTA: Se você ainda usa as funções addOwner e removeOwner, 
// você deve adicioná-las aqui também, usando a lógica de dono único.
// Caso contrário, este arquivo está pronto.

// Exemplo de como ficaria a função addOwner se você tivesse mantido ela:
/*
export async function addOwner(newLidOwner, newNumeroDono, newNomeDono) {
    // ... Implementação de dono ÚNICO (apenas substituição) ...
}
*/