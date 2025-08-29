/* D&D 5e Character Manager
 * Pure client-side. Data stored in localStorage under key "dnd5eCharacters".
 */

const STORAGE_KEY = 'dnd5eCharacters_v1';

// Static data
const ABILITIES = [
  { key: 'str', name: 'STR' },
  { key: 'dex', name: 'DEX' },
  { key: 'con', name: 'CON' },
  { key: 'int', name: 'INT' },
  { key: 'wis', name: 'WIS' },
  { key: 'cha', name: 'CHA' },
];

const SAVING_THROWS = ABILITIES.map(a => ({ ability: a.key, label: a.name }));

const SKILLS = [
  { key: 'acrobatics', label: 'Acrobatics', ability: 'dex' },
  { key: 'animalHandling', label: 'Animal Handling', ability: 'wis' },
  { key: 'arcana', label: 'Arcana', ability: 'int' },
  { key: 'athletics', label: 'Athletics', ability: 'str' },
  { key: 'deception', label: 'Deception', ability: 'cha' },
  { key: 'history', label: 'History', ability: 'int' },
  { key: 'insight', label: 'Insight', ability: 'wis' },
  { key: 'intimidation', label: 'Intimidation', ability: 'cha' },
  { key: 'investigation', label: 'Investigation', ability: 'int' },
  { key: 'medicine', label: 'Medicine', ability: 'wis' },
  { key: 'nature', label: 'Nature', ability: 'int' },
  { key: 'perception', label: 'Perception', ability: 'wis' },
  { key: 'performance', label: 'Performance', ability: 'cha' },
  { key: 'persuasion', label: 'Persuasion', ability: 'cha' },
  { key: 'religion', label: 'Religion', ability: 'int' },
  { key: 'sleightOfHand', label: 'Sleight of Hand', ability: 'dex' },
  { key: 'stealth', label: 'Stealth', ability: 'dex' },
  { key: 'survival', label: 'Survival', ability: 'wis' },
];

const DEFAULT_SPELL_SLOT_LEVELS = 9; // 1..9

// D&D 5e selections (core/common choices). This is not exhaustive but covers standard PHB options.
const CLASSES = [
  'Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'
];

// Example subclass mapping (keyed by class name). Keep values as arrays of common subclasses.
const SUBCLASSES = {
  Barbarian: ['Path of the Berserker','Path of the Totem Warrior','Path of the Zealot'],
  Bard: ['College of Lore','College of Valor','College of Glamour'],
  Cleric: ['Life Domain','Light Domain','Trickery Domain','War Domain'],
  Druid: ['Circle of the Land','Circle of the Moon'],
  Fighter: ['Champion','Battle Master','Eldritch Knight'],
  Monk: ['Way of the Open Hand','Way of Shadow','Way of the Four Elements'],
  Paladin: ['Oath of Devotion','Oath of the Ancients','Oath of Vengeance'],
  Ranger: ['Hunter','Beast Master'],
  Rogue: ['Thief','Assassin','Arcane Trickster'],
  Sorcerer: ['Draconic Bloodline','Wild Magic'],
  Warlock: ['The Fiend','The Archfey','The Great Old One'],
  Wizard: ['School of Evocation','School of Illusion','School of Necromancy']
};

const RACES = [
  'Human','Dwarf','Elf','Halfling','Dragonborn','Gnome','Half-Elf','Half-Orc','Tiefling'
];

const ALIGNMENTS = [
  'Lawful Good','Neutral Good','Chaotic Good',
  'Lawful Neutral','True Neutral','Chaotic Neutral',
  'Lawful Evil','Neutral Evil','Chaotic Evil'
];

// State
let characters = loadCharacters();
let currentId = characters.length ? characters[0].id : createNewCharacter().id;

// Utility Functions
function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxx-xxxx'.replace(/[x]/g, () => (Math.random()*16|0).toString(16));
}

function abilityMod(score) {
  score = parseInt(score, 10) || 0;
  return Math.floor((score - 10) / 2);
}

function proficiencyBonus(level) {
  level = parseInt(level, 10) || 1;
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  if (level < 17) return 5;
  return 6;
}

