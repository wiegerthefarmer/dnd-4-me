/* D&D 5e Character Manager
 * Pure client-side. Data stored in localStorage under key "dnd5eCharacters".
 */

const STORAGE_KEY = 'dnd5eCharacters_v1';
const SETTINGS_KEY = 'dnd5eSettings_v1';

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

// Limits and class skill counts (core PHB defaults). These do NOT include background or racial proficiencies.
const SKILL_LIMITS = {
  Barbarian: 2,
  Bard: 3,
  Cleric: 2,
  Druid: 2,
  Fighter: 2,
  Monk: 2,
  Paladin: 2,
  Ranger: 3,
  Rogue: 4,
  Sorcerer: 2,
  Warlock: 2,
  Wizard: 2
};

const MAX_SAVING_THROWS = 2; // most classes give 2 saving throw proficiencies

// PHB-accurate mappings (core 12 classes)
const CLASS_SAVING_THROWS = {
  Barbarian: ['str','con'],
  Bard: ['dex','cha'],
  Cleric: ['wis','cha'],
  Druid: ['int','wis'],
  Fighter: ['str','con'],
  Monk: ['str','dex'],
  Paladin: ['wis','cha'],
  Ranger: ['str','dex'],
  Rogue: ['dex','int'],
  Sorcerer: ['con','cha'],
  Warlock: ['wis','cha'],
  Wizard: ['int','wis']
};

// PHB-accurate class skill choices (skill keys must match the SKILLS[] keys above)
const CLASS_SKILL_CHOICES = {
  Barbarian: ['animalHandling','athletics','intimidation','nature','perception','survival'],
  Bard: SKILLS.map(s => s.key), // choose any three
  Cleric: ['history','insight','medicine','persuasion','religion'],
  Druid: ['arcana','animalHandling','insight','medicine','nature','perception','religion','survival'],
  Fighter: ['acrobatics','animalHandling','athletics','history','insight','intimidation','perception','survival'],
  Monk: ['acrobatics','athletics','history','insight','religion','stealth'],
  Paladin: ['athletics','insight','intimidation','medicine','persuasion','religion'],
  Ranger: ['animalHandling','athletics','insight','investigation','nature','perception','stealth','survival'],
  Rogue: ['acrobatics','athletics','deception','insight','intimidation','investigation','perception','performance','persuasion','sleightOfHand','stealth'],
  Sorcerer: ['arcana','deception','insight','intimidation','persuasion','religion'],
  Warlock: ['arcana','deception','history','intimidation','investigation','nature','religion'],
  Wizard: ['arcana','history','insight','investigation','medicine','religion']
};

// Expertise slots by class and level (PHB base rules). Returns total allowed expertise choices.
function expertiseSlotsForChar(char) {
  const cls = char.class || '';
  const lvl = parseInt(char.level,10) || 1;
  let slots = 0;
  if (cls === 'Rogue') {
    if (lvl >= 1) slots += 2;
    if (lvl >= 6) slots += 2; // total 4 at 6th
  }
  if (cls === 'Bard') {
    if (lvl >= 3) slots += 2;
    if (lvl >= 10) slots += 2; // total 4 at 10th
  }
  // Other classes / subclasses may grant expertise (e.g., Lore college, some Roguish archetypes);
  // those are out of scope for core PHB base class entries here.
  return slots;
}

// Apply class defaults to a character (auto-check class saving throws). This mutates the char object.
function applyClassDefaults(char) {
  if (!char) return;
  const cls = char.class || '';
  const classSaves = CLASS_SAVING_THROWS[cls] || [];
  // Ensure class saving throws are set to true
  Object.keys(char.savingThrows).forEach(k => {
    if (classSaves.includes(k)) char.savingThrows[k] = true;
  });
  // Note: we intentionally do not clear other saving throw proficiencies because
  // background or user choices might add them; UI will still enforce the max allowed.
}

