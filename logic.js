const STORAGE_KEY = 'metso_alimentador_v5';

let currentAttachments = {};
let modalCurrentUid = null;
let modalCurrentIndex = -1;

let signatures = { sigTecnico: null, sigCliente: null };

const checklistData = {
  checklistAntes: [
    "1.1. Tempo/condições de armazenagem",
    "1.2. Vibradores lubrificados durante armazenagem",
    "1.3. Qualquer dano de transporte ou tempo de exposição",
    "1.4. As molas estão paralelas verticalmente",
    "1.5. Altura de molas dentro de 3mm lado a lado",
    "1.6. Vão livre do corpo vibrante está correto",
    "1.7. Freio de fricção corretamente instalado",
    "1.8. Altura de queda mm (padrão < 2000 mm)",
    "1.9. Revestimentos da mesa de alimentação bem instalados",
    "1.10. Revestimentos laterais bem instalados",
    "1.11. Trilhos bem instalados",
    "1.12. Correias de transmissão tensionadas/alinhadas",
    "1.13. Conferido curso e alinhamento do cardan acion",
    "1.14. Proteção do cardan bem fixada, sem interferências",
    "1.15. Conferido o torque dos trilhos",
    "1.16. Conferido o torque de fixação dos vibradores",
    "1.17. Conferido o torque dos revestimentos",
    "1.18. Conferido o torque cardan acionamento",
    "1.19. O óleo dos vibradores foi substituído",
    "1.20. Tipo de óleo",
    "1.21. Respiros dos vibradores em boas condições",
    "1.22. As mangueiras de graxa foram purgadas",
    "1.23. Proteções dos contrapesos estão bem fixadas",
    "1.24. Sensor de rotação corretamente instalado",
    "1.25. Sensores de temperatura corretamente instalados",
    "1.26. Motores testados e verificado o sentido de rotação"
  ],
  checklistOperacao: [
    "2.1. Ruído de batimento ou conexão solta (sem carga)",
    "2.2. A base de assentamento está adequada",
    "2.3. Há vazamentos de óleo nos vibradores",
    "2.4. Taxa de alimentação (com carga)",
    "2.5. Top size alimentação conforme folha de dados",
    "2.6. O material flui livremente pela mesa e trilhos",
    "2.7. Há vazamentos pela traseira/laterais",
    "2.8. Há vazamentos entre a peneira e o chute de descarga"
  ],
  checklistParada: [
    "3.1. Ressonância das molas e amortecimento na parada",
    "3.2. Qualquer batimento da parte fixa x parte móvel",
    "3.3. Há inversor de frequência instalado",
    "3.4. Acúmulo de material na bica undersize",
    "3.5. Outros:"
  ]
};

