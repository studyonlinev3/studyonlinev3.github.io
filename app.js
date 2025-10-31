// Sample initial data for cards. In production this could be replaced by a CMS or JSON file.
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

let cards = [
  { id: 'ch-1', subject: 'ch', title: '文言常見詞彙', content: '「蓋」通常表示原因或解釋；注意句中功能。' },
  { id: 'en-1', subject: 'en', title: '時態重點', content: '現在完成式表過去到現在的影響，用 have/has + p.p.' },
  { id: 'ma-1', subject: 'ma', title: '微分基本法則', content: '常見函數求導規則：和差、乘法、鏈式法則。' },
  { id: 'chm-1', subject: 'chm', title: '摩爾數', content: 'n = m / M（質量除以摩爾質量）。' },
  { id: 'bio-1', subject: 'bio', title: 'DNA 結構', content: '雙螺旋、鹼基配對 A-T, C-G。' },
  { id: 'phy-1', subject: 'phy', title: '牛頓第二定律', content: 'F = ma，注意方向為向量。' },
  { id: 'geo-1', subject: 'geo', title: '岩石分類', content: '火成、堆積與變質三大類。' },
  { id: 'soc-1', subject: 'soc', title: '公民權利', content: '言論自由、選舉權等基本權利。' }
];

// State stored in localStorage
const STORAGE_KEYS = {
  stars: 'study_cards_starred_v1',
  user: 'study_cards_user_v1',
  cards: 'study_cards_cards_v1'
};

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEYS.stars);
  const starred = raw ? JSON.parse(raw) : {};
  const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null');
  const savedCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.cards) || 'null');
  if(savedCards && Array.isArray(savedCards)) cards = savedCards;
  return { starred, user };
}

function saveStars(starred){
  localStorage.setItem(STORAGE_KEYS.stars, JSON.stringify(starred));
}
function saveCards(){
  localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(cards));
}
function saveUser(user){
  if(user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEYS.user);
}

// Render helpers
function q(id){ return document.getElementById(id); }

function renderSubjectSelect(selectEl){
  selectEl.innerHTML = '';
  const optAll = document.createElement('option'); optAll.value='all'; optAll.textContent='全部'; selectEl.appendChild(optAll);
  SUBJECTS.forEach(s=>{
    const o = document.createElement('option'); o.value=s.key; o.textContent=s.name; selectEl.appendChild(o);
  });
}

function renderNewCardSubjectSelect(selectEl){
  selectEl.innerHTML = '';
  SUBJECTS.forEach(s=>{
    const o = document.createElement('option'); o.value=s.key; o.textContent=s.name; selectEl.appendChild(o);
  });
}

function renderCardsUI(){
  const container = q('cards');
  container.innerHTML = '';
  const state = loadState();
  const subject = q('subject-select').value;
  const query = q('search-input').value.trim().toLowerCase();
  const onlyStarred = q('show-starred').checked;

  const filtered = cards.filter(c=>{
    if(subject !== 'all' && c.subject !== subject) return false;
    if(onlyStarred && !state.starred[c.id]) return false;
    if(query){
      return (c.title+ ' ' + c.content).toLowerCase().includes(query);
    }
    return true;
  });

  if(filtered.length === 0){
    const empty = document.createElement('div'); empty.textContent = '找不到卡片 — 試試新增或變更篩選條件。'; empty.style.color='#666'; container.appendChild(empty);
    return;
  }

  filtered.forEach(c=>{
    const el = document.createElement('article'); el.className='card';
    const h = document.createElement('h3'); h.textContent = c.title; el.appendChild(h);
    const p = document.createElement('p'); p.textContent = c.content; el.appendChild(p);
    const meta = document.createElement('div'); meta.className='meta';
    const subjName = SUBJECTS.find(s=>s.key===c.subject)?.name || c.subject;
    meta.innerHTML = `<small>${subjName} • ID:${c.id}</small>`;
    el.appendChild(meta);

    const star = document.createElement('button'); star.className='star-btn'; star.title='加入或移除星號';
    star.innerHTML = state.starred[c.id] ? '★' : '☆';
    if(state.starred[c.id]) star.classList.add('starred');
    star.addEventListener('click', (e)=>{
      e.stopPropagation();
      toggleStar(c.id);
      renderCardsUI();
    });
    el.appendChild(star);

    container.appendChild(el);
  });
}

function toggleStar(id){
  const state = loadState();
  if(state.starred[id]) delete state.starred[id]; else state.starred[id]=true;
  saveStars(state.starred);
}

function openModal(id){ 
  const el = q(id); 
  el.classList.remove('hidden'); 
  el.setAttribute('aria-hidden','false');
}
function closeModal(id){ 
  const el = q(id); 
  el.classList.add('hidden'); 
  el.setAttribute('aria-hidden','true');
}

function setup(){
  // populate selects
  renderSubjectSelect(q('subject-select'));
  renderNewCardSubjectSelect(q('new-card-subject'));

  // wire events
  q('subject-select').addEventListener('change', renderCardsUI);
  q('search-input').addEventListener('input', renderCardsUI);
  q('show-starred').addEventListener('change', renderCardsUI);

  // login
  q('login-btn').addEventListener('click', ()=>{
    const state = loadState();
    if(state.user){
      if(confirm('確定要登出嗎？')){
        saveUser(null); updateUserArea();
      }
    } else {
      openModal('login-modal');
    }
  });

  q('login-cancel').addEventListener('click', ()=> closeModal('login-modal'));
  q('login-submit').addEventListener('click', ()=>{
    const username = q('login-username').value.trim();
    // fake login: accept any username/password
    if(!username){ alert('請輸入使用者名稱'); return; }
    saveUser({ name: username });
    closeModal('login-modal');
    updateUserArea();
  });

  updateUserArea();

  // new card
  q('new-card-btn').addEventListener('click', ()=> openModal('new-card-modal'));
  q('new-card-cancel').addEventListener('click', ()=> closeModal('new-card-modal'));
  q('new-card-save').addEventListener('click', ()=> {
    const s = q('new-card-subject').value;
    const title = q('new-card-title').value.trim();
    const content = q('new-card-content').value.trim();
    if(!title || !content){ alert('請填寫標題與內容'); return; }
    // id generate
    const newid = `${s}-${Date.now()}`;
    cards.unshift({ id: newid, subject: s, title, content });
    saveCards();
    closeModal('new-card-modal');
    // reset form
    q('new-card-title').value=''; q('new-card-content').value='';
    renderCardsUI();
  });

  renderCardsUI();
}

function updateUserArea(){
  const state = loadState();
  const area = q('user-area');
  area.innerHTML = '';
  if(state.user){
    const span = document.createElement('span'); span.textContent = `你好，${state.user.name}`;
    area.appendChild(span);
    const btn = document.createElement('button'); btn.textContent='登出'; btn.style.marginLeft='8px';
    btn.addEventListener('click', ()=>{ if(confirm('確定登出？')){ saveUser(null); updateUserArea(); } });
    area.appendChild(btn);
  } else {
    const btn = document.createElement('button'); btn.id='login-btn-top'; btn.textContent='假登入';
    btn.addEventListener('click', ()=> openModal('login-modal'));
    area.appendChild(btn);
    // attach same main login button behavior
    const mainBtn = q('login-btn'); if(mainBtn) mainBtn.addEventListener('click', ()=> openModal('login-modal'));
  }
}

// initialize on DOM ready
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();