// State
let characters = loadCharacters();
let currentId = characters.length ? characters[0].id : createNewCharacter().id;
let settings = loadSettings();

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { allowClassOverride: false };
    return JSON.parse(raw);
  } catch (e) { return { allowClassOverride:false }; }
}
function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }

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
    // Re-populate fields to enforce new class limits and apply class defaults
    setTimeout(() => {
      const char = getCurrentChar();
      if (char) {
        applyClassDefaults(char);
        saveCharacters();
        populateFields();
      }
    }, 0);
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

function enforceSavingThrowLimits(char) {
  // Lock class-granted saving throws and disable selecting more than allowed class picks.
  const cls = (char && char.class) || '';
  const classSaves = CLASS_SAVING_THROWS[cls] || [];
  const checks = Array.from(document.querySelectorAll('[data-bind^="savingThrows."]'));

  // Count current checked (including class-granted ones)
  const checked = checks.filter(c => c.checked).length;

  checks.forEach(c => {
    const path = c.getAttribute('data-bind');
    const key = path.split('.').pop();
    const row = c.closest('.save-row');
    // Clean up any existing lock node
    const existingLock = row && row.querySelector('.save-lock');
    if (existingLock) existingLock.remove();

    // If this save is a class-granted save
    if (classSaves.includes(key)) {
      c.checked = true;
      // If user allows override, do not disable; otherwise lock it
      if (settings.allowClassOverride) {
        c.disabled = false;
      } else {
        c.disabled = true;
        // show small lock indicator
        if (row) {
          const lock = document.createElement('span');
          lock.className = 'save-lock';
          lock.title = 'Class-granted save (locked)';
          lock.textContent = '🔒';
          row.appendChild(lock);
        }
      }
      return;
    }
    // Otherwise, disable if not checked and we've reached the max allowed (treat class saves as part of the count)
    if (!c.checked && checked >= MAX_SAVING_THROWS) c.disabled = true;
    else c.disabled = false;
  });

  // Update badge showing class-granted saves
  try {
    const badge = document.getElementById('savingThrowsBadge');
    if (badge) {
      const cls = char.class || '';
      const classSaves = CLASS_SAVING_THROWS[cls] || [];
      if (classSaves.length) {
        badge.textContent = `Class saves: ${classSaves.map(s=>s.toUpperCase()).join(', ')}`;
        badge.title = `These saving throws are granted by your class and are locked.`;
      } else {
        badge.textContent = 'Class saves: —';
        badge.title = 'No class-granted saving throws detected.';
      }
    }
  } catch (e) { /* noop */ }
}