function renderChecklists() {
  const listIds = ['checklistAntes', 'checklistOperacao', 'checklistParada'];

  listIds.forEach(listKey => {
    const tbody = document.getElementById(listKey);
    if (!tbody) return;
    tbody.innerHTML = '';
    
    checklistData[listKey].forEach((itemText, idx) => {
      const tr = document.createElement('tr');
      const uniqueId = `${listKey}_${idx}`;
      
      tr.innerHTML = `
        <td class="check-cell">
          <label class="checkbox-wrapper w-full h-full min-h-[30px]">
            <input type="checkbox" id="ok_${uniqueId}">
            <span class="custom-checkbox m-0"></span>
          </label>
        </td>
        <td class="check-cell">
          <label class="checkbox-wrapper w-full h-full min-h-[30px]">
            <input type="checkbox" id="nok_${uniqueId}">
            <span class="custom-checkbox m-0" style="border-color: #c8102e;"></span>
          </label>
        </td>
        <td>
          <div class="flex flex-col gap-1 py-1">
            <span class="font-medium">${itemText}</span>
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
              <input type="text" id="obs_${uniqueId}" class="flex-grow border border-ink-200 rounded px-2 py-1 outline-none focus:border-ink-900 bg-transparent text-[10px] text-ink-800 placeholder:text-ink-300" placeholder="Comentário / Valor medido...">
              
              <div class="flex items-center gap-2">
                <label class="no-print cursor-pointer text-ink-500 hover:text-metso-500 transition-colors bg-ink-100 hover:bg-metso-50 rounded px-2 py-1 flex items-center gap-1 text-[10px] font-bold border border-ink-200 shrink-0" title="Anexar Foto/Vídeo">
                  <i class="fa-solid fa-paperclip"></i>
                  <span>Anexar</span>
                  <input type="file" multiple accept="image/*,video/*" onchange="handleAttachment(event, '${uniqueId}')" class="hidden">
                </label>
                
                <div id="attach_container_${uniqueId}" class="flex flex-wrap gap-1 items-center"></div>
              </div>

            </div>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function handleAttachment(event, uniqueId) {
  const files = event.target.files;
  if (!files.length) return;

  if (!currentAttachments[uniqueId]) currentAttachments[uniqueId] = [];

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = {
        id: 'att_' + Date.now() + Math.random().toString(36).substr(2, 6),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        src: e.target.result
      };
      
      currentAttachments[uniqueId].push(fileData);
      renderAttachmentChips(uniqueId);
      saveFormState(false);
    };
    reader.readAsDataURL(file);
  });
  event.target.value = '';
}

function renderAttachmentChips(uniqueId) {
  const container = document.getElementById(`attach_container_${uniqueId}`);
  if (!container) return;
  container.innerHTML = '';

  const files = currentAttachments[uniqueId] || [];
  
  files.forEach((file, index) => {
    const chip = document.createElement('div');
    chip.className = 'attachment-chip group relative';
    chip.onclick = () => openMediaModal(uniqueId, index);
    
    let preview = '';
    if (file.type.startsWith('image/')) {
      preview = `<img src="${file.src}" alt="img">`;
    } else if (file.type.startsWith('video/')) {
      preview = `<div class="icon" style="background:#c8102e;"><i class="fa-solid fa-play"></i></div>`;
    } else {
      preview = `<div class="icon"><i class="fa-solid fa-file"></i></div>`;
    }

    chip.innerHTML = `
      ${preview}
      <span class="max-w-[60px] truncate" title="${file.name}">${file.name}</span>
      <button type="button" onclick="event.stopPropagation(); removeAttachment('${uniqueId}', ${index})" class="no-print ml-1 text-ink-400 hover:text-red-500 focus:outline-none" title="Remover">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    container.appendChild(chip);
  });
}

function removeAttachment(uniqueId, index) {
  if (currentAttachments[uniqueId]) {
    currentAttachments[uniqueId].splice(index, 1);
    renderAttachmentChips(uniqueId);
    saveFormState(false);
  }
}

// ==========================================
// LÓGICA DO MODAL (CARROSSEL)
// ==========================================
function openMediaModal(uniqueId, index) {
  modalCurrentUid = uniqueId;
  modalCurrentIndex = index;
  
  const modal = document.getElementById('mediaModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  
  updateModalContent();
}

function updateModalContent() {
  const files = currentAttachments[modalCurrentUid] || [];
  const file = files[modalCurrentIndex];
  if (!file) return;

  const container = document.getElementById('modalContentContainer');
  const caption = document.getElementById('modalCaption');
  const downloadLink = document.getElementById('modalDownloadLink');
  const btnPrev = document.getElementById('btnPrevMedia');
  const btnNext = document.getElementById('btnNextMedia');

  const existingVideo = container.querySelector('video');
  if (existingVideo) existingVideo.pause();
  container.innerHTML = '';

  caption.textContent = `${modalCurrentIndex + 1} / ${files.length} - ${file.name}`;
  downloadLink.href = file.src;
  downloadLink.download = file.name;

  if (files.length > 1) {
    btnPrev.style.display = 'flex';
    btnNext.style.display = 'flex';
    btnPrev.style.opacity = modalCurrentIndex === 0 ? '0.3' : '1';
    btnNext.style.opacity = modalCurrentIndex === files.length - 1 ? '0.3' : '1';
  } else {
    btnPrev.style.display = 'none';
    btnNext.style.display = 'none';
  }

  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = file.src;
    img.className = 'max-h-[75vh] w-auto max-w-full object-contain rounded shadow-2xl mx-auto';
    container.appendChild(img);
  } else if (file.type.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = file.src;
    video.controls = true;
    video.autoplay = true;
    video.className = 'max-h-[75vh] w-full max-w-3xl rounded shadow-2xl bg-black mx-auto';
    container.appendChild(video);
  } else {
    container.innerHTML = `
      <div class="bg-white rounded-lg p-8 text-center max-w-md mx-auto shadow-2xl">
        <i class="fa-solid fa-file-invoice text-6xl text-ink-300 mb-4"></i>
        <h3 class="text-lg font-bold text-ink-900 mb-2">Visualização indisponível</h3>
        <p class="text-xs text-ink-500 mb-6">Este tipo de arquivo não pode ser visualizado diretamente no navegador.</p>
        <a href="${file.src}" download="${file.name}" class="btn-metso inline-flex items-center gap-2">
          <i class="fa-solid fa-download"></i> Baixar Arquivo
        </a>
      </div>
    `;
  }
}

function navigateMedia(direction) {
  const files = currentAttachments[modalCurrentUid] || [];
  const newIndex = modalCurrentIndex + direction;
  
  if (newIndex >= 0 && newIndex < files.length) {
    modalCurrentIndex = newIndex;
    updateModalContent();
  }
}

function closeMediaModal() {
  const modal = document.getElementById('mediaModal');
  const container = document.getElementById('modalContentContainer');
  
  const video = container.querySelector('video');
  if (video) {
    video.pause();
    video.currentTime = 0;
  }
  
  container.innerHTML = '';
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  
  modalCurrentUid = null;
  modalCurrentIndex = -1;
}

// ==========================================
// LÓGICA DE ASSINATURA (CANVAS)
// ==========================================
function initCanvas(sigId) {
  const canvas = document.getElementById(`canvas_${sigId}`);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  ctx.scale(dpr, dpr);
  
  ctx.strokeStyle = '#14171c';
  ctx.lineWidth = 2.0; 
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (signatures[sigId]) {
    const img = new Image();
    img.onload = () => {
       ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = signatures[sigId];
    document.getElementById(`img_${sigId}`).src = signatures[sigId];
  }

  const getPos = (e) => {
    const r = canvas.getBoundingClientRect();
    let cx = e.clientX, cy = e.clientY;
    if (e.touches && e.touches[0]) { 
      cx = e.touches[0].clientX; 
      cy = e.touches[0].clientY; 
    }
    return { 
      x: (cx - r.left) * (canvas.width / r.width) / dpr, 
      y: (cy - r.top) * (canvas.height / r.height) / dpr 
    };
  };

  const start = (e) => { 
    isDrawing = true; 
    const p = getPos(e); 
    lastX = p.x; lastY = p.y;
    ctx.beginPath(); 
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2); 
    ctx.fill();
  };

  const move = (e) => { 
    if (!isDrawing) return; 
    e.preventDefault();
    const p = getPos(e); 
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y); 
    ctx.stroke();

    lastX = p.x; lastY = p.y;
  };

  const stop = () => {
    if (!isDrawing) return;
    isDrawing = false;
    signatures[sigId] = canvas.toDataURL('image/png');
    saveFormState(false);
  };

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);
  
  canvas.addEventListener('touchstart', (e) => { start(e); }, { passive: false });
  canvas.addEventListener('touchmove',  (e) => { move(e); },  { passive: false });
  canvas.addEventListener('touchend', stop);
}

