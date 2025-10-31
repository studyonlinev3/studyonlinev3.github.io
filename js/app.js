// Enhanced study cards app with per-user storage, edit/delete, import/export and vocabulary
const SUBJECTS = [
  { key: 'ch', name: '國文' },
  { key: 'en', name: '英文' },
  { key: 'ma', name: '數學' },
  { key: 'chm', name: '化學' },
  { key: 'bio', name: '生物' },
  { key: 'phy', name: '物理' },
  { key: 'geo', name: '地科' },
  { key: 'soc', name: '社會' }
];

// Default sample cards
const DEFAULT_CARDS = [
  { id: 'ch-1', subject: 'ch', title: '文言常見詞彙', content: '「蓋」通常表示原因或解釋；注意句中功能。', _ts: Date.now()-1000000 },
  { id: 'en-1', subject: 'en', title: '時態重點', content: '現在完成式表過去到現在的影響，用 have/has + p.p.', _ts: Date.now()-900000 },
  { id: 'ma-1', subject: 'ma', title: '微分基本法則', content: '常見函數求導規則：和差、乘法、鏈式法則。', _ts: Date.now()-800000 }
];

// Default Vocab (English)
const DEFAULT_VOCABS = [
  { id: 'v-1', word: 'context', meaning: '上下文；語境', example: 'Always consider the context when interpreting a sentence.', example_tw: '在解釋句子時，務必考慮上下文。', _ts: Date.now()-600000 },
  { id: 'v-2', word: 'interpret', meaning: '解釋；詮釋', example: 'How do you interpret this data?', example_tw: '你如何解釋這些資料？', _ts: Date.now()-500000 }
];

let cards = [];
let vocabs = [];

const STORAGE_KEYS = {
  baseCards: 'study_cards_cards_base_v1',
  baseStars: 'study_cards_starred_base_v1',
  baseVocabs: 'study_cards_vocabs_base_v1',
  userPrefix: 'study_cards_user_' // + username + _cards_v1 / _stars_v1 / _vocabs_v1
};

function userCardsKey(username){ return `${STORAGE_KEYS.userPrefix}${username}_cards_v1`; }
function userStarsKey(username){ return `${STORAGE_KEYS.userPrefix}${username}_stars_v1`; }
function userVocabsKey(username){ return `${STORAGE_KEYS.userPrefix}${username}_vocabs_v1`; }