function enforceSkillLimits(char) {
  const cls = char.class || '';
  const allowed = SKILL_LIMITS[cls] || 0;
  const allowedSkills = CLASS_SKILL_CHOICES[cls] || SKILLS.map(s => s.key);

  // Count proficiencies that are within the class-allowed choices (class picks)
  const profChecks = Array.from(document.querySelectorAll('[data-skill-prof]'));
  const profCountAllowed = profChecks.filter(cb => {
    const key = cb.getAttribute('data-skill-prof');
    return cb.checked && allowedSkills.includes(key);
  }).length;

  profChecks.forEach(cb => {
    const key = cb.getAttribute('data-skill-prof');
    // If the skill is not in the class choices:
    if (!allowedSkills.includes(key)) {
      // If the character already has it (background/racial), keep it checked but disable changes
      if (char.skills[key] && char.skills[key].prof) {
        cb.checked = true;
        cb.disabled = true;
      } else {
        // Not allowed to pick as a class skill
        cb.checked = !!char.skills[key].prof;
        cb.disabled = true;
      }
      return;
    }

    // Skill is allowed by class. If count reached, disable unchecked ones.
    if (!cb.checked && allowed > 0 && profCountAllowed >= allowed) cb.disabled = true;
    else cb.disabled = false;
  });

  // Expertise handling: only enable expertise boxes if the class grants expertise slots and the character has proficiency
  const expSlots = expertiseSlotsForChar(char);
  const expChecks = Array.from(document.querySelectorAll('[data-skill-exp]'));
  const currentExpCount = expChecks.filter(cb => cb.checked).length;

  expChecks.forEach(expCb => {
    const key = expCb.getAttribute('data-skill-exp');
    const profCb = document.querySelector(`[data-skill-prof="${key}"]`);
    // Require proficiency first
    if (!profCb || !profCb.checked) {
      expCb.checked = false;
      expCb.disabled = true;
      return;
    }
    // If class grants expertise slots, allow up to that many; otherwise disable
    if (expSlots <= 0) {
      expCb.disabled = true;
      // keep existing expertise false
      if (expCb.checked) {
        expCb.checked = false;
        if (char.skills[key]) char.skills[key].exp = false;
      }
      return;
    }
    // If we've used up expertise slots and this box isn't already checked, disable it
    if (!expCb.checked && currentExpCount >= expSlots) expCb.disabled = true;
    else expCb.disabled = false;
  });

  // Refresh badges
  try {
    const classBadge = document.getElementById('classSkillBadge');
    const expBadge = document.getElementById('expertiseBadge');
    if (classBadge) {
      const profCountAllowedNow = Array.from(document.querySelectorAll('[data-skill-prof]')).filter(cb => {
        const k = cb.getAttribute('data-skill-prof');
        return cb.checked && (CLASS_SKILL_CHOICES[char.class] || SKILLS.map(s=>s.key)).includes(k);
      }).length;
      const allowedNow = SKILL_LIMITS[char.class] || 0;
      classBadge.textContent = `Class picks: ${Math.max(allowedNow - profCountAllowedNow,0)}`;
    }
    if (expBadge) expBadge.textContent = `Expertise: ${expertiseSlotsForChar(char)}`;
  } catch (e) {
    // noop
  }
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

  // Ensure class defaults (class-granted saves) are applied before rendering
  applyClassDefaults(char);

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

  // Update badges for class skill picks and expertise slots
  const cls = char.class || '';
  const allowed = SKILL_LIMITS[cls] || 0;
  const allowedSkills = CLASS_SKILL_CHOICES[cls] || SKILLS.map(s => s.key);
  const profCountAllowed = Object.entries(char.skills).filter(([k,v]) => v.prof && allowedSkills.includes(k)).length;
  const classBadge = document.getElementById('classSkillBadge');
  if (classBadge) classBadge.textContent = `Class picks: ${allowed - profCountAllowed}`;
  const expBadge = document.getElementById('expertiseBadge');
  if (expBadge) expBadge.textContent = `Expertise: ${expertiseSlotsForChar(char)}`;

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

  // Enforce UI limits (saving throws / skills)
  enforceSavingThrowLimits(char);
  enforceSkillLimits(char);
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

  // Export sheet as PNG / PDF (uses html2canvas + jsPDF)
  const exportPngBtn = document.getElementById('exportPngBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  if (exportPngBtn) exportPngBtn.addEventListener('click', async () => {
    const char = getCurrentChar();
    exportPngBtn.disabled = true; const prev = exportPngBtn.textContent; exportPngBtn.textContent = 'Preparing...';
    try { await exportSheetAsImage(char); }
    catch (err) { console.error('Export PNG failed', err); alert('Export PNG failed: ' + (err && err.message)); }
    finally { exportPngBtn.disabled = false; exportPngBtn.textContent = prev; }
  });
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', async () => {
    const char = getCurrentChar();
    exportPdfBtn.disabled = true; const prev = exportPdfBtn.textContent; exportPdfBtn.textContent = 'Preparing...';
    try { await exportSheetAsPDF(char); }
    catch (err) { console.error('Export PDF failed', err); alert('Export PDF failed: ' + (err && err.message)); }
    finally { exportPdfBtn.disabled = false; exportPdfBtn.textContent = prev; }
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
  let val = parseInt(target.value,10) || 0;
  // Enforce ability bounds (3..30). 30 covers magical increases; adapt if needed.
  if (val < 3) val = 3;
  if (val > 30) val = 30;
  target.value = val;
      deepSet(char, path, val);
      saveCharacters();
      updateDerivedFields();
      return;
    }

    // Saving throw prof
    if (target.matches('[data-bind^="savingThrows."]')) {
      const path = target.getAttribute('data-bind');
      // Enforce max saving throw proficiencies (most classes get 2)
      const abilityKey = path.split('.').pop();
      if (target.checked) {
        const currentCount = Object.values(char.savingThrows).filter(Boolean).length;
        if (currentCount >= MAX_SAVING_THROWS) {
          // revert and inform user
          target.checked = false;
          alert(`You can only have ${MAX_SAVING_THROWS} saving throw proficiencies (class dependent).`);
          return;
        }
      }
      deepSet(char, path, target.checked);
      saveCharacters();
      updateDerivedFields();
      // Update UI enabling/disabling
      enforceSavingThrowLimits(char);
      return;
    }

    // Skill prof / exp
    if (target.matches('[data-skill-prof]')) {
      const key = target.getAttribute('data-skill-prof');
      // Enforce class skill limit
      const cls = char.class || '';
      const allowed = SKILL_LIMITS[cls] || 0;
      if (target.checked) {
        const profCount = Object.values(char.skills).filter(s => s.prof).length;
        if (allowed > 0 && profCount >= allowed) {
          target.checked = false;
          alert(`As a ${cls || 'character'}, you may only choose ${allowed} skill proficiencies from your class (background/racial proficiencies not counted here).`);
          return;
        }
      }
      char.skills[key].prof = target.checked;
      if (!target.checked) char.skills[key].exp = false;
      saveCharacters();
      populateFields();
      return;
    }
    if (target.matches('[data-skill-exp]')) {
      const key = target.getAttribute('data-skill-exp');
      // Expertise can only be applied to a skill the character is proficient in
      if (target.checked && !char.skills[key].prof) {
        alert('Expertise requires proficiency first. Please check proficiency before setting expertise.');
        target.checked = false;
        return;
      }
      // For simplicity, allow expertise only for classes that grant it (Rogue, Bard)
      const cls = char.class || '';
      const allowsExpertise = ['Rogue','Bard'].includes(cls);
      if (target.checked && !allowsExpertise) {
        alert(`${cls || 'This class'} does not grant expertise by default. Expertise will be stored but may be outside standard class rules.`);
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

    if (target.matches('#printBtn')) {
      openPrintView();
      return;
    }

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

// Wire settings UI
function wireSettingsUI() {
  const cb = document.getElementById('allowClassOverride');
  if (!cb) return;
  cb.checked = !!settings.allowClassOverride;
  cb.addEventListener('change', e => {
    settings.allowClassOverride = !!e.target.checked;
    saveSettings();
    // Re-apply enforcement so UI updates
    const char = getCurrentChar();
    if (char) enforceSavingThrowLimits(char);
  });
}

// Tutorial modal logic
const TUTORIAL_STEPS = [
  { title: 'Welcome', body: 'This short tutorial will walk you through creating a character: identity, abilities, class & race, skills, and equipment.' },
  { title: 'Name & Identity', body: 'Give your character a Name and Player name. Select a Class and Race from the dropdowns. You can pick a Subclass after choosing the class.', selector: '#class' },
  { title: 'Level & Proficiency', body: 'Set Level to determine your proficiency bonus. The Proficiency Bonus updates automatically.', selector: '#level' },
  { title: 'Abilities', body: 'Set your six ability scores (STR, DEX, CON, INT, WIS, CHA). Modifiers are shown next to each score and update automatically.', selector: '.abilities-grid' },
  { title: 'Saving Throws', body: 'Class-granted saving throw proficiencies are auto-checked and locked by default. Use the "Allow class overrides" setting to unlock them for homebrew.', selector: '#savingThrows' },
  { title: 'Skills & Expertise', body: 'Choose your class skill proficiencies (badge shows remaining picks). Expertise (double proficiency) is available for classes like Rogue and Bard at appropriate levels.', selector: '#skills' },
  { title: 'Combat & HP', body: 'Set Armor Class (AC), Hit Dice, Max HP and Current HP. Initiative is computed from DEX + misc.', selector: '.combat' },
  { title: 'Attacks & Spells', body: 'Add attacks or spell entries in the Attacks panel. Spell slots can be tracked in the Spell Slots panel.', selector: '#attacksList' },
  { title: 'Equipment & Wealth', body: 'Track currency and equipment in the Equipment panel. Carrying capacity is calculated from STR.', selector: '.equipment' },
  { title: 'Save & Export', body: 'Your characters are saved to localStorage. Use Export/Import to move characters between devices.', selector: '.io-buttons' }
];

let tutorialIndex = 0;
function openTutorial(idx=0) {
  tutorialIndex = idx || 0;
  const modal = document.getElementById('tutorialModal');
  if (!modal) return;
  modal.setAttribute('aria-hidden','false');
  renderTutorialStep();
}
function closeTutorial() {
  const modal = document.getElementById('tutorialModal');
  if (!modal) return;
  modal.setAttribute('aria-hidden','true');
  // remove any lingering highlight
  if (window.__tutorialLastHighlighted) {
    window.__tutorialLastHighlighted.classList.remove('tutorial-highlight');
    window.__tutorialLastHighlighted = null;
  }
}
function renderTutorialStep() {
  const content = document.getElementById('tutorialStepContent');
  if (!content) return;
  const step = TUTORIAL_STEPS[tutorialIndex];
  content.innerHTML = `<h4>${step.title}</h4><p>${step.body}</p><p><em>Step ${tutorialIndex+1} of ${TUTORIAL_STEPS.length}</em></p>`;
  document.getElementById('tutorialPrev').disabled = tutorialIndex === 0;
  document.getElementById('tutorialNext').textContent = tutorialIndex === TUTORIAL_STEPS.length-1 ? 'Finish' : 'Next ▶';

  // remove previous highlight
  if (window.__tutorialLastHighlighted) {
    window.__tutorialLastHighlighted.classList.remove('tutorial-highlight');
    window.__tutorialLastHighlighted = null;
  }

  // If the step references a selector, scroll it into view and highlight briefly
  if (step.selector) {
    const el = document.querySelector(step.selector);
    if (el) {
      // scroll the target into view (center)
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(e) { el.scrollIntoView(); }
      // add highlight class
      el.classList.add('tutorial-highlight');
      window.__tutorialLastHighlighted = el;
      // focus first focusable element inside
      const focusable = el.querySelector('input,select,button,textarea');
      if (focusable) focusable.focus({ preventScroll: true });
    }
  }
}

function wireTutorialUI() {
  const openBtn = document.getElementById('tutorialBtn');
  if (openBtn) openBtn.addEventListener('click', () => openTutorial(0));
  const prev = document.getElementById('tutorialPrev');
  const next = document.getElementById('tutorialNext');
  const close = document.getElementById('tutorialClose');
  if (prev) prev.addEventListener('click', () => { tutorialIndex = Math.max(0, tutorialIndex-1); renderTutorialStep(); });
  if (next) next.addEventListener('click', () => { if (tutorialIndex < TUTORIAL_STEPS.length-1) tutorialIndex++; else closeTutorial(); renderTutorialStep(); });
  if (close) close.addEventListener('click', closeTutorial);
  // Keep tutorial non-blocking; avoid closing on outside click so users can interact with the page while following the tutorial
}

// Printable character sheet generator
function generatePrintableSheet(char) {
  if (!char) return '';
  const prof = proficiencyBonus(char.level);

  // Helper to render ability boxes inline
  const abilitiesHtml = ABILITIES.map(a => {
    const score = char.abilities[a.key] || 0;
    const mod = abilityMod(score);
    return `<div class="ability-box"><div class="ability-name">${a.name}</div><div class="ability-score">${score}</div><div class="ability-mod">${formatMod(mod)}</div></div>`;
  }).join('');

  // Build small helpers for skills and attacks
  const skillsRows = SKILLS.map(s => {
    const dat = char.skills[s.key] || { prof:false, exp:false };
    const mark = dat.exp ? '★' : (dat.prof ? '●' : '');
    const total = abilityMod(char.abilities[s.ability]) + (dat.exp ? prof*2 : (dat.prof ? prof : 0));
    return { key: s.key, label: s.label, mark, total };
  });

  const attacksHtml = (char.attacks || []).map(atk => `<div class="ps-attack">${atk.name || ''} ${atk.attackBonus ? ('+'+atk.attackBonus) : ''} ${atk.damage ? ('— '+atk.damage) : ''}</div>`).join('');

  // We'll use the uploaded official sheet PNGs as page backgrounds and absolutely position overlays using percentages.
  const sheet = `
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${char.name} — Character Sheet</title>
    <style>
      html,body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif}
      .pages{width:100%;display:flex;flex-direction:column;align-items:center;gap:12px;padding:12px}
      .page{width:820px;height:1122px;position:relative;background-size:cover;background-repeat:no-repeat;background-position:center;border:1px solid #ccc}
      /* overlay common styles */
      .overlay{position:absolute;color:#111}
      .name{left:8%;top:6%;font-size:22px;font-weight:700}
      .meta-line{left:8%;top:10%;font-size:12px}
      .level-box{right:8%;top:6%;position:absolute;text-align:right}

      /* Abilities box positions (left column) */
      .abilities{left:6%;top:18%;width:20%;}
      .ability-box{display:flex;justify-content:space-between;padding:4px 6px;background:transparent}

      /* Skills area (center column) */
      .skills{left:30%;top:18%;width:38%;}
      .ps-skill{display:flex;justify-content:space-between;padding:3px 6px}

      /* Attacks area (center lower) */
      .attacks{left:30%;top:62%;width:38%;}

      /* Right column stats */
      .stats{right:6%;top:18%;width:18%;text-align:left}

      /* Page 2 specifics (equipment, features, notes) */
      .page2 .big-block{left:6%;top:12%;width:88%;}
      .page2 .equipment{left:6%;top:20%;width:88%;height:300px}

      /* Page 3 could hold additional tables — keep generic */
      .page3 .big-block{left:6%;top:10%;width:88%;}

      /* small typographic tuning */
      .label{font-size:11px;color:#222}
    </style>
  </head>
  <body>
    <div class="pages">
      <!-- Page 1: main sheet -->
  <div class="page page1" style="background-image:url('${DATA_URI_PAGE_1}')">
        <div class="overlay name" style="position:absolute">${char.name || ''}</div>
        <div class="overlay meta-line" style="position:absolute">${char.race || ''} • ${char.class || ''} ${char.subclass ? '('+char.subclass+')' : ''}</div>
        <div class="overlay level-box" style="position:absolute">Level ${char.level} &nbsp; PB ${formatMod(prof)}</div>

        <div class="overlay abilities" style="position:absolute">
          ${ABILITIES.map(a=>`<div class="ability-box"><div class="ability-name">${a.name}</div><div class="ability-score">${char.abilities[a.key]||0}</div><div class="ability-mod">${formatMod(abilityMod(char.abilities[a.key]))}</div></div>`).join('')}
        </div>

        <div class="overlay skills" style="position:absolute">
          ${skillsRows.map(s => `<div class="ps-skill"><div class="label">${s.mark} ${s.label}</div><div class="label">${formatMod(s.total)}</div></div>`).join('')}
        </div>

        <div class="overlay attacks" style="position:absolute">
          ${attacksHtml}
        </div>

        <div class="overlay stats" style="position:absolute">
          <div class="label">AC: ${char.ac || ''}</div>
          <div class="label">HP: ${char.currentHp || ''} / ${char.maxHp || ''}</div>
          <div class="label">Hit Dice: ${char.hitDice || ''}</div>
        </div>
      </div>

      <!-- Page 2: equipment / features -->
  <div class="page page2" style="background-image:url('${DATA_URI_PAGE_2}')">
        <div class="overlay big-block equipment" style="position:absolute">
          <pre style="white-space:pre-wrap;font-family:inherit">${char.equipment || ''}</pre>
        </div>
      </div>

      <!-- Page 3: notes / additional -->
  <div class="page page3" style="background-image:url('${DATA_URI_PAGE_3}')">
        <div class="overlay big-block" style="position:absolute">
          <pre style="white-space:pre-wrap;font-family:inherit">${char.notes || ''}</pre>
        </div>
      </div>
    </div>
  </body>
  </html>`;
  return sheet;
}

function openPrintView() {
  const char = getCurrentChar();
  if (!char) { alert('No character selected'); return; }
  const html = generatePrintableSheet(char);
  const w = window.open('', '_blank', 'noopener');
  if (!w) { alert('Popup blocked. Please allow popups for this site to print.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
  // wait a moment for render and then print
  setTimeout(() => { w.print(); }, 250);
}

// Export helpers using html2canvas and jsPDF
async function exportSheetAsImage(char) {
  const html = generatePrintableSheet(char);
  // create offscreen container
  const container = document.createElement('div');
  container.style.position = 'fixed'; container.style.left = '-10000px'; container.style.top = '0';
  container.innerHTML = html;
  document.body.appendChild(container);
  // wait for bg images/fonts to load
  await new Promise(r => setTimeout(r, 350));
  // capture each page separately and zip them into separate downloads
  const pages = Array.from(container.querySelectorAll('.page'));
  for (let i=0;i<pages.length;i++){
    const page = pages[i];
    const canvas = await html2canvas(page, { scale: 2, useCORS: true });
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href = dataUrl; a.download = `${char.name || 'character'}-page-${i+1}.png`; a.click();
    await new Promise(r=>setTimeout(r,100));
  }
  container.remove();
}

async function exportSheetAsPDF(char) {
  // Render printable HTML offscreen and capture each .page separately so each uploaded background becomes a PDF page.
  const html = generatePrintableSheet(char);
  const container = document.createElement('div');
  container.style.position = 'fixed'; container.style.left = '-10000px'; container.style.top = '0';
  container.innerHTML = html;
  document.body.appendChild(container);
  await new Promise(r => setTimeout(r, 450));
  const pages = Array.from(container.querySelectorAll('.page'));
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pdfWidthPt = pdf.internal.pageSize.getWidth();
  const pdfHeightPt = pdf.internal.pageSize.getHeight();

  for (let i=0;i<pages.length;i++){
    const page = pages[i];
    const canvas = await html2canvas(page, { scale:2, useCORS:true });
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const renderedHeightPt = (imgProps.height * pdfWidthPt) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthPt, renderedHeightPt);
    if (i < pages.length-1) pdf.addPage();
    await new Promise(r=>setTimeout(r,100));
  }
  document.body.removeChild(container);
  pdf.save(`${char.name || 'character'}.pdf`);
}

// Initialization
function init() {
  buildAbilitiesUI();
  buildSavingThrowsUI();
  buildSkillsUI();
  buildSpellSlotsUI();
  populateSelectOptions();
  attachListeners();
  wireSettingsUI();
  wireTutorialUI();
  renderEverything();
}

init();