function clearSignature(sigId) {
  const canvas = document.getElementById(`canvas_${sigId}`);
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  signatures[sigId] = null;
  
  const img = document.getElementById(`img_${sigId}`);
  if (img) { img.src = ''; }
  
  saveFormState(false);
  showToast('Assinatura removida.', 'info');
}

// ==========================================
// LÓGICA DO CAMPO DE COMENTÁRIO EXPANSÍVEL
// ==========================================
function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

// ==========================================
// COMPARTILHAMENTO VIA LINK MÁGICO
// ==========================================
function compartilharViaWhatsApp(tipo) {
  const data = collectFormData();
  data.exportedAt = new Date().toISOString();
  data.status = tipo;

  // Remove anexos pesados (fotos/vídeos) para caber na URL
  const dataParaLink = { ...data };
  dataParaLink.attachments = {}; 

  // Comprime o JSON
  const jsonStr = JSON.stringify(dataParaLink);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);

  // Monta o link
  const baseUrl = window.location.href.split('#')[0];
  const linkAssinatura = `${baseUrl}#dados=${compressed}`;

  // Gera a mensagem
  let mensagem = "";

  if (tipo === 'pendente_assinatura') {
    mensagem = `Olá! Segue o relatório de comissionamento para sua assinatura.\n\n1. Clique no link abaixo.\n2. Revise as informações.\n3. Assine no campo do cliente e clique em "Concluir e Enviar".\n\n👉 ${linkAssinatura}`;
  } else {
    mensagem = `Olá! Segue o relatório assinado.\n\n👉 ${linkAssinatura}`;
  }

  // Abre o WhatsApp com a mensagem pronta
  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(urlWhatsApp, '_blank');
  
  showToast('Link de assinatura gerado!', 'success');
}