function formatMod(mod) {
  return (mod >= 0 ? '+' : '') + mod;
}

function loadCharacters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.warn('Failed to load characters', e);
    return [];
  }
}

function saveCharacters() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

function createNewCharacter(name = 'New Character') {
  const newChar = {
    id: uuid(),
    name,
    playerName: '',
    class: '',
    subclass: '',
    race: '',
    background: '',
    alignment: '',
    xp: 0,
    level: 1,
    inspiration: false,
    abilities: {
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
    },
    savingThrows: {
      str: false, dex: false, con: false, int: false, wis: false, cha: false
    },
    skills: Object.fromEntries(SKILLS.map(s => [s.key, { prof: false, exp: false }])),
    ac: 10,
    initiativeMisc: 0,
    speed: 30,
    passiveStealth: '',
    hitDice: '1d8',
    maxHp: 10,
    currentHp: 10,
    tempHp: 0,
    deathSaves: { success: [false,false,false], failure:[false,false,false] },
    currency: { cp:0, sp:0, ep:0, gp:0, pp:0 },
    carriedWeight: 0,
    equipment: '',
    attacks: [],
    spellSlots: Object.fromEntries(Array.from({length: DEFAULT_SPELL_SLOT_LEVELS}, (_,i)=>[i+1,{max:0,used:0}])),
    features: '',
    notes: ''
  };
  characters.push(newChar);
  saveCharacters();
  return newChar;
}

function getCurrentChar() {
  return characters.find(c => c.id === currentId);
}

function updateCharacter(partial) {
  const idx = characters.findIndex(c => c.id === currentId);
  if (idx === -1) return;
  characters[idx] = { ...characters[idx], ...partial };
  saveCharacters();
  renderEverything();
}

function deepSet(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  while (parts.length > 1) {
    const p = parts.shift();
    if (!(p in cur)) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[0]] = value;
}

function deepGet(obj, path) {
  return path.split('.').reduce((acc, p) => acc && acc[p], obj);
}

// Rendering
const characterSelectEl = document.getElementById('characterSelect');

function renderCharacterSelect() {
  characterSelectEl.innerHTML = '';
  characters.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    if (c.id === currentId) opt.selected = true;
    characterSelectEl.appendChild(opt);
  });
}

function buildAbilitiesUI() {
  const container = document.querySelector('.abilities-grid');
  container.innerHTML = '';
  ABILITIES.forEach(ab => {
    const box = document.createElement('div');
    box.className = 'ability-box';
    box.innerHTML = `
      <h3>${ab.name}</h3>
      <input type="number" min="1" max="30" data-bind="abilities.${ab.key}" />
      <div class="ability-mod" data-mod="${ab.key}">+0</div>
    `;
    container.appendChild(box);
  });
}