function loadRaw(key){ try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e){ return null; } }
function saveRaw(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

function loadCurrentState(){
  const user = JSON.parse(localStorage.getItem('study_cards_user_v1') || 'null');
  let userCards = null, userStars = null, userVocabs = null;
  if(user && user.name){
    userCards = loadRaw(userCardsKey(user.name));
    userStars = loadRaw(userStarsKey(user.name));
    userVocabs = loadRaw(userVocabsKey(user.name));
  }
  const baseCards = loadRaw(STORAGE_KEYS.baseCards) || DEFAULT_CARDS.slice();
  const baseStars = loadRaw(STORAGE_KEYS.baseStars) || {};
  const baseVocabs = loadRaw(STORAGE_KEYS.baseVocabs) || DEFAULT_VOCABS.slice();
  return { user, userCards, userStars, baseCards, baseStars, userVocabs, baseVocabs };
}

function loadCardsForUser(user){ const state = loadCurrentState(); if(user && state.userCards && Array.isArray(state.userCards)) return state.userCards; return state.baseCards.slice(); }
function loadStarsForUser(user){ const state = loadCurrentState(); if(user && state.userStars) return state.userStars; return state.baseStars || {}; }
function loadVocabsForUser(user){ const state = loadCurrentState(); if(user && state.userVocabs && Array.isArray(state.userVocabs)) return state.userVocabs; return state.baseVocabs.slice(); }

function saveCardsForUser(user, cardsToSave){ if(user && user.name){ saveRaw(userCardsKey(user.name), cardsToSave); } else saveRaw(STORAGE_KEYS.baseCards, cardsToSave); }
function saveStarsForUser(user, stars){ if(user && user.name){ saveRaw(userStarsKey(user.name), stars); } else saveRaw(STORAGE_KEYS.baseStars, stars); }
function saveVocabsForUser(user, vocabsToSave){ if(user && user.name){ saveRaw(userVocabsKey(user.name), vocabsToSave); } else saveRaw(STORAGE_KEYS.baseVocabs, vocabsToSave); }

// DOM helpers
function q(id){ return document.getElementById(id); }

// --- Cards UI ---
function renderSubjectSelect(selectEl){ selectEl.innerHTML = ''; const optAll = document.createElement('option'); optAll.value='all'; optAll.textContent='全部'; selectEl.appendChild(optAll); SUBJECTS.forEach(s=>{ const o = document.createElement('option'); o.value=s.key; o.textContent=s.name; selectEl.appendChild(o); }); }
function renderCardSubjectSelect(selectEl){ selectEl.innerHTML=''; SUBJECTS.forEach(s=>{ const o = document.createElement('option'); o.value=s.key; o.textContent=s.name; selectEl.appendChild(o); }); }

function renderCardsUI(){ const container = q('cards'); container.innerHTML = ''; const state = loadCurrentState(); const subject = q('subject-select').value; const query = q('search-input').value.trim().toLowerCase(); const onlyStarred = q('show-starred').checked; const sort = q('sort-select').value; const stars = loadStarsForUser(state.user) || {};
  let filtered = cards.filter(c=>{ if(subject !== 'all' && c.subject !== subject) return false; if(onlyStarred && !stars[c.id]) return false; if(query){ return (c.title+ ' ' + c.content).toLowerCase().includes(query); } return true; });
  if(sort === 'new') filtered.sort((a,b)=> (b._ts||0)-(a._ts||0)); else filtered.sort((a,b)=> (a._ts||0)-(b._ts||0));
  if(filtered.length === 0){ const empty = document.createElement('div'); empty.textContent = '找不到卡片 — 試試新增或變更篩選條件。'; empty.style.color='#666'; container.appendChild(empty); return; }
  filtered.forEach(c=>{ const el = document.createElement('article'); el.className='card'; const actions = document.createElement('div'); actions.className='card-actions'; const editBtn = document.createElement('button'); editBtn.className='icon-btn'; editBtn.textContent = '編輯'; editBtn.addEventListener('click', (e)=>{ e.stopPropagation(); openEditCard(c.id); }); const delBtn = document.createElement('button'); delBtn.className='icon-btn'; delBtn.textContent='刪除'; delBtn.addEventListener('click', (e)=>{ e.stopPropagation(); deleteCard(c.id); }); actions.appendChild(editBtn); actions.appendChild(delBtn); el.appendChild(actions);
    const star = document.createElement('button'); star.className='star-btn'; star.title='加入或移除星號'; star.innerHTML = stars[c.id] ? '★' : '☆'; if(stars[c.id]) star.classList.add('starred'); star.addEventListener('click', (e)=>{ e.stopPropagation(); toggleStar(c.id); renderCardsUI(); }); el.appendChild(star);
    const subjName = SUBJECTS.find(s=>s.key===c.subject)?.name || c.subject; const badge = document.createElement('span'); badge.className='subject-badge'; badge.textContent = subjName; el.appendChild(badge);
    const h = document.createElement('h3'); h.textContent = c.title; el.appendChild(h); const p = document.createElement('p'); p.textContent = c.content; el.appendChild(p); const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = `<small>ID:${c.id}</small>`; el.appendChild(meta); container.appendChild(el); }); }

function toggleStar(id){ const state = loadCurrentState(); const stars = loadStarsForUser(state.user) || {}; if(stars[id]) delete stars[id]; else stars[id]=true; saveStarsForUser(state.user, stars); }

function openModal(id){ q(id).classList.remove('hidden'); q(id).setAttribute('aria-hidden','false'); }
function closeModal(id){ q(id).classList.add('hidden'); q(id).setAttribute('aria-hidden','true'); }

function openNewCard(){ q('card-modal-title').textContent='新增重點小卡'; q('card-subject').value = SUBJECTS[0].key; q('card-title').value=''; q('card-content').value=''; q('card-modal').dataset.editId = ''; openModal('card-modal'); }
function openEditCard(id){ const c = cards.find(x=>x.id===id); if(!c) return; q('card-modal-title').textContent='編輯重點小卡'; q('card-subject').value = c.subject; q('card-title').value = c.title; q('card-content').value = c.content; q('card-modal').dataset.editId = id; openModal('card-modal'); }
function deleteCard(id){ if(!confirm('確定要刪除此卡片嗎？此動作無法復原。')) return; const idx = cards.findIndex(c=>c.id===id); if(idx===-1) return; cards.splice(idx,1); const state = loadCurrentState(); saveCardsForUser(state.user, cards); const stars = loadStarsForUser(state.user) || {}; if(stars[id]){ delete stars[id]; saveStarsForUser(state.user, stars); } renderCardsUI(); }
function saveCardFromModal(){ const subj = q('card-subject').value; const title = q('card-title').value.trim(); const content = q('card-content').value.trim(); if(!title || !content){ alert('請填寫標題與內容'); return; } const editId = q('card-modal').dataset.editId; if(editId){ const c = cards.find(x=>x.id===editId); if(!c) return; c.subject = subj; c.title = title; c.content = content; c._ts = Date.now(); } else { const newid = `${subj}-${Date.now()}`; cards.unshift({ id: newid, subject: subj, title, content, _ts: Date.now() }); } const state = loadCurrentState(); saveCardsForUser(state.user, cards); closeModal('card-modal'); renderCardsUI(); }

function exportJSON(){ const state = loadCurrentState(); const payload = { cards, stars: loadStarsForUser(state.user), vocabs, exportedAt: new Date().toISOString(), user: state.user?.name||null }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `study_export_${state.user?.name||'anon'}_${Date.now()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

// --- Vocab UI ---
function renderVocabList(){ const container = q('vocab-list'); container.innerHTML = ''; const state = loadCurrentState(); const query = q('vocab-search').value.trim().toLowerCase(); const list = vocabs.filter(v=>{ if(!query) return true; return (v.word + ' ' + (v.meaning||'') + ' ' + (v.example||'')).toLowerCase().includes(query); }); if(list.length===0){ const empty = document.createElement('div'); empty.textContent='目前沒有單字；點選「新增單字」開始建立。'; empty.style.color='#666'; container.appendChild(empty); return; } list.forEach(v=>{ const el = document.createElement('article'); el.className='card'; const actions = document.createElement('div'); actions.className='card-actions'; const editBtn = document.createElement('button'); editBtn.className='icon-btn'; editBtn.textContent='編輯'; editBtn.addEventListener('click',(e)=>{ e.stopPropagation(); openEditVocab(v.id); }); const delBtn = document.createElement('button'); delBtn.className='icon-btn'; delBtn.textContent='刪除'; delBtn.addEventListener('click',(e)=>{ e.stopPropagation(); deleteVocab(v.id); }); actions.appendChild(editBtn); actions.appendChild(delBtn); el.appendChild(actions);
  const h = document.createElement('h3'); h.textContent = v.word; el.appendChild(h); const p = document.createElement('p'); p.textContent = v.meaning; el.appendChild(p); const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = `<small>${v.example ? v.example : ''}</small>`; el.appendChild(meta);
  // click to open detail
  el.addEventListener('click', ()=> openVocabDetail(v)); container.appendChild(el); }); }

function openVocabDetail(v){ // show modal with full info (read-only)
  q('vocab-modal-title').textContent = `單字：${v.word}`; q('vocab-word').value = v.word; q('vocab-meaning').value = v.meaning || ''; q('vocab-example').value = v.example || ''; q('vocab-example-tw').value = v.example_tw || v.example_tw || v.example_tw; q('vocab-modal').dataset.editId = v.id; openModal('vocab-modal'); }

function openNewVocab(){ q('vocab-modal-title').textContent='新增英文單字'; q('vocab-word').value=''; q('vocab-meaning').value=''; q('vocab-example').value=''; q('vocab-example-tw').value=''; q('vocab-modal').dataset.editId = ''; openModal('vocab-modal'); }
function openEditVocab(id){ const v = vocabs.find(x=>x.id===id); if(!v) return; q('vocab-modal-title').textContent='編輯英文單字'; q('vocab-word').value = v.word; q('vocab-meaning').value = v.meaning || ''; q('vocab-example').value = v.example || ''; q('vocab-example-tw').value = v.example_tw || ''; q('vocab-modal').dataset.editId = id; openModal('vocab-modal'); }
function deleteVocab(id){ if(!confirm('確定要刪除此單字嗎？此動作無法復原。')) return; const idx = vocabs.findIndex(v=>v.id===id); if(idx===-1) return; vocabs.splice(idx,1); const state = loadCurrentState(); saveVocabsForUser(state.user, vocabs); renderVocabList(); }
function saveVocabFromModal(){ const word = q('vocab-word').value.trim(); const meaning = q('vocab-meaning').value.trim(); const example = q('vocab-example').value.trim(); const example_tw = q('vocab-example-tw').value.trim(); if(!word || !meaning){ alert('請填寫單字與中文解釋'); return; } const editId = q('vocab-modal').dataset.editId; if(editId){ const v = vocabs.find(x=>x.id===editId); if(!v) return; v.word = word; v.meaning = meaning; v.example = example; v.example_tw = example_tw; v._ts = Date.now(); } else { const newid = `v-${Date.now()}`; vocabs.unshift({ id: newid, word, meaning, example, example_tw, _ts: Date.now() }); } const state = loadCurrentState(); saveVocabsForUser(state.user, vocabs); closeModal('vocab-modal'); renderVocabList(); }

function exportVocabs(){ const state = loadCurrentState(); const payload = { vocabs, exportedAt: new Date().toISOString(), user: state.user?.name||null }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `study_vocab_export_${state.user?.name||'anon'}_${Date.now()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

// --- Setup & user handling ---
function setup(){
  // tabs
  q('tab-cards').addEventListener('click', ()=> switchTab('cards'));
  q('tab-vocab').addEventListener('click', ()=> switchTab('vocab'));

  // cards
  renderSubjectSelect(q('subject-select'));
  renderCardSubjectSelect(q('card-subject'));

  // vocabs
  q('vocab-search').addEventListener('input', renderVocabList);

  // load data
  const state = loadCurrentState();
  cards = loadCardsForUser(state.user);
  vocabs = loadVocabsForUser(state.user);
  // ensure timestamps
  cards.forEach(c=>{ if(!c._ts) c._ts = Date.now(); });
  vocabs.forEach(v=>{ if(!v._ts) v._ts = Date.now(); });

  // common events
  q('subject-select').addEventListener('change', renderCardsUI);
  q('search-input').addEventListener('input', renderCardsUI);
  q('show-starred').addEventListener('change', renderCardsUI);
  q('sort-select').addEventListener('change', renderCardsUI);

  q('new-card-btn').addEventListener('click', openNewCard);
  q('card-cancel').addEventListener('click', ()=> closeModal('card-modal'));
  q('card-save').addEventListener('click', saveCardFromModal);

  q('new-vocab-btn').addEventListener('click', openNewVocab);
  q('vocab-cancel').addEventListener('click', ()=> closeModal('vocab-modal'));
  q('vocab-save').addEventListener('click', saveVocabFromModal);
  q('export-vocab-btn').addEventListener('click', exportVocabs);

  // import/export for cards
  q('export-btn').addEventListener('click', exportJSON);
  q('import-btn').addEventListener('click', ()=> q('import-file').click());
  q('import-file').addEventListener('change', (e)=>{ const f = e.target.files[0]; if(f) importJSONFile(f); e.target.value=''; });

  // login
  q('login-btn').addEventListener('click', ()=>{ const state = loadCurrentState(); if(state.user){ if(confirm('確定要登出嗎？')){ saveUser(null); onUserChanged(null); } } else openModal('login-modal'); });
  q('login-cancel').addEventListener('click', ()=> closeModal('login-modal'));
  q('login-submit').addEventListener('click', ()=>{ const username = q('login-username').value.trim(); if(!username){ alert('請輸入使用者名稱'); return; } saveUser({ name: username }); closeModal('login-modal'); onUserChanged({ name: username }); });

  updateUserArea();
  renderCardsUI();
  renderVocabList();
}

function switchTab(t){ if(t==='cards'){ q('cards-section').classList.remove('hidden'); q('vocab-section').classList.add('hidden'); q('tab-cards').classList.add('active'); q('tab-vocab').classList.remove('active'); } else { q('cards-section').classList.add('hidden'); q('vocab-section').classList.remove('hidden'); q('tab-cards').classList.remove('active'); q('tab-vocab').classList.add('active'); } }

function saveUser(user){ if(user) localStorage.setItem('study_cards_user_v1', JSON.stringify(user)); else localStorage.removeItem('study_cards_user_v1'); }
function onUserChanged(user){ const state = loadCurrentState(); cards = loadCardsForUser(state.user); vocabs = loadVocabsForUser(state.user); renderCardsUI(); renderVocabList(); updateUserArea(); }

function updateUserArea(){ const state = loadCurrentState(); const area = q('user-area'); area.innerHTML=''; if(state.user){ const span = document.createElement('span'); span.textContent = `你好，${state.user.name}`; area.appendChild(span); const btn = document.createElement('button'); btn.textContent='登出'; btn.style.marginLeft='8px'; btn.addEventListener('click', ()=>{ if(confirm('確定登出？')){ saveUser(null); onUserChanged(null); } }); area.appendChild(btn); } else { const btn = document.createElement('button'); btn.textContent='假登入'; btn.addEventListener('click', ()=> openModal('login-modal')); area.appendChild(btn); } }

// import for cards/vocabs
function importJSONFile(file){ const reader = new FileReader(); reader.onload = (e)=>{ try{ const parsed = JSON.parse(e.target.result); if(!parsed.cards || !Array.isArray(parsed.cards)){ alert('匯入檔案格式不正確（找不到 cards 陣列）'); return; } if(!confirm('匯入會覆蓋你目前的卡片與單字，確定要覆蓋嗎？')) return; cards = parsed.cards.map(c=>({ ...c })); vocabs = parsed.vocabs && Array.isArray(parsed.vocabs) ? parsed.vocabs.map(v=>({ ...v })) : []; const state = loadCurrentState(); saveCardsForUser(state.user, cards); saveVocabsForUser(state.user, vocabs); if(parsed.stars) saveStarsForUser(state.user, parsed.stars); renderCardsUI(); renderVocabList(); alert('匯入完成'); }catch(err){ alert('解析 JSON 失敗: ' + err.message); } }; reader.readAsText(file); }

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