function carregarDadosDaUrl() {
  const hash = window.location.hash;
  if (!hash || !hash.includes('dados=')) return false;

  try {
    const compressed = hash.split('dados=')[1];
    const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
    
    if (jsonStr) {
      const data = JSON.parse(jsonStr);
      applyFormData(data);
      
      // Muda a interface para o Modo Cliente
      ativarModoCliente();
      return true;
    }
  } catch (e) {
    console.error("Erro ao ler dados da URL:", e);
    showToast('Link inválido ou corrompido.', 'error');
  }
  return false;
}

function ativarModoCliente() {
  // Oculta o botão de gerar link (pois o cliente não precisa enviar para si mesmo)
  const btnCompartilhar = document.querySelector('button[onclick="compartilharViaWhatsApp(\'pendente_assinatura\')"]');
  if (btnCompartilhar) btnCompartilhar.style.display = 'none';
  
  // Muda o botão "Devolver Assinado" para a cor de destaque e gera o link de volta
  const btnDevolver = document.querySelector('.btn-whatsapp');
  if (btnDevolver) {
    btnDevolver.innerHTML = '<i class="fa-solid fa-check"></i> <span>Concluir e Enviar</span>';
    btnDevolver.onclick = () => concluirAssinaturaCliente();
  }

  // Desabilita a edição de campos que não devem ser alterados pelo cliente
  document.querySelectorAll('#reportForm input, #reportForm textarea, #reportForm select').forEach(el => {
    if (el.id !== 'sigClienteName' && el.id !== 'sigClienteCargo' && el.id !== 'sigClienteDate') {
      el.setAttribute('readonly', true);
      if (el.tagName === 'TEXTAREA' || el.type === 'text' || el.type === 'date') {
        el.style.backgroundColor = '#f6f7f9'; // Feedback visual de bloqueio
      }
    }
  });

  // Foca no campo de assinatura do cliente
  window.scrollTo(0, document.getElementById('canvas_sigCliente').getBoundingClientRect().top - 100);
  showToast('Revise os dados e assine abaixo.', 'info');
}

function concluirAssinaturaCliente() {
  // Coleta os dados atuais (que já vieram da URL + a assinatura feita agora)
  const data = collectFormData();
  data.status = 'assinado';
  
  // Gera um novo link com a assinatura inclusa
  const jsonStr = JSON.stringify(data);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);
  const baseUrl = window.location.href.split('#')[0];
  const linkAssinado = `${baseUrl}#dados=${compressed}`;

  // Abre o WhatsApp para o cliente enviar o link de volta ao técnico
  const mensagem = `Olá! Documento assinado com sucesso.\n\nAqui está o link com o registro da assinatura:\n👉 ${linkAssinado}`;
  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(urlWhatsApp, '_blank');
  
  showToast('Assinatura concluída! Envie o link para o técnico.', 'success');
}

