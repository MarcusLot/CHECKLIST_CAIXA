// Variáveis globais
let boxes = {}; // Estrutura: {1: [{codigo, qt, unit, nome}, ...], 2: [...], ...}
let currentEditingItem = null;

// Funções de salvamento local
function saveToLocalStorage() {
    try {
        localStorage.setItem('checklistBoxes', JSON.stringify(boxes));
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('checklistBoxes');
        if (savedData) {
            boxes = JSON.parse(savedData);
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        boxes = {};
    }
}

// Elementos DOM
const addCardBtn = document.getElementById('addCardBtn');
const itemModal = document.getElementById('itemModal');
const closeModal = document.querySelector('.close');
const itemForm = document.getElementById('itemForm');
const cardsContainer = document.getElementById('cardsContainer');
const printBtn = document.getElementById('printBtn');
const storeSelect = document.getElementById('store');

// Campos do formulário
const caixaInput = document.getElementById('caixa');
const codigoInput = document.getElementById('codigo');
const qtInput = document.getElementById('qt');
const unitInput = document.getElementById('unit');
const nomeInput = document.getElementById('nome');
const deleteBtn = document.getElementById('deleteBtn');
const viewBoxBtn = document.getElementById('viewBoxBtn');

// Função para limpar todas as caixas
function clearAllBoxes() {
    showConfirm('Tem certeza que deseja limpar todas as caixas? Esta ação não pode ser desfeita.', () => {
        boxes = {};
        saveToLocalStorage();
        renderBoxes();
        updatePrintButtonState();
        showToast('Todas as caixas foram removidas com sucesso!', 'success');
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Event listeners para botões principais
    addCardBtn.addEventListener('click', openAddModal);
    closeModal.addEventListener('click', closeAddModal);
    printBtn.addEventListener('click', printChecklist);
    
    // Event listener para formulário
    itemForm.addEventListener('submit', handleFormSubmit);
    
    // Event listener para busca automática de nome
    codigoInput.addEventListener('input', handleCodigoChange);
    
    // Event listener para botão de visualizar caixa
    viewBoxBtn.addEventListener('click', viewCurrentBox);
    
    // Event listener para mudança no campo caixa
    caixaInput.addEventListener('input', updateViewBoxButton);
    
    // Event listeners para backup
    document.getElementById('saveBackupBtn').addEventListener('click', saveBackup);
    document.getElementById('loadBackupBtn').addEventListener('click', () => {
        document.getElementById('loadBackupInput').click();
    });
    document.getElementById('loadBackupInput').addEventListener('change', loadBackup);
    
    // Event listener para fechar modal clicando fora
    window.addEventListener('click', function(event) {
        if (event.target === itemModal) {
            closeAddModal();
        }
    });
    
    // Event listener para o botão de limpar tudo
    document.getElementById('clearAllBtn').addEventListener('click', clearAllBoxes);
    
    // Event listener para o campo de código
    codigoInput.addEventListener('change', handleCodigoChange);
    
    // Event listener para o botão de visualização
    document.getElementById('previewBtn').addEventListener('click', function() {
        const printWindow = window.open('', '_blank');
        const htmlContent = generatePrintContent();
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pré-visualização - Checklist de Itens</title>
                <meta charset="UTF-8">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px;
                        max-width: 1000px;
                        margin: 0 auto;
                    }
                    .print-header { 
                        text-align: center; 
                        margin-bottom: 20px;
                    }
                    .print-header h1 { 
                        font-size: 24px; 
                        margin: 0 0 10px 0; 
                        color: #333;
                    }
                    .print-info {
                        margin: 10px 0 20px;
                        text-align: center;
                        font-size: 14px;
                    }
                    .print-box { 
                        margin-bottom: 30px;
                        page-break-inside: avoid;
                    }
                    .print-box h3 {
                        background: #f5f5f5;
                        padding: 10px;
                        margin: 0 0 10px 0;
                        font-size: 16px;
                        border-left: 4px solid #667eea;
                        font-weight: bold;
                    }
                    .print-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .item-quantity {
                        margin-left: 20px;
                        white-space: nowrap;
                        color: #555;
                    }
                    .actions {
                        margin-top: 30px;
                        text-align: center;
                    }
                    .print-button {
                        background: #4a90e2;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 0 10px;
                    }
                    .print-button:hover {
                        background: #357abd;
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>Pré-visualização do Checklist</h1>
                    <div class="print-info">
                        <p>Esta é uma pré-visualização de como ficará o documento impresso.</p>
                    </div>
                </div>
                ${htmlContent}
                <div class="actions">
                    <button onclick="window.print()" class="print-button">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                    <button onclick="window.close()" class="print-button" style="background: #6c757d;">
                        <i class="fas fa-times"></i> Fechar
                    </button>
                </div>
            </body>
            </html>
        `);
        
        previewWindow.document.close();
    });

    // Event listener para o botão de imprimir
    document.getElementById('printBtn').addEventListener('click', printChecklist);
    
    // Carregar dados salvos e renderizar estado inicial
    loadFromLocalStorage();
    renderBoxes();
    updatePrintButtonState();
}

function openAddModal() {
    currentEditingItem = null;
    resetForm();
    
    // Auto-sugerir próximo número de caixa
    const nextBoxNumber = getNextBoxNumber();
    caixaInput.value = nextBoxNumber;
    
    deleteBtn.style.display = 'none';
    itemModal.style.display = 'block';
    updateViewBoxButton();
    codigoInput.focus();
}

function openEditModal(boxNumber, itemIndex) {
    currentEditingItem = { boxNumber, itemIndex };
    const item = boxes[boxNumber][itemIndex];
    
    // Preencher formulário com dados do item
    caixaInput.value = boxNumber;
    codigoInput.value = item.codigo;
    qtInput.value = item.qt;
    unitInput.value = item.unit || '';
    nomeInput.value = item.nome;
    
    deleteBtn.style.display = 'inline-flex';
    itemModal.style.display = 'block';
    updateViewBoxButton();
    caixaInput.focus();
}

function closeAddModal() {
    itemModal.style.display = 'none';
    resetForm();
    currentEditingItem = null;
    updateViewBoxButton();
}

function resetForm() {
    const currentCaixa = caixaInput.value; // Salvar valor da caixa
    itemForm.reset();
    nomeInput.value = '';
    caixaInput.value = currentCaixa; // Restaurar valor da caixa
    unitInput.value = 'BOX'; // Garantir que BOX seja sempre selecionado
}

function resetItemFields() {
    // Limpar apenas campos de item, manter caixa
    codigoInput.value = '';
    qtInput.value = '';
    unitInput.value = 'BOX'; // Garantir que BOX seja sempre selecionado
    nomeInput.value = '';
}

function getNextBoxNumber() {
    const boxNumbers = Object.keys(boxes).map(num => parseInt(num));
    if (boxNumbers.length === 0) {
        return 1;
    }
    return Math.max(...boxNumbers) + 1;
}

function updateViewBoxButton() {
    const boxNumber = parseInt(caixaInput.value);
    const hasItems = boxes[boxNumber] && boxes[boxNumber].length > 0;
    
    viewBoxBtn.disabled = !hasItems;
    
    if (hasItems) {
        viewBoxBtn.title = `Ver ${boxes[boxNumber].length} item(s) da caixa ${boxNumber}`;
    } else {
        viewBoxBtn.title = 'Nenhum item nesta caixa ainda';
    }
}

function viewCurrentBox() {
    const boxNumber = parseInt(caixaInput.value);
    if (boxes[boxNumber] && boxes[boxNumber].length > 0) {
        const items = boxes[boxNumber];
        
        // Atualizar título
        document.getElementById('viewBoxTitle').textContent = `CAIXA ${boxNumber} (${items.length} item${items.length !== 1 ? 's' : ''})`;
        
        // Gerar conteúdo dos itens
        const content = items.map((item, index) => `
            <div class="view-box-item">
                <div class="print-item">
                    <div class="item-info">${item.codigo} - ${item.nome}</div>
                    <div class="item-quantity" style="text-align: right;">QT: ${item.qt}${item.unit ? ' | ' + item.unit : ''}</div>
                </div>
                <div class="view-box-item-name">${item.nome || 'Nome não encontrado'}</div>
            </div>
            <hr>
        `).join('');
        
        document.getElementById('viewBoxContent').innerHTML = content;
        document.getElementById('customViewBox').style.display = 'block';
    }
}

function handleCodigoChange() {
    const codigo = codigoInput.value.trim();
    if (codigo) {
        const nome = window.productDB.getProductName(codigo);
        nomeInput.value = nome;
        
        // Adicionar efeito visual se produto foi encontrado
        if (nome) {
            nomeInput.style.backgroundColor = '#f0fff4';
            nomeInput.style.borderColor = '#48bb78';
        } else {
            nomeInput.style.backgroundColor = '#fff5f5';
            nomeInput.style.borderColor = '#e53e3e';
        }
        
        // Resetar cores após 2 segundos
        setTimeout(() => {
            nomeInput.style.backgroundColor = '#f7fafc';
            nomeInput.style.borderColor = '#e2e8f0';
        }, 2000);
    } else {
        nomeInput.value = '';
        nomeInput.style.backgroundColor = '#f7fafc';
        nomeInput.style.borderColor = '#e2e8f0';
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(itemForm);
    const boxNumber = parseInt(formData.get('caixa'));
    const newItem = {
        codigo: formData.get('codigo').trim(),
        qt: parseInt(formData.get('qt')),
        unit: formData.get('unit'),
        nome: nomeInput.value.trim()
    };
    
    // Validações
    if (!boxNumber || boxNumber < 1) {
        showAlert('Número da caixa é obrigatório!', 'error');
        return;
    }
    
    if (!newItem.codigo) {
        showAlert('Código é obrigatório!', 'error');
        return;
    }
    
    if (!newItem.qt || newItem.qt < 1) {
        showAlert('Quantidade deve ser maior que 0!', 'error');
        return;
    }
    
    // Verificar se código já existe na mesma caixa (apenas para novos itens)
    if (!currentEditingItem) {
        if (boxes[boxNumber]) {
            const existingItem = boxes[boxNumber].find(item => item.codigo === newItem.codigo);
            if (existingItem) {
                showAlert('Código já existe nesta caixa! Use um código diferente.', 'error');
                return;
            }
        }
    }
    
    // Adicionar ou editar item
    if (!currentEditingItem) {
        // Novo item
        if (!boxes[boxNumber]) {
            boxes[boxNumber] = [];
        }
        boxes[boxNumber].push(newItem);
        saveToLocalStorage();
        showAlert('Item adicionado com sucesso!', 'success');
        
        // Limpar apenas campos de item, manter caixa para adicionar mais itens
        resetItemFields();
        updateViewBoxButton();
        codigoInput.focus();
    } else {
        // Editar item existente
        const oldBoxNumber = currentEditingItem.boxNumber;
        const itemIndex = currentEditingItem.itemIndex;
        
        // Se mudou de caixa, remover da caixa antiga e adicionar na nova
        if (oldBoxNumber !== boxNumber) {
            boxes[oldBoxNumber].splice(itemIndex, 1);
            if (boxes[oldBoxNumber].length === 0) {
                delete boxes[oldBoxNumber];
            }
            if (!boxes[boxNumber]) {
                boxes[boxNumber] = [];
            }
            boxes[boxNumber].push(newItem);
        } else {
            // Mesma caixa, apenas atualizar
            boxes[boxNumber][itemIndex] = newItem;
        }
        saveToLocalStorage();
        showAlert('Item atualizado com sucesso!', 'success');
        closeAddModal();
    }
    
    renderBoxes();
    updatePrintButtonState();
}

function deleteCurrentItem() {
    if (currentEditingItem) {
        showConfirm('Tem certeza que deseja excluir este item?', () => {
            const { boxNumber, itemIndex } = currentEditingItem;
            boxes[boxNumber].splice(itemIndex, 1);
            if (boxes[boxNumber].length === 0) {
                delete boxes[boxNumber];
            }
            saveToLocalStorage();
            renderBoxes();
            updatePrintButtonState();
            closeAddModal();
            showAlert('Item excluído com sucesso!', 'success');
        });
    }
}

function deleteItem(boxNumber, itemIndex) {
    showConfirm('Tem certeza que deseja excluir este item?', () => {
        boxes[boxNumber].splice(itemIndex, 1);
        if (boxes[boxNumber].length === 0) {
            delete boxes[boxNumber];
        }
        saveToLocalStorage();
        renderBoxes();
        updatePrintButtonState();
        showAlert('Item excluído com sucesso!', 'success');
    });
}

function deleteBox(boxNumber) {
    const boxItems = boxes[boxNumber];
    const itemCount = boxItems ? boxItems.length : 0;
    
    showConfirm(`Tem certeza que deseja excluir a CAIXA ${boxNumber} com ${itemCount} item${itemCount !== 1 ? 's' : ''}?`, () => {
        delete boxes[boxNumber];
        saveToLocalStorage();
        renderBoxes();
        updatePrintButtonState();
        showAlert(`Caixa ${boxNumber} excluída com sucesso!`, 'success');
    });
}

function editBox(boxNumber) {
    currentEditingItem = null;
    resetForm();
    
    // Preencher campo CAIXA com o número da caixa selecionada
    caixaInput.value = boxNumber;
    
    deleteBtn.style.display = 'none';
    itemModal.style.display = 'block';
    updateViewBoxButton();
    codigoInput.focus();
}

// Funções de backup
function saveBackup() {
    if (Object.keys(boxes).length === 0) {
        showAlert('Nenhuma caixa para salvar!', 'warning');
        return;
    }
    
    const backupData = {
        boxes: boxes,
        store: storeSelect.value,
        timestamp: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const storeName = storeSelect.value || 'SemLoja';
    
    link.download = `Checklist_${storeName}_${dateStr}_${timeStr}.json`;
    link.click();
    
    showAlert('Backup salvo com sucesso!', 'success');
}

function loadBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            
            if (!backupData.boxes) {
                showAlert('Arquivo de backup inválido!', 'error');
                return;
            }
            
            showConfirm('Carregar backup irá substituir todos os dados atuais. Continuar?', () => {
                boxes = backupData.boxes;
                
                if (backupData.store) {
                    storeSelect.value = backupData.store;
                }
                
                saveToLocalStorage();
                renderBoxes();
                updatePrintButtonState();
                
                const boxCount = Object.keys(boxes).length;
                showAlert(`Backup carregado! ${boxCount} caixa${boxCount !== 1 ? 's' : ''} restaurada${boxCount !== 1 ? 's' : ''}.`, 'success');
            });
            
        } catch (error) {
            showAlert('Erro ao ler arquivo de backup!', 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Limpar input para permitir recarregar o mesmo arquivo
}

function renderBoxes() {
    const boxNumbers = Object.keys(boxes).sort((a, b) => parseInt(a) - parseInt(b));
    
    if (boxNumbers.length === 0) {
        cardsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Nenhuma caixa adicionada</h3>
                <p>Clique em "ADICIONAR CARD" para começar</p>
            </div>
        `;
        return;
    }
    
    cardsContainer.innerHTML = boxNumbers.map(boxNumber => {
        const boxItems = boxes[boxNumber];
        const itemsHtml = boxItems.map((item, itemIndex) => `
            <div class="box-item">
                <div class="item-header">
                    <span class="item-code">CÓDIGO: ${item.codigo}</span>
                    <div class="item-actions">
                        <button class="edit-btn" onclick="openEditModal(${boxNumber}, ${itemIndex})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-card-btn" onclick="deleteItem(${boxNumber}, ${itemIndex})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="item-info">
                    <span class="info-item">QT: ${item.qt}</span>
                    ${item.unit ? `<span class="info-item">UNIT: ${item.unit}</span>` : ''}
                </div>
                <div class="item-name">${item.nome || 'Nome não encontrado'}</div>
            </div>
        `).join('');
        
        return `
            <div class="box-card">
                <div class="box-header">
                    <h3><i class="fas fa-box"></i> CAIXA ${boxNumber}</h3>
                    <div class="box-header-actions">
                        <span class="box-count">${boxItems.length} item${boxItems.length !== 1 ? 's' : ''}</span>
                        <button class="edit-box-btn" onclick="editBox(${boxNumber})" title="Adicionar mais itens nesta caixa">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="delete-box-btn" onclick="deleteBox(${boxNumber})" title="Excluir caixa inteira">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="box-items">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }).join('');
}

function updatePrintButtonState() {
    const selectedStore = storeSelect.value;
    const totalItems = Object.values(boxes).reduce((total, boxItems) => total + boxItems.length, 0);
    printBtn.disabled = totalItems === 0 || !selectedStore;
    
    if (printBtn.disabled) {
        printBtn.style.opacity = '0.5';
        printBtn.style.cursor = 'not-allowed';
    } else {
        printBtn.style.opacity = '1';
        printBtn.style.cursor = 'pointer';
    }
}

/**
 * Função responsável por gerar e exibir a janela de impressão do checklist
 * Esta função:
 * 1. Valida se existem itens e se uma loja foi selecionada
 * 2. Prepara o conteúdo HTML para impressão
 * 3. Formata as caixas e itens para o layout de impressão
 * 4. Abre a janela de impressão do navegador
 * 
 * Possíveis problemas conhecidos:
 * - Estilos inline podem não ser totalmente respeitados em alguns navegadores
 * - Quebras de página podem ocorrer no meio de caixas
 * - Em navegadores mais antigos, pode ser necessário ajustes nos estilos
 */
function generatePrintContent() {
    // Mesmo conteúdo da função printChecklist, mas retornando o HTML em vez de abrir a janela de impressão
    if (Object.keys(boxes).length === 0) {
        showAlert('Não há itens para imprimir!', 'warning');
        return '';
    }

    const selectedStore = document.getElementById('store').value;
    if (!selectedStore) {
        showAlert('Por favor, selecione uma loja antes de imprimir.', 'warning');
        return '';
    }

    // Ordena as caixas numericamente para exibição
    const boxNumbers = Object.keys(boxes).sort((a, b) => parseInt(a) - parseInt(b));
    
    // Calcula o total de itens
    let totalItems = 0;
    boxNumbers.forEach(boxNumber => {
        totalItems += boxes[boxNumber].length;
    });

    // Formata a data atual
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Gera o HTML para cada caixa
    const printBoxes = boxNumbers.map(boxNumber => {
        const boxItems = boxes[boxNumber];
        
        // Gera o HTML para cada item da caixa
        const itemsHtml = boxItems.map((item, index) => `
            <div class="print-item">
                <div class="item-info">
                    ${item.codigo} - ${item.nome || 'Nome não encontrado'}
                </div>
                <div class="item-quantity">
                    QT: <strong>${item.qt}</strong>${item.unit ? ` | ${item.unit}` : ''}
                </div>
            </div>
        `).join('');
        
        // Retorna o HTML da caixa com seus itens
        return `
            <div class="print-box">
                <h3>
                    <i class="fas fa-box"></i> CAIXA ${boxNumber} (${boxItems.length} item${boxItems.length !== 1 ? 's' : ''})
                </h3>
                <div style="padding: 0 15px;">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="print-content">
            <div class="print-header">
                <h1>Checklist de Itens - Entrega</h1>
                <div class="print-info">
                    <p>
                        <strong>Loja:</strong> ${selectedStore} | 
                        <strong>Data/Hora:</strong> ${formattedDate} | 
                        <strong>Total de Caixas:</strong> ${boxNumbers.length} | 
                        <strong>Total de Itens:</strong> ${totalItems}
                    </p>
                </div>
            </div>
            ${printBoxes}
            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666; padding-top: 20px; border-top: 1px solid #eee;">
                Documento gerado em: ${formattedDate} | Checklist de Itens - ${selectedStore}
            </div>
        </div>
    `;
}

function printChecklist() {
    const htmlContent = generatePrintContent();
    if (!htmlContent) return;
    
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pré-visualização - Checklist de Itens</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                @page { 
                    size: A4; 
                    margin: 15mm 10mm 20mm 10mm; 
                }
                body { 
                    margin: 0; 
                    padding: 10px; 
                    font-family: Arial, sans-serif; 
                    font-size: 14px;
                    line-height: 1.4;
                    color: #000;
                    -webkit-text-size-adjust: 100%;
                }
                
                /* Melhorias gerais para todos os tamanhos */
                .print-header {
                    padding: 10px 0;
                }
                
                .print-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    justify-content: center;
                    margin-bottom: 15px;
                }
                
                .print-info p {
                    margin: 5px 0;
                    white-space: nowrap;
                }
                
                /* Estilos para telas pequenas (celulares) */
                @media (max-width: 600px) {
                    body {
                        padding: 8px;
                        font-size: 12px;
                    }
                    
                    .print-header h1 {
                        font-size: 18px !important;
                        margin-bottom: 5px !important;
                    }
                    
                    .print-info {
                        flex-direction: column;
                        gap: 5px !important;
                    }
                    
                    .print-box h3 {
                        font-size: 14px !important;
                        padding: 6px 8px !important;
                    }
                    
                    .print-item {
                        flex-direction: column;
                        gap: 3px;
                    }
                    
                    .item-quantity {
                        margin-left: 0 !important;
                        margin-top: 3px;
                    }
                }
                
                /* Estilos para tablets */
                @media (min-width: 601px) and (max-width: 1024px) {
                    body {
                        padding: 15px;
                        font-size: 13px;
                        max-width: 100%;
                        overflow-x: hidden;
                    }
                    
                    .print-header h1 {
                        font-size: 20px !important;
                        margin-top: 10px;
                    }
                    
                    .print-info {
                        flex-wrap: wrap;
                    }
                    
                    .print-box {
                        margin-bottom: 25px;
                    }
                }
                
                /* Melhorias para impressão */
                @media print {
                    body {
                        padding: 0 !important;
                        margin: 0 !important;
                        font-size: 11px !important;
                    }
                    
                    .print-box {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    
                    .print-item {
                        padding: 4px 0 !important;
                    }
                }
                
                .print-box { 
                    margin-bottom: 20px; 
                    page-break-inside: avoid;
                    background: #fff;
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    padding: 10px;
                }
                
                .print-box h3 {
                    background: #f5f5f5;
                    padding: 8px 12px;
                    margin: -10px -10px 10px -10px;
                    font-size: 14px;
                    border-left: 4px solid #667eea;
                    font-weight: bold;
                    word-break: break-word;
                    border-radius: 4px 4px 0 0;
                }
                
                .print-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f0f0;
                    flex-wrap: wrap;
                    align-items: center;
                }
                
                .item-info {
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    padding-right: 10px;
                }
                
                .item-quantity {
                    margin-left: 15px;
                    white-space: nowrap;
                    color: #555;
                    flex-shrink: 0;
                    font-weight: 500;
                }
            </style>
        </head>
        <body>
            ${htmlContent}
            <script>
                // Pequeno atraso para garantir que tudo foi carregado
                setTimeout(function() {
                    window.print();
                    // Fecha a janela após a impressão
                    setTimeout(function() {
                        window.close();
                    }, 100);
                }, 200);
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
    
    /**
     * Gera o HTML para cada caixa e seus itens
     * Ordena as caixas numericamente para exibição
     */
    const boxNumbers = Object.keys(boxes).sort((a, b) => parseInt(a) - parseInt(b));
    const printBoxes = boxNumbers.map(boxNumber => {
        const boxItems = boxes[boxNumber];
        
        // Gera o HTML para cada item da caixa
        const itemsHtml = boxItems.map((item, index) => `
            <div class="print-item">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                        <!-- Checkbox para marcar itens recebidos -->
                        <input type="checkbox" style="width: 15px; height: 15px; margin-right: 10px;">
                        <div>
                            <strong>${item.codigo}</strong> - ${item.nome || 'Nome não encontrado'}
                        </div>
                    </div>
                    <div style="white-space: nowrap; margin-left: 15px; color: #555;">
                        QT: <strong>${item.qt}</strong>${item.unit ? ` | ${item.unit}` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Retorna o HTML da caixa com seus itens
        return `
            <div class="print-box" style="border-bottom: 1px solid #000; padding-bottom: 15px; margin-bottom: 15px;">
                <h3 style="background: #f0f0f0; padding: 8px; margin: 0 0 8px 0; font-size: 14px; border-left: 4px solid #667eea; font-weight: bold;">
                    <i class="fas fa-box"></i> CAIXA ${boxNumber} (${boxItems.length} item${boxItems.length !== 1 ? 's' : ''})
                </h3>
                <div style="padding: 0 10px;">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }).join('');
    
    // Formata a data atual
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Monta o conteúdo completo da impressão
    printContent.innerHTML = `
        <!-- Cabeçalho -->
        <div class="print-header">
            <h1>Checklist de Itens - Entrega</h1>
            <div class="print-info">
                <div><strong>Loja:</strong> ${selectedStore || 'Não informada'}</div>
                <div><strong>Data/Hora:</strong> ${formattedDate}</div>
            </div>
            <div style="margin-top: 10px; font-weight: bold;">
                Total de Caixas: ${boxNumbers.length} | Total de Itens: ${totalItems}
            </div>
        </div>
        
        <!-- Conteúdo Principal -->
        <div class="print-content">
            ${printBoxes}
        </div>
        
        <!-- Rodapé -->
        <div class="print-footer">
            <div class="print-signature">
                <div>
                    <div class="print-signature-line">Responsável pela Entrega</div>
                    <div style="margin-top: 40px;">
                        Nome: ___________________________________<br>
                        Assinatura: _____________________________
                    </div>
                </div>
                <div>
                    <div class="print-signature-line">Responsável pelo Recebimento</div>
                    <div style="margin-top: 40px;">
                        Nome: ___________________________________<br>
                        Assinatura: _____________________________
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666;">
                Documento gerado em: ${formattedDate} | Checklist de Itens - ${selectedStore || 'Loja não informada'}
            </div>
        </div>
    `;
    
    // Cria um documento HTML simples para impressão
    const printWindow = window.open('', '_blank');
    
    // Conteúdo HTML para impressão
    const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Checklist de Itens - ${selectedStore || 'Entrega'}</title>
            <meta charset="UTF-8">
            <style>
                @page { 
                    size: A4; 
                    margin: 10mm 10mm 15mm 10mm; 
                }
                body { 
                    margin: 0; 
                    padding: 10mm; 
                    font-family: Arial, sans-serif; 
                    font-size: 11px;
                    line-height: 1.3;
                    color: #000;
                }
                .print-header { 
                    text-align: center; 
                    margin-bottom: 20px;
                }
                .print-header h1 { 
                    font-size: 20px; 
                    margin: 0 0 8px 0; 
                    color: #333;
                }
                .print-info {
                    margin: 5px 0 15px 0;
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .print-box { 
                    margin-bottom: 15px; 
                    page-break-inside: avoid;
                    border: none;
                    padding: 0 0 15px 0;
                    border-bottom: 1px solid #000;
                }
                .print-box:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                    padding-bottom: 0;
                }
                .print-box h3 {
                    background: #f5f5f5;
                    padding: 6px 8px;
                    margin: 0 0 8px 0;
                    font-size: 12px;
                    border-left: 4px solid #667eea;
                }
                .print-item {
                    padding: 6px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #f0f0f0;
                }
                .item-info {
                    flex: 1;
                }
                .item-quantity {
                    margin-left: 15px;
                    white-space: nowrap;
                    color: #555;
                }
                .print-footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #333;
                }
                .print-signature {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 40px;
                }
                .print-signature > div {
                    width: 45%;
                }
                .print-signature-line {
                    border-top: 1px solid #333;
                    padding-top: 5px;
                    margin-bottom: 40px;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>Checklist de Itens - Entrega</h1>
                <div class="print-info">
                    <p><strong>Loja:</strong> ${selectedStore || 'Não informada'} | 
                    <strong>Data/Hora:</strong> ${formattedDate} | 
                    <strong>Total de Caixas:</strong> ${boxNumbers.length} | 
                    <strong>Total de Itens:</strong> ${totalItems}</p>
                </div>
            </div>
            
            <div class="print-content">
                ${printBoxes}
            </div>
            
            <div class="print-footer">
                <div style="margin-top: 30px; text-align: center; font-size: 9px; color: #666;">
                    Documento gerado em: ${formattedDate} | Checklist de Itens - ${selectedStore || 'Loja não informada'}
                </div>
            </div>
            
            <script>
                // Pequeno atraso para garantir que tudo foi carregado
                setTimeout(function() {
                    window.print();
                    // Fecha a janela após a impressão
                    setTimeout(function() {
                        window.close();
                    }, 100);
                }, 200);
            <\/script>
        </body>
        </html>
    `;
    
    // Escreve o conteúdo no novo documento e fecha
    printWindow.document.open();
    printWindow.document.write(printHTML);
    printWindow.document.close();
}

function showAlert(message, type = 'info') {
    if (type === 'success') {
        // Para mensagens de sucesso, usar toast no canto superior direito
        showToast(message, type);
    } else {
        // Para erros e avisos, usar modal
        const alertModal = document.getElementById('customAlert');
        const alertIcon = document.getElementById('alertIcon');
        const alertTitle = document.getElementById('alertTitle');
        const alertMessage = document.getElementById('alertMessage');
        
        if (type === 'error') {
            alertIcon.className = 'fas fa-exclamation-circle';
            alertTitle.textContent = 'Erro';
        } else {
            alertIcon.className = 'fas fa-info-circle';
            alertTitle.textContent = 'Aviso';
        }
        
        alertMessage.textContent = message;
        alertModal.style.display = 'block';
    }
}

function showToast(message, type = 'success') {
    // Criar elemento de toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Estilos do toast
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
        backdrop-filter: blur(10px);
    `;
    
    // Cores baseadas no tipo
    if (type === 'success') {
        toast.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    document.body.appendChild(toast);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function closeCustomAlert() {
    document.getElementById('customAlert').style.display = 'none';
}

function showConfirm(message, callback) {
    const confirmModal = document.getElementById('customConfirm');
    const confirmMessage = document.getElementById('confirmMessage');
    
    confirmMessage.textContent = message;
    currentConfirmCallback = callback;
    confirmModal.style.display = 'block';
}

function closeCustomConfirm() {
    document.getElementById('customConfirm').style.display = 'none';
    currentConfirmCallback = null;
}

function confirmCustomAction() {
    if (currentConfirmCallback) {
        currentConfirmCallback();
    }
    closeCustomConfirm();
}

function closeCustomViewBox() {
    document.getElementById('customViewBox').style.display = 'none';
}

// Event listener para mudança de loja
storeSelect.addEventListener('change', updatePrintButtonState);

// Event listener para botão de excluir no modal
deleteBtn.addEventListener('click', deleteCurrentItem);

// Event listeners para modais customizados
document.getElementById('alertOkBtn').addEventListener('click', closeCustomAlert);
document.getElementById('confirmCancelBtn').addEventListener('click', closeCustomConfirm);
document.getElementById('confirmOkBtn').addEventListener('click', confirmCustomAction);
document.getElementById('closeViewBoxBtn').addEventListener('click', closeCustomViewBox);

// Variáveis para controle dos modais customizados
let currentConfirmCallback = null;

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .toast {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .toast i {
        font-size: 1.1rem;
    }
`;
document.head.appendChild(style);