function populateSelectOptions() {
  const classEl = document.getElementById('class');
  const subclassEl = document.getElementById('subclass');
  const raceEl = document.getElementById('race');
  const alignEl = document.getElementById('alignment');

  // Populate classes
  CLASSES.forEach(c => {
    const opt = document.createElement('option'); opt.value = c; opt.textContent = c; classEl.appendChild(opt);
  });

  // Populate races
  RACES.forEach(r => { const opt = document.createElement('option'); opt.value = r; opt.textContent = r; raceEl.appendChild(opt); });

  // Populate alignments
  ALIGNMENTS.forEach(a => { const opt = document.createElement('option'); opt.value = a; opt.textContent = a; alignEl.appendChild(opt); });

  // Populate subclass when class changes and dispatch an input event so the generic binder saves it
  classEl.addEventListener('change', e => {
    const cls = e.target.value;
    updateSubclassOptions(cls);
    const inputEvent = new Event('input', { bubbles: true });
    classEl.dispatchEvent(inputEvent);
  });

  // Dispatch an input event when subclass/race/alignment change so generic binding saves values
  subclassEl.addEventListener('change', () => {
    subclassEl.dispatchEvent(new Event('input', { bubbles: true }));
  });
  raceEl.addEventListener('change', () => {
    raceEl.dispatchEvent(new Event('input', { bubbles: true }));
  });
  alignEl.addEventListener('change', () => {
    alignEl.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function updateSubclassOptions(className) {
  const subclassEl = document.getElementById('subclass');
  // Clear current options
  subclassEl.innerHTML = '';
  const empty = document.createElement('option'); empty.value = ''; empty.textContent = '— Select Subclass —';
  subclassEl.appendChild(empty);
  if (!className || !SUBCLASSES[className]) return;
  SUBCLASSES[className].forEach(sc => {
    const opt = document.createElement('option'); opt.value = sc; opt.textContent = sc; subclassEl.appendChild(opt);
  });
}

function buildSavingThrowsUI() {
  const container = document.getElementById('savingThrows');
  container.innerHTML = '';
  SAVING_THROWS.forEach(st => {
    const row = document.createElement('div');
    row.className = 'save-row';
    row.innerHTML = `
      <input type="checkbox" class="save-prof" title="Proficiency" data-bind="savingThrows.${st.ability}">
      <span class="save-name">${st.label}</span>
      <span class="value-pill" data-save="${st.ability}">+0</span>
    `;
    container.appendChild(row);
  });
}

function buildSkillsUI() {
  const container = document.getElementById('skills');
  container.innerHTML = '';
  SKILLS.forEach(sk => {
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `
      <input type="checkbox" class="skill-prof" title="Proficiency" data-skill-prof="${sk.key}">
      <input type="checkbox" class="skill-exp" title="Expertise (doubles proficiency)" data-skill-exp="${sk.key}">
      <span class="skill-name">${sk.label}</span>
      <span class="skill-origin">${sk.ability.toUpperCase()}</span>
      <span class="value-pill" data-skill="${sk.key}">+0</span>
    `;
    container.appendChild(row);
  });
}

function buildSpellSlotsUI() {
  const container = document.getElementById('spellSlots');
  container.innerHTML = '';
  for (let level = 1; level <= DEFAULT_SPELL_SLOT_LEVELS; level++) {
    const div = document.createElement('div');
    div.className = 'slot-box';
    div.innerHTML = `
      <div class="slot-level">Level ${level}</div>
      <label>Max
        <input type="number" min="0" data-slot-max="${level}">
      </label>
      <label>Used
        <input type="number" min="0" data-slot-used="${level}">
      </label>
      <div class="slot-remaining" data-slot-remaining="${level}">0 / 0</div>
    `;
    container.appendChild(div);
  }
}

function buildAttacksUI() {
  const container = document.getElementById('attacksList');
  const char = getCurrentChar();
  container.innerHTML = '';
  char.attacks.forEach((atk, idx) => {
    const row = document.createElement('div');
    row.className = 'attack-row';
    row.innerHTML = `
      <label>Name
        <input type="text" data-attack="${idx}.name" value="${atk.name}">
      </label>
      <label>Atk Bonus
        <input type="text" data-attack="${idx}.attackBonus" value="${atk.attackBonus}">
      </label>
      <label>Damage
        <input type="text" data-attack="${idx}.damage" value="${atk.damage}">
      </label>
      <label>Type
        <input type="text" data-attack="${idx}.type" value="${atk.type}">
      </label>
      <label>Notes
        <input type="text" data-attack="${idx}.notes" value="${atk.notes}">
      </label>
      <button type="button" class="remove-attack" data-remove-attack="${idx}">✕</button>
    `;
    container.appendChild(row);
  });
}

// Binding & Updating UI with Data
function populateFields() {
  const char = getCurrentChar();
  if (!char) return;

  // Simple fields
  const mapping = {
    name: 'name',
    playerName: 'playerName',
    class: 'class',
    subclass: 'subclass',
    race: 'race',
    background: 'background',
    alignment: 'alignment',
    xp: 'xp',
    level: 'level',
    inspiration: 'inspiration',
    ac: 'ac',
    initiativeMisc: 'initiativeMisc',
    speed: 'speed',
    passiveStealth: 'passiveStealth',
    hitDice: 'hitDice',
    maxHp: 'maxHp',
    currentHp: 'currentHp',
    tempHp: 'tempHp',
    cp: 'currency.cp',
    sp: 'currency.sp',
    ep: 'currency.ep',
    gp: 'currency.gp',
    pp: 'currency.pp',
    carriedWeight: 'carriedWeight',
    equipment: 'equipment',
    features: 'features',
    notes: 'notes'
  };

  // Ensure subclass options exist for this character's class before setting select values
  const classVal = deepGet(char, 'class') || '';
  if (classVal) updateSubclassOptions(classVal);

  Object.entries(mapping).forEach(([id, path]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const value = deepGet(char, path) ?? '';
    if (el.type === 'checkbox') {
      el.checked = !!value;
    } else {
      // Support selects as well
      el.value = value;
    }
  });


  // Abilities
  ABILITIES.forEach(a => {
    const input = document.querySelector(`[data-bind="abilities.${a.key}"]`);
    if (input) input.value = char.abilities[a.key];
  });

  // Saving throws
  ABILITIES.forEach(a => {
    const input = document.querySelector(`[data-bind="savingThrows.${a.key}"]`);
    if (input) input.checked = !!char.savingThrows[a.key];
  });

  // Skills
  SKILLS.forEach(sk => {
    const prof = document.querySelector(`[data-skill-prof="${sk.key}"]`);
    const exp = document.querySelector(`[data-skill-exp="${sk.key}"]`);
    if (prof) prof.checked = !!char.skills[sk.key].prof;
    if (exp) exp.checked = !!char.skills[sk.key].exp;
  });

  // Death saves
  document.querySelectorAll('.death-save.success').forEach((cb, i) => {
    cb.checked = char.deathSaves.success[i];
  });
  document.querySelectorAll('.death-save.failure').forEach((cb, i) => {
    cb.checked = char.deathSaves.failure[i];
  });

  // Spell slots
  for (let lvl=1; lvl<=DEFAULT_SPELL_SLOT_LEVELS; lvl++) {
    const slot = char.spellSlots[lvl];
    const maxEl = document.querySelector(`[data-slot-max="${lvl}"]`);
    const usedEl = document.querySelector(`[data-slot-used="${lvl}"]`);
    const remEl = document.querySelector(`[data-slot-remaining="${lvl}"]`);
    if (slot) {
      if (maxEl) maxEl.value = slot.max;
      if (usedEl) usedEl.value = slot.used;
      if (remEl) remEl.textContent = `${Math.max(slot.max - slot.used,0)} / ${slot.max}`;
    }
  }

  // Attacks
  buildAttacksUI();

  // Derived
  updateDerivedFields();
}

function updateDerivedFields() {
  const char = getCurrentChar();
  if (!char) return;
  const prof = proficiencyBonus(char.level);
  document.getElementById('proficiencyBonus').textContent = formatMod(prof);

  // Ability modifiers
  ABILITIES.forEach(a => {
    const mod = abilityMod(char.abilities[a.key]);
    const el = document.querySelector(`[data-mod="${a.key}"]`);
    if (el) el.textContent = formatMod(mod);
  });

  // Saving throws
  ABILITIES.forEach(a => {
    const baseMod = abilityMod(char.abilities[a.key]);
    const total = baseMod + (char.savingThrows[a.key] ? prof : 0);
    const el = document.querySelector(`[data-save="${a.key}"]`);
    if (el) el.textContent = formatMod(total);
  });

  // Skills
  SKILLS.forEach(sk => {
    const baseMod = abilityMod(char.abilities[sk.ability]);
    const skillData = char.skills[sk.key];
    let total = baseMod;
    if (skillData.exp) {
      total += prof * 2;
    } else if (skillData.prof) {
      total += prof;
    }
    const el = document.querySelector(`[data-skill="${sk.key}"]`);
    if (el) el.textContent = formatMod(total);
  });

  // Passive Perception
  const perceptionSkill = char.skills.perception;
  let passive = 10 + abilityMod(char.abilities.wis);
  if (perceptionSkill.exp) passive += prof * 2;
  else if (perceptionSkill.prof) passive += prof;
  document.getElementById('passivePerception').textContent = passive;

  // Initiative
  const initTotal = abilityMod(char.abilities.dex) + (parseInt(char.initiativeMisc,10)||0);
  document.getElementById('initiativeTotal').textContent = formatMod(initTotal);

  // Carrying capacity
  document.getElementById('carryingCapacity').value = (char.abilities.str * 15) || 0;

  // Wealth total in gp
  const wealth = (char.currency.cp/100) + (char.currency.sp/10) + (char.currency.ep*0.5) + char.currency.gp + (char.currency.pp*10);
  document.getElementById('wealthTotal').textContent = wealth.toFixed(2);

  // Spell slot remaining already set, but ensure not negative
  for (let lvl=1; lvl<=DEFAULT_SPELL_SLOT_LEVELS; lvl++) {
    const slot = char.spellSlots[lvl];
    if (slot) {
      const remEl = document.querySelector(`[data-slot-remaining="${lvl}"]`);
      if (remEl) remEl.textContent = `${Math.max(slot.max - slot.used,0)} / ${slot.max}`;
    }
  }
}

function renderEverything() {
  renderCharacterSelect();
  populateFields();
}

// Event Wiring
function attachListeners() {

  // Character switching
  characterSelectEl.addEventListener('change', e => {
    currentId = e.target.value;
    renderEverything();
  });

  // New character
  document.getElementById('newCharacterBtn').addEventListener('click', () => {
    const name = prompt('Character name?','New Character');
    const char = createNewCharacter(name || 'New Character');
    currentId = char.id;
    renderEverything();
  });

  // Duplicate character
  document.getElementById('duplicateCharacterBtn').addEventListener('click', () => {
    const cur = getCurrentChar();
    if (!cur) return;
    const copy = JSON.parse(JSON.stringify(cur));
    copy.id = uuid();
    copy.name = cur.name + ' Copy';
    characters.push(copy);
    saveCharacters();
    currentId = copy.id;
    renderEverything();
  });

  // Delete character
  document.getElementById('deleteCharacterBtn').addEventListener('click', () => {
    if (!confirm('Delete current character? This cannot be undone.')) return;
    characters = characters.filter(c => c.id !== currentId);
    if (!characters.length) {
      const c = createNewCharacter();
      currentId = c.id;
    } else {
      currentId = characters[0].id;
    }
    saveCharacters();
    renderEverything();
  });

  // Reset all
  document.getElementById('resetAllBtn').addEventListener('click', () => {
    if (!confirm('Reset ALL stored characters? This cannot be undone.')) return;
    characters = [];
    localStorage.removeItem(STORAGE_KEY);
    const c = createNewCharacter();
    currentId = c.id;
    renderEverything();
  });

  // Export
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(characters, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = 'dnd5e_characters.json';
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  });

  // Import
  document.getElementById('importFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error('File should contain an array of characters.');
        // Basic sanity check
        data.forEach(c => { if (!c.id) c.id = uuid(); });
        characters = data;
        saveCharacters();
        currentId = characters[0].id;
        renderEverything();
        alert('Import successful!');
      } catch (err) {
        alert('Import failed: ' + err.message);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  });

  // Generic input binding (delegation)
  document.body.addEventListener('input', e => {
    const target = e.target;
    const char = getCurrentChar();
    if (!char) return;

    // Ability binding
    if (target.matches('[data-bind^="abilities."]')) {
      const path = target.getAttribute('data-bind');
      const val = parseInt(target.value,10) || 0;
      deepSet(char, path, val);
      saveCharacters();
      updateDerivedFields();
      return;
    }

    // Saving throw prof
    if (target.matches('[data-bind^="savingThrows."]')) {
      const path = target.getAttribute('data-bind');
      deepSet(char, path, target.checked);
      saveCharacters();
      updateDerivedFields();
      return;
    }

    // Skill prof / exp
    if (target.matches('[data-skill-prof]')) {
      const key = target.getAttribute('data-skill-prof');
      char.skills[key].prof = target.checked;
      if (!target.checked) char.skills[key].exp = false;
      saveCharacters();
      populateFields();
      return;
    }
    if (target.matches('[data-skill-exp]')) {
      const key = target.getAttribute('data-skill-exp');
      if (target.checked && !char.skills[key].prof) {
        // Auto set proficiency if expertise toggled
        char.skills[key].prof = true;
        const profEl = document.querySelector(`[data-skill-prof="${key}"]`);
        if (profEl) profEl.checked = true;
      }
      char.skills[key].exp = target.checked;
      saveCharacters();
      updateDerivedFields();
      return;
    }

    // Spell slots
    if (target.matches('[data-slot-max]')) {
      const level = target.getAttribute('data-slot-max');
      char.spellSlots[level].max = parseInt(target.value,10) || 0;
      if (char.spellSlots[level].used > char.spellSlots[level].max) {
        char.spellSlots[level].used = char.spellSlots[level].max;
      }
      saveCharacters();
      updateDerivedFields();
      return;
    }
    if (target.matches('[data-slot-used]')) {
      const level = target.getAttribute('data-slot-used');
      let used = parseInt(target.value,10) || 0;
      if (used < 0) used = 0;
      if (used > char.spellSlots[level].max) used = char.spellSlots[level].max;
      char.spellSlots[level].used = used;
      target.value = used;
      saveCharacters();
      updateDerivedFields();
      return;
    }

    // Attacks
    if (target.matches('[data-attack]')) {
      const path = target.getAttribute('data-attack');
      const [idxStr, field] = path.split('.');
      const idx = parseInt(idxStr,10);
      if (!char.attacks[idx]) return;
      char.attacks[idx][field] = target.value;
      saveCharacters();
      return;
    }

    // Generic mapped fields
    const id = target.id;
    const mapping = {
      name: 'name',
      playerName: 'playerName',
      class: 'class',
      subclass: 'subclass',
      race: 'race',
      background: 'background',
      alignment: 'alignment',
      xp: 'xp',
      level: 'level',
      inspiration: 'inspiration',
      ac: 'ac',
      initiativeMisc: 'initiativeMisc',
      speed: 'speed',
      passiveStealth: 'passiveStealth',
      hitDice: 'hitDice',
      maxHp: 'maxHp',
      currentHp: 'currentHp',
      tempHp: 'tempHp',
      cp: 'currency.cp',
      sp: 'currency.sp',
      ep: 'currency.ep',
      gp: 'currency.gp',
      pp: 'currency.pp',
      carriedWeight: 'carriedWeight',
      equipment: 'equipment',
      features: 'features',
      notes: 'notes'
    };
    if (mapping[id]) {
      const path = mapping[id];
      let val;
      if (target.type === 'checkbox') val = target.checked;
      else if (target.type === 'number') val = target.value === '' ? '' : Number(target.value);
      else val = target.value;
      deepSet(char, path, val);
      saveCharacters();
      updateDerivedFields();
    }
  });

  // Click handlers
  document.body.addEventListener('click', e => {
    const target = e.target;

    if (target.matches('#addAttackBtn')) {
      const char = getCurrentChar();
      char.attacks.push({
        name: 'Attack',
        attackBonus: '',
        damage: '',
        type: '',
        notes: ''
      });
      saveCharacters();
      buildAttacksUI();
      return;
    }

    if (target.matches('[data-remove-attack]')) {
      const idx = parseInt(target.getAttribute('data-remove-attack'),10);
      const char = getCurrentChar();
      char.attacks.splice(idx,1);
      saveCharacters();
      buildAttacksUI();
      return;
    }

    if (target.matches('#resetDeathSaves')) {
      const char = getCurrentChar();
      char.deathSaves = { success:[false,false,false], failure:[false,false,false] };
      saveCharacters();
      populateFields();
      return;
    }
  });

  // Death saves
  document.body.addEventListener('change', e => {
    if (e.target.classList.contains('death-save')) {
      const char = getCurrentChar();
      const successes = Array.from(document.querySelectorAll('.death-save.success')).map(cb => cb.checked);
      const failures = Array.from(document.querySelectorAll('.death-save.failure')).map(cb => cb.checked);
      char.deathSaves.success = successes;
      char.deathSaves.failure = failures;
      saveCharacters();
    }
  });
}

// Initialization
function init() {
  buildAbilitiesUI();
  buildSavingThrowsUI();
  buildSkillsUI();
  buildSpellSlotsUI();
  populateSelectOptions();
  attachListeners();
  renderEverything();
}

init();