// ==========================================
// PERSISTÊNCIA
// ==========================================
function collectFormData() {
  const formData = {
    header: {
      eqModelo: document.getElementById('eqModelo')?.value || '',
      eqSerie: document.getElementById('eqSerie')?.value || '',
      eqPF: document.getElementById('eqPF')?.value || '',
      eqData: document.getElementById('eqData')?.value || '',
      eqAtendimento: document.getElementById('eqAtendimento')?.value || '',
      eqCliente: document.getElementById('eqCliente')?.value || '',
      eqLocal: document.getElementById('eqLocal')?.value || '',
      eqTag: document.getElementById('eqTag')?.value || ''
    },
    registros: {
      regMolaAD: document.getElementById('regMolaAD')?.value || '',
      regMolaAE: document.getElementById('regMolaAE')?.value || '',
      regMolaDD: document.getElementById('regMolaDD')?.value || '',
      regMolaDE: document.getElementById('regMolaDE')?.value || '',
      regMecTipo: document.getElementById('regMecTipo')?.value || '',
      regMecConfig: document.getElementById('regMecConfig')?.value || '',
      regMecPerc: document.getElementById('regMecPerc')?.value || '',
      regBumpX: document.getElementById('regBumpX')?.value || '',
      regBumpY: document.getElementById('regBumpY')?.value || '',
      regBumpZ: document.getElementById('regBumpZ')?.value || '',
      
      regAmpMetodo: document.getElementById('regAmpMetodo')?.value || '',
      
      regAmpSC_AD: document.getElementById('regAmpSC_AD')?.value || '',
      regAmpSC_AE: document.getElementById('regAmpSC_AE')?.value || '',
      regAmpSC_DD: document.getElementById('regAmpSC_DD')?.value || '',
      regAmpSC_DE: document.getElementById('regAmpSC_DE')?.value || '',
      regAmpCC_AD: document.getElementById('regAmpCC_AD')?.value || '',
      regAmpCC_AE: document.getElementById('regAmpCC_AE')?.value || '',
      regAmpCC_DD: document.getElementById('regAmpCC_DD')?.value || '',
      regAmpCC_DE: document.getElementById('regAmpCC_DE')?.value || '',
      regAceleracao: document.getElementById('regAceleracao')?.value || '',
      regM1In: document.getElementById('regM1In')?.value || '',
      regM1Temp: document.getElementById('regM1Temp')?.value || '',
      regM2In: document.getElementById('regM2In')?.value || '',
      regM2Temp: document.getElementById('regM2Temp')?.value || '',
      regTempAmbiente: document.getElementById('regTempAmbiente')?.value || '',
      regVibM1_LA: document.getElementById('regVibM1_LA')?.value || '',
      regVibM1_LOA: document.getElementById('regVibM1_LOA')?.value || '',
      regVibM2_LA: document.getElementById('regVibM2_LA')?.value || '',
      regVibM2_LOA: document.getElementById('regVibM2_LOA')?.value || '',
      regMotM1_LA: document.getElementById('regMotM1_LA')?.value || '',
      regMotM1_LOA: document.getElementById('regMotM1_LOA')?.value || '',
      regMotM2_LA: document.getElementById('regMotM2_LA')?.value || '',
      regMotM2_LOA: document.getElementById('regMotM2_LOA')?.value || '',
    },
    checklists: {},
    opcoes: {
      entregaEquip: document.querySelector('input[name="entregaEquip"]:checked')?.value || '',
      relatorios: document.querySelector('input[name="relatorios"]:checked')?.value || '',
      sec5Comentario: document.getElementById('sec5Comentario')?.value || ''
    },
    signatures: {
      sigTecnico: signatures.sigTecnico,
      sigCliente: signatures.sigCliente,
      sigTecnicoCargo: document.getElementById('sigTecnicoCargo')?.value || '',
      sigClienteCargo: document.getElementById('sigClienteCargo')?.value || ''
    },
    attachments: currentAttachments
  };

  Object.keys(checklistData).forEach(listKey => {
    formData.checklists[listKey] = [];
    checklistData[listKey].forEach((_, idx) => {
      const uniqueId = `${listKey}_${idx}`;
      formData.checklists[listKey].push({
        ok: document.getElementById(`ok_${uniqueId}`)?.checked || false,
        nok: document.getElementById(`nok_${uniqueId}`)?.checked || false,
        obs: document.getElementById(`obs_${uniqueId}`)?.value || ''
      });
    });
  });

  return formData;
}

function applyFormData(data) {
  if (!data) return;

  if (data.header) {
    Object.keys(data.header).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.value = data.header[key];
    });
  }

  if (data.registros) {
    Object.keys(data.registros).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.value = data.registros[key];
    });
  }

  if (data.opcoes) {
    if (data.opcoes.entregaEquip) {
      const radio = document.querySelector(`input[name="entregaEquip"][value="${data.opcoes.entregaEquip}"]`);
      if (radio) radio.checked = true;
    }
    if (data.opcoes.relatorios) {
      const radio = document.querySelector(`input[name="relatorios"][value="${data.opcoes.relatorios}"]`);
      if (radio) radio.checked = true;
    }
    if (data.opcoes.sec5Comentario && document.getElementById('sec5Comentario')) {
      document.getElementById('sec5Comentario').value = data.opcoes.sec5Comentario;
      autoResizeTextarea(document.getElementById('sec5Comentario'));
    }
  }

  if (data.checklists) {
    Object.keys(data.checklists).forEach(listKey => {
      data.checklists[listKey].forEach((item, idx) => {
        const uniqueId = `${listKey}_${idx}`;
        const okEl = document.getElementById(`ok_${uniqueId}`);
        const nokEl = document.getElementById(`nok_${uniqueId}`);
        const obsEl = document.getElementById(`obs_${uniqueId}`);
        
        if (okEl) okEl.checked = item.ok;
        if (nokEl) nokEl.checked = item.nok;
        if (obsEl) obsEl.value = item.obs;
      });
    });
  }

  if (data.attachments) {
    currentAttachments = data.attachments;
    Object.keys(currentAttachments).forEach(uniqueId => {
      renderAttachmentChips(uniqueId);
    });
  } else {
    currentAttachments = {};
  }

  if (data.signatures) {
    signatures.sigTecnico = data.signatures.sigTecnico || null;
    signatures.sigCliente = data.signatures.sigCliente || null;
    
    if (document.getElementById('sigTecnicoCargo')) document.getElementById('sigTecnicoCargo').value = data.signatures.sigTecnicoCargo || '';
    if (document.getElementById('sigClienteCargo')) document.getElementById('sigClienteCargo').value = data.signatures.sigClienteCargo || '';

    Object.keys(signatures).forEach(sigId => {
      if (signatures[sigId]) {
        const imgEl = document.getElementById(`img_${sigId}`);
        const canvasEl = document.getElementById(`canvas_${sigId}`);
        if (imgEl && canvasEl) {
          const ctx = canvasEl.getContext('2d');
          const img = new Image();
          img.onload = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvasEl.getBoundingClientRect();
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
          img.src = signatures[sigId];
          imgEl.src = signatures[sigId]; 
        }
      }
    });
  }
}

