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
                <div class="view-box-item-header">
                    <span class="view-box-item-code">${item.codigo}</span>
                    <span class="view-box-item-info">QT: ${item.qt}${item.unit ? ` | UNIT: ${item.unit}` : ''}</span>
                </div>
                <div class="view-box-item-name">${item.nome || 'Nome não encontrado'}</div>
            </div>
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

function printChecklist() {
    const selectedStore = storeSelect.value;
    const totalItems = Object.values(boxes).reduce((total, boxItems) => total + boxItems.length, 0);
    
    if (totalItems === 0) {
        showAlert('Adicione pelo menos um item antes de imprimir!', 'error');
        return;
    }
    
    if (!selectedStore) {
        showAlert('Selecione uma loja antes de imprimir!', 'error');
        return;
    }
    
    // Preparar conteúdo para impressão
    const printArea = document.getElementById('printArea');
    const printStore = document.getElementById('printStore');
    const printDate = document.getElementById('printDate');
    const printContent = document.getElementById('printContent');
    
    printStore.textContent = selectedStore;
    printDate.textContent = new Date().toLocaleDateString('pt-BR');
    
    // Gerar lista de caixas e itens para impressão
    const boxNumbers = Object.keys(boxes).sort((a, b) => parseInt(a) - parseInt(b));
    const printBoxes = boxNumbers.map(boxNumber => {
        const boxItems = boxes[boxNumber];
        const itemsHtml = boxItems.map((item, index) => `
            <div class="print-item">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" style="width: 15px; height: 15px; margin-right: 10px;">
                    <div>
                        <strong>${item.codigo}</strong> - ${item.nome || 'Nome não encontrado'}
                    </div>
                </div>
                <div style="margin-left: 35px; margin-top: 5px;">
                    QT: <strong>${item.qt}</strong>${item.unit ? ` | UNIT: <strong>${item.unit}</strong>` : ''}
                </div>
            </div>
        `).join('');
        
        return `
            <div class="print-box">
                <h3 style="background: #f0f0f0; padding: 10px; margin: 20px 0 10px 0; border-left: 4px solid #667eea;">
                    CAIXA ${boxNumber} (${boxItems.length} item${boxItems.length !== 1 ? 's' : ''})
                </h3>
                ${itemsHtml}
            </div>
        `;
    }).join('');
    
    printContent.innerHTML = `
        <div style="margin-bottom: 20px;">
            <strong>Total de caixas: ${boxNumbers.length} | Total de itens: ${totalItems}</strong>
        </div>
        ${printBoxes}
        <div style="margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between;">
                <div>Responsável: _________________________</div>
                <div>Data de entrega: ___________________</div>
            </div>
            <div style="margin-top: 20px;">
                <div>RESPONSÁVEL PELO RECEBIMENTO: _________________________________________</div>
            </div>
        </div>
    `;
    
    // Imprimir
    window.print();
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