function saveFormState(showToastFlag = false) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectFormData()));
    if (showToastFlag) showToast('Rascunho salvo com sucesso.', 'success');
  } catch (e) {
    console.error(e);
    if (showToastFlag) showToast('Erro ao salvar (talvez o arquivo de mídia seja muito grande).', 'error');
  }
}

function loadFormState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    applyFormData(data);
    return true;
  } catch (e) {
    return false;
  }
}

function exportJSONState() {
  saveFormState(false);
  const data = collectFormData();
  data.exportedAt = new Date().toISOString();
  const jsonStr = JSON.stringify(data, null, 2);
  
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Comissionamento_Alimentador_${data.header.eqSerie || 'SN'}_${data.header.eqData || 'data'}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast('Arquivo JSON exportado.');
}

function importJSONState(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      applyFormData(data);
      saveFormState(false);
      showToast('Dados carregados do JSON.', 'success');
    } catch (err) {
      showToast('Erro ao ler o JSON.', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearForm() {
  if (!confirm('Deseja limpar todo o formulário? Os dados e anexos não salvos serão perdidos.')) return;
  
  document.getElementById('reportForm').reset();
  document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(cb => cb.checked = false);
  
  currentAttachments = {};
  document.querySelectorAll('[id^="attach_container_"]').forEach(container => {
    container.innerHTML = '';
  });

  signatures = { sigTecnico: null, sigCliente: null };
  ['sigTecnico', 'sigCliente'].forEach(sigId => {
    const canvas = document.getElementById(`canvas_${sigId}`);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    const img = document.getElementById(`img_${sigId}`);
    if (img) { img.src = ''; }
  });
  
  const ta = document.getElementById('sec5Comentario');
  if (ta) {
    ta.style.height = 'auto';
  }
  
  saveFormState(false);
  showToast('Formulário limpo.', 'info');
}

window.onload = () => {
  // Verifica se há dados na URL (Modo Cliente)
  const isModoCliente = carregarDadosDaUrl();
  
  if (!isModoCliente) {
    // Modo Técnico normal
    renderChecklists();
    setTimeout(() => {
      initCanvas('sigTecnico');
      initCanvas('sigCliente');
      loadFormState(); // Carrega do localStorage
      
      const sec5Ta = document.getElementById('sec5Comentario');
      const sec5Print = document.getElementById('sec5ComentarioPrint');
      if (sec5Ta) {
        autoResizeTextarea(sec5Ta);
        sec5Ta.addEventListener('input', () => {
          autoResizeTextarea(sec5Ta);
          if (sec5Print) sec5Print.textContent = sec5Ta.value;
        });
      }
    }, 100);
  } else {
    // Modo Cliente (dados vieram da URL)
    renderChecklists(); // Renderiza os checklists visualmente
    setTimeout(() => {
      initCanvas('sigTecnico');
      initCanvas('sigCliente');
    }, 100);
  }
  
  const form = document.getElementById('reportForm');
  form.addEventListener('change', () => saveFormState(false));
  form.addEventListener('input', () => saveFormState(false));
};

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toastMessage');
  const icon = document.getElementById('toastIcon');
  
  msg.textContent = message;
  
  if (type === 'success') {
    icon.className = 'fa-solid fa-circle-check text-white';
  } else if (type === 'error') {
    icon.className = 'fa-solid fa-circle-exclamation text-metso-500';
  } else {
    icon.className = 'fa-solid fa-circle-info text-ink-400';
  }

  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}
