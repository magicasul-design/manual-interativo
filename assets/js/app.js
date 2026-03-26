const STORAGE_KEY = 'manual-jogo-snippets-v1';
const FAVORITES_KEY = 'manual-jogo-favorites-v1';

const defaultData = [
  {
    id: 'personagem',
    name: 'Personagem (Jogador)',
    description: 'Base para criação do jogador, atributos, movimentação e evolução.',
    items: [
      {
        id: 'criar-personagem-jogador',
        title: 'Criar Personagem (Jogador)',
        description: 'Instancia o personagem principal com atributos iniciais, status e inventário base.',
        tags: ['player', 'stats', 'spawn', 'base'],
        code: `class Player {
  constructor(config = {}) {
    this.id = crypto.randomUUID();
    this.name = config.name || 'Explorador';
    this.level = 1;
    this.position = { x: 0, y: 0 };
    this.health = config.health ?? 100;
    this.energy = config.energy ?? 100;
    this.hunger = config.hunger ?? 0;
    this.temperature = config.temperature ?? 36.5;
    this.inventory = [];
    this.status = {
      alive: true,
      moving: false,
      sprinting: false,
      crouching: false
    };
  }

  receiveDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) this.status.alive = false;
  }
}

const player = new Player({
  name: 'Capitão do Abrigo',
  health: 140,
  energy: 120
});

console.log('Jogador criado:', player);`
      },
      {
        id: 'mover-personagem-jogador',
        title: 'Mover Personagem (Jogador)',
        description: 'Controla locomoção com WASD ou setas, alternando entre andar, correr e rastejar.',
        tags: ['movimento', 'input', 'state-machine'],
        code: `const inputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  sprint: false,
  crawl: false
};

const keyMap = {
  w: 'up', ArrowUp: 'up',
  s: 'down', ArrowDown: 'down',
  a: 'left', ArrowLeft: 'left',
  d: 'right', ArrowRight: 'right',
  Shift: 'sprint',
  Control: 'crawl'
};

window.addEventListener('keydown', (event) => {
  const action = keyMap[event.key];
  if (action) inputState[action] = true;
});

window.addEventListener('keyup', (event) => {
  const action = keyMap[event.key];
  if (action) inputState[action] = false;
});

function updatePlayerMovement(player, deltaTime) {
  const baseSpeed = 3;
  const sprintMultiplier = inputState.sprint ? 1.8 : 1;
  const crawlMultiplier = inputState.crawl ? 0.45 : 1;
  const speed = baseSpeed * sprintMultiplier * crawlMultiplier * deltaTime;

  if (inputState.up) player.position.y -= speed;
  if (inputState.down) player.position.y += speed;
  if (inputState.left) player.position.x -= speed;
  if (inputState.right) player.position.x += speed;

  player.status.moving = inputState.up || inputState.down || inputState.left || inputState.right;
  player.status.sprinting = inputState.sprint && player.status.moving;
  player.status.crouching = inputState.crawl;
}`
      },
      {
        id: 'sistema-atributos',
        title: 'Atualizar Atributos do Jogador',
        description: 'Aplica regras de fome, energia e exposição térmica ao longo do tempo.',
        tags: ['player', 'survival', 'tick'],
        code: `function updatePlayerSurvival(player, deltaSeconds) {
  player.hunger = Math.min(100, player.hunger + 0.12 * deltaSeconds);
  player.energy = Math.max(0, player.energy - (player.status.sprinting ? 0.45 : 0.15) * deltaSeconds);

  const coldPenalty = player.temperature < 35 ? (35 - player.temperature) * 0.2 : 0;
  const hungerPenalty = player.hunger > 80 ? (player.hunger - 80) * 0.05 : 0;
  const damage = (coldPenalty + hungerPenalty) * deltaSeconds;

  if (damage > 0) player.receiveDamage(damage);
}

setInterval(() => {
  updatePlayerSurvival(player, 1);
}, 1000);`
      },
      {
        id: 'progressao-jogador',
        title: 'Sistema de Progressão e Nível',
        description: 'Acumula experiência, calcula subida de nível e melhora estatísticas básicas.',
        tags: ['xp', 'level', 'progression'],
        code: `class ProgressionSystem {
  constructor(player) {
    this.player = player;
    this.xp = 0;
    this.nextLevelXp = 100;
  }

  gainXP(amount) {
    this.xp += amount;
    while (this.xp >= this.nextLevelXp) {
      this.xp -= this.nextLevelXp;
      this.player.level += 1;
      this.player.health += 10;
      this.player.energy += 5;
      this.nextLevelXp = Math.floor(this.nextLevelXp * 1.35);
    }
  }
}

const progression = new ProgressionSystem(player);
progression.gainXP(130);`
      }
    ]
  },
  {
    id: 'inventario',
    name: 'Inventário e Recursos',
    description: 'Estruturas de dados para itens, pilhas, coleta e fabricação.',
    items: [
      {
        id: 'item-base',
        title: 'Definir Item Base',
        description: 'Modelo reutilizável para itens de recurso, equipamento ou consumível.',
        tags: ['item', 'data-model'],
        code: `class Item {
  constructor({ id, name, type, stackLimit = 99, rarity = 'common' }) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.stackLimit = stackLimit;
    this.rarity = rarity;
  }
}

const wood = new Item({
  id: 'resource_wood',
  name: 'Madeira',
  type: 'resource',
  stackLimit: 999
});`
      },
      {
        id: 'inventario-base',
        title: 'Criar Inventário do Jogador',
        description: 'Gerencia slots, empilhamento e validações básicas de capacidade.',
        tags: ['inventory', 'stack', 'slots'],
        code: `class Inventory {
  constructor(slotLimit = 30) {
    this.slotLimit = slotLimit;
    this.slots = [];
  }

  addItem(item, amount = 1) {
    const existing = this.slots.find(slot => slot.item.id === item.id && slot.amount < item.stackLimit);

    if (existing) {
      existing.amount = Math.min(item.stackLimit, existing.amount + amount);
      return true;
    }

    if (this.slots.length >= this.slotLimit) return false;

    this.slots.push({ item, amount });
    return true;
  }
}

player.inventory = new Inventory(40);
player.inventory.addItem(wood, 50);`
      },
      {
        id: 'coleta-recurso',
        title: 'Coletar Recurso do Mapa',
        description: 'Consome um nó de recurso, gera saque e envia o item ao inventário.',
        tags: ['harvest', 'resource-node', 'loot'],
        code: `function harvestNode(node, inventory) {
  if (node.remaining <= 0) return { success: false, reason: 'nó esgotado' };

  const gathered = Math.min(node.gatherRate, node.remaining);
  node.remaining -= gathered;

  const success = inventory.addItem(node.item, gathered);
  return {
    success,
    gathered,
    remaining: node.remaining
  };
}

const treeNode = {
  item: wood,
  remaining: 300,
  gatherRate: 25
};

console.log(harvestNode(treeNode, player.inventory));`
      },
      {
        id: 'crafting',
        title: 'Sistema de Crafting',
        description: 'Verifica ingredientes, consome recursos e entrega o item produzido.',
        tags: ['craft', 'recipe', 'economy'],
        code: `function craft(recipe, inventory) {
  const hasAllIngredients = recipe.ingredients.every(ingredient => {
    const slot = inventory.slots.find(slot => slot.item.id === ingredient.itemId);
    return slot && slot.amount >= ingredient.amount;
  });

  if (!hasAllIngredients) return false;

  recipe.ingredients.forEach(ingredient => {
    const slot = inventory.slots.find(slot => slot.item.id === ingredient.itemId);
    slot.amount -= ingredient.amount;
  });

  inventory.addItem(recipe.result.item, recipe.result.amount);
  return true;
}

const coal = new Item({ id: 'resource_coal', name: 'Carvão', type: 'resource' });
const fuelPack = new Item({ id: 'fuel_pack', name: 'Pacote de Combustível', type: 'utility', stackLimit: 20 });

const fuelRecipe = {
  ingredients: [
    { itemId: 'resource_wood', amount: 20 },
    { itemId: 'resource_coal', amount: 10 }
  ],
  result: { item: fuelPack, amount: 1 }
};`
      }
    ]
  },
  {
    id: 'base',
    name: 'Base e Construções',
    description: 'Controle de edifícios, evolução, filas de construção e produção passiva.',
    items: [
      {
        id: 'edificio-base',
        title: 'Criar Edifício da Base',
        description: 'Modelo para prédios com nível, saúde, status e bônus de produção.',
        tags: ['building', 'base', 'upgrade'],
        code: `class Building {
  constructor({ id, name, level = 1, maxLevel = 30, productionType = null }) {
    this.id = id;
    this.name = name;
    this.level = level;
    this.maxLevel = maxLevel;
    this.productionType = productionType;
    this.health = 1000 * level;
    this.isConstructing = false;
  }
}

const furnace = new Building({
  id: 'furnace',
  name: 'Fornalha Central',
  productionType: 'heat'
});`
      },
      {
        id: 'fila-construcao',
        title: 'Fila de Construção',
        description: 'Organiza obras em andamento, atualiza tempo restante e conclui estruturas.',
        tags: ['build-queue', 'timer', 'city-builder'],
        code: `class BuildQueue {
  constructor() {
    this.jobs = [];
  }

  addJob(building, durationSeconds) {
    this.jobs.push({
      building,
      startedAt: Date.now(),
      durationSeconds,
      completed: false
    });
    building.isConstructing = true;
  }

  update() {
    const now = Date.now();
    this.jobs.forEach(job => {
      const elapsed = (now - job.startedAt) / 1000;
      if (!job.completed && elapsed >= job.durationSeconds) {
        job.completed = true;
        job.building.isConstructing = false;
      }
    });
  }
}

const buildQueue = new BuildQueue();
buildQueue.addJob(furnace, 120);`
      },
      {
        id: 'upgrade-edificio',
        title: 'Melhorar Edifício',
        description: 'Valida custo e eleva o nível de um prédio com escalonamento de requisitos.',
        tags: ['upgrade', 'economy', 'progression'],
        code: `function upgradeBuilding(building, inventory, requirements) {
  if (building.level >= building.maxLevel) return { success: false, reason: 'nível máximo' };

  const cost = requirements[building.level] || [];
  const canPay = cost.every(entry => {
    const slot = inventory.slots.find(slot => slot.item.id === entry.itemId);
    return slot && slot.amount >= entry.amount;
  });

  if (!canPay) return { success: false, reason: 'recursos insuficientes' };

  cost.forEach(entry => {
    const slot = inventory.slots.find(slot => slot.item.id === entry.itemId);
    slot.amount -= entry.amount;
  });

  building.level += 1;
  building.health = 1000 * building.level;
  return { success: true, newLevel: building.level };
}`
      },
      {
        id: 'producao-passiva',
        title: 'Produção Passiva da Base',
        description: 'Gera recursos ao longo do tempo com base no tipo e nível da construção.',
        tags: ['idle', 'resource-generation', 'simulation'],
        code: `function produceResources(building, deltaSeconds) {
  const productionTable = {
    heat: 2,
    food: 5,
    wood: 4,
    coal: 3
  };

  const baseRate = productionTable[building.productionType] || 0;
  return Math.floor(baseRate * building.level * deltaSeconds);
}

const heatGenerated = produceResources(furnace, 60);
console.log('Calor gerado em 60s:', heatGenerated);`
      }
    ]
  },
  {
    id: 'sobreviventes',
    name: 'Sobreviventes e NPCs',
    description: 'Gerencie trabalhadores, atributos sociais e automação de tarefas.',
    items: [
      {
        id: 'npc-base',
        title: 'Criar Sobrevivente / NPC',
        description: 'Define um sobrevivente com profissão, humor, fome e eficiência.',
        tags: ['npc', 'worker', 'settlement'],
        code: `class Survivor {
  constructor({ name, role }) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.role = role;
    this.morale = 80;
    this.hunger = 10;
    this.warmth = 75;
    this.efficiency = 1;
    this.assignedBuildingId = null;
  }
}

const worker = new Survivor({
  name: 'Mila',
  role: 'Lenhadora'
});`
      },
      {
        id: 'atribuir-trabalho',
        title: 'Atribuir Trabalho ao NPC',
        description: 'Vincula um sobrevivente a um edifício e recalcula sua eficiência.',
        tags: ['assignment', 'job-system'],
        code: `function assignSurvivorToBuilding(survivor, building) {
  survivor.assignedBuildingId = building.id;
  const moraleBonus = survivor.morale >= 90 ? 0.15 : 0;
  const warmthPenalty = survivor.warmth < 40 ? 0.2 : 0;
  survivor.efficiency = 1 + moraleBonus - warmthPenalty;

  return {
    survivorId: survivor.id,
    buildingId: building.id,
    efficiency: survivor.efficiency
  };
}`
      },
      {
        id: 'moral-fome-npc',
        title: 'Atualizar Moral, Fome e Temperatura do NPC',
        description: 'Executa deterioração de status e converte bem-estar em desempenho.',
        tags: ['morale', 'simulation', 'needs'],
        code: `function updateSurvivorNeeds(survivor, deltaSeconds, cityHeatLevel) {
  survivor.hunger = Math.min(100, survivor.hunger + 0.08 * deltaSeconds);
  survivor.warmth = Math.max(0, survivor.warmth - Math.max(0, 2 - cityHeatLevel) * 0.25 * deltaSeconds);

  if (survivor.hunger > 85) survivor.morale -= 0.15 * deltaSeconds;
  if (survivor.warmth < 30) survivor.morale -= 0.18 * deltaSeconds;

  survivor.morale = Math.max(0, Math.min(100, survivor.morale));
  survivor.efficiency = Math.max(0.2, survivor.morale / 100);
}`
      }
    ]
  },
  {
    id: 'clima',
    name: 'Clima e Sobrevivência',
    description: 'Mecânicas de frio extremo, tempestade, calor da base e consumo de combustível.',
    items: [
      {
        id: 'temperatura-global',
        title: 'Loop de Temperatura Global',
        description: 'Atualiza a temperatura do mundo, ajusta níveis de risco e aplica penalidades.',
        tags: ['weather', 'temperature', 'world-state'],
        code: `const worldState = {
  temperature: -18,
  stormActive: false,
  windIntensity: 0.4,
  heatRadiusBonus: 6
};

function updateWorldTemperature(deltaSeconds) {
  const stormPenalty = worldState.stormActive ? 0.08 : 0.01;
  worldState.temperature -= stormPenalty * deltaSeconds;
  worldState.temperature = Math.max(-80, Math.min(5, worldState.temperature));
}

setInterval(() => updateWorldTemperature(1), 1000);`
      },
      {
        id: 'tempestade-neve',
        title: 'Evento de Tempestade de Neve',
        description: 'Ativa uma tempestade, aumenta severidade e reduz mobilidade da cidade.',
        tags: ['event', 'blizzard', 'difficulty'],
        code: `function triggerSnowstorm(worldState, durationSeconds = 180) {
  worldState.stormActive = true;
  worldState.windIntensity = 1;

  setTimeout(() => {
    worldState.stormActive = false;
    worldState.windIntensity = 0.35;
  }, durationSeconds * 1000);
}

triggerSnowstorm(worldState, 240);`
      },
      {
        id: 'consumo-combustivel',
        title: 'Consumo de Combustível da Fornalha',
        description: 'Controla uso de combustível, geração de calor e risco de congelamento.',
        tags: ['furnace', 'fuel', 'heat'],
        code: `const city = {
  fuel: 500,
  heatLevel: 3,
  citizens: 36
};

function updateFurnace(city, deltaSeconds) {
  const consumptionRate = city.heatLevel * (city.citizens / 25);
  city.fuel = Math.max(0, city.fuel - consumptionRate * deltaSeconds);

  if (city.fuel === 0) {
    city.heatLevel = Math.max(0, city.heatLevel - 1);
  }
}

setInterval(() => updateFurnace(city, 1), 1000);`
      }
    ]
  },
  {
    id: 'combate',
    name: 'Combate e Exploração',
    description: 'Sistemas de inimigo, dano, IA simples e exploração do mapa.',
    items: [
      {
        id: 'inimigo-base',
        title: 'Criar Inimigo Base',
        description: 'Estrutura de inimigo com vida, ataque, alcance e comportamento.',
        tags: ['enemy', 'combat', 'ai'],
        code: `class Enemy {
  constructor({ name, health, attackPower, aggroRange }) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.health = health;
    this.attackPower = attackPower;
    this.aggroRange = aggroRange;
    this.position = { x: 10, y: 10 };
  }

  receiveDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }
}

const wolf = new Enemy({
  name: 'Lobo Faminto',
  health: 60,
  attackPower: 12,
  aggroRange: 8
});`
      },
      {
        id: 'ataque-basico',
        title: 'Ataque Básico do Jogador',
        description: 'Calcula dano, aplica crítico simples e retorna o estado do alvo.',
        tags: ['attack', 'damage', 'critical'],
        code: `function basicAttack(attacker, target) {
  const baseDamage = 15 + attacker.level * 2;
  const critical = Math.random() < 0.15;
  const totalDamage = critical ? Math.floor(baseDamage * 1.75) : baseDamage;

  target.receiveDamage(totalDamage);

  return {
    damage: totalDamage,
    critical,
    targetRemainingHealth: target.health
  };
}

console.log(basicAttack(player, wolf));`
      },
      {
        id: 'ia-patrulha',
        title: 'IA de Patrulha e Perseguição',
        description: 'Alterna entre patrulha, perseguição e ataque quando o jogador entra no alcance.',
        tags: ['enemy-ai', 'patrol', 'chase'],
        code: `function updateEnemyAI(enemy, player, deltaSeconds) {
  const dx = player.position.x - enemy.position.x;
  const dy = player.position.y - enemy.position.y;
  const distance = Math.hypot(dx, dy);

  if (distance <= enemy.aggroRange) {
    enemy.position.x += Math.sign(dx) * 2 * deltaSeconds;
    enemy.position.y += Math.sign(dy) * 2 * deltaSeconds;
    return 'chasing';
  }

  enemy.position.x += Math.sin(Date.now() / 500) * 0.1;
  return 'patrolling';
}`
      },
      {
        id: 'exploracao-mapa',
        title: 'Descoberta de Áreas do Mapa',
        description: 'Marca regiões exploradas e desbloqueia recompensas por progressão territorial.',
        tags: ['map', 'fog-of-war', 'exploration'],
        code: `const exploredCells = new Set();

function revealMapArea(player, cellSize = 16) {
  const cellX = Math.floor(player.position.x / cellSize);
  const cellY = Math.floor(player.position.y / cellSize);
  const key = cellX + ':' + cellY;

  if (!exploredCells.has(key)) {
    exploredCells.add(key);
    return { discovered: true, cell: key, totalExplored: exploredCells.size };
  }

  return { discovered: false, cell: key, totalExplored: exploredCells.size };
}`
      }
    ]
  },
  {
    id: 'missoes',
    name: 'Missões e Eventos',
    description: 'Rastreamento de objetivos, recompensas e eventos temporários.',
    items: [
      {
        id: 'missao-base',
        title: 'Criar Missão Base',
        description: 'Estrutura de missão com progresso, objetivos e recompensas.',
        tags: ['quest', 'objective', 'reward'],
        code: `class Quest {
  constructor({ id, title, objective, targetAmount, rewards }) {
    this.id = id;
    this.title = title;
    this.objective = objective;
    this.targetAmount = targetAmount;
    this.currentAmount = 0;
    this.completed = false;
    this.rewards = rewards;
  }

  advance(amount = 1) {
    this.currentAmount = Math.min(this.targetAmount, this.currentAmount + amount);
    this.completed = this.currentAmount >= this.targetAmount;
  }
}

const woodQuest = new Quest({
  id: 'quest_collect_wood',
  title: 'Prepare o Inverno',
  objective: 'Coletar madeira',
  targetAmount: 300,
  rewards: { xp: 50, gold: 100 }
});`
      },
      {
        id: 'rastreador-missao',
        title: 'Atualizar Progresso de Missão',
        description: 'Escuta ações do jogo e avança automaticamente objetivos compatíveis.',
        tags: ['quest-log', 'events'],
        code: `function handleGameEvent(event, quests) {
  quests.forEach(quest => {
    if (quest.completed) return;

    if (event.type === 'resource_collected' && quest.objective === 'Coletar madeira') {
      quest.advance(event.amount);
    }
  });
}

handleGameEvent({ type: 'resource_collected', resourceId: 'resource_wood', amount: 25 }, [woodQuest]);`
      },
      {
        id: 'evento-temporario',
        title: 'Evento Temporário do Mundo',
        description: 'Agenda um evento por tempo limitado que altera a simulação global.',
        tags: ['limited-event', 'live-ops', 'timer'],
        code: `function createTimedEvent({ id, name, durationSeconds, onStart, onEnd }) {
  const eventState = {
    id,
    name,
    active: true,
    startedAt: Date.now()
  };

  onStart?.(eventState);

  setTimeout(() => {
    eventState.active = false;
    onEnd?.(eventState);
  }, durationSeconds * 1000);

  return eventState;
}

createTimedEvent({
  id: 'double_harvest',
  name: 'Coleta em Dobro',
  durationSeconds: 300,
  onStart: () => console.log('Evento ativo!'),
  onEnd: () => console.log('Evento encerrado!')
});`
      }
    ]
  },
  {
    id: 'ui',
    name: 'UI, HUD e Feedback',
    description: 'Componentes visuais para estado do jogador, alertas e menus.',
    items: [
      {
        id: 'hud-jogador',
        title: 'Atualizar HUD do Jogador',
        description: 'Sincroniza barras de vida, energia, fome e temperatura com a interface.',
        tags: ['ui', 'hud', 'dom'],
        code: `function updateHUD(player) {
  document.querySelector('[data-ui="health"]').style.width = player.health + '%';
  document.querySelector('[data-ui="energy"]').style.width = player.energy + '%';
  document.querySelector('[data-ui="hunger"]').style.width = (100 - player.hunger) + '%';
  document.querySelector('[data-ui="temp"]').textContent = player.temperature.toFixed(1) + '°C';
}`
      },
      {
        id: 'alerta-sistema',
        title: 'Exibir Alerta do Sistema',
        description: 'Mostra mensagens rápidas para frio crítico, falta de combustível ou invasão.',
        tags: ['notification', 'ux'],
        code: `function showSystemAlert(message, type = 'info') {
  const alertBox = document.createElement('div');
  alertBox.className = 'alert ' + type;
  alertBox.textContent = message;

  document.body.appendChild(alertBox);
  setTimeout(() => alertBox.remove(), 3200);
}

showSystemAlert('A fornalha está com combustível baixo!', 'warning');`
      },
      {
        id: 'menu-construcao',
        title: 'Menu de Construção Dinâmico',
        description: 'Renderiza opções de construção a partir de uma lista configurável.',
        tags: ['build-menu', 'render', 'ui'],
        code: `function renderBuildMenu(buildings, container) {
  container.innerHTML = '';

  buildings.forEach(building => {
    const button = document.createElement('button');
    button.textContent = building.name + ' • Nv.' + building.level;
    button.addEventListener('click', () => {
      console.log('Selecionado:', building.id);
    });
    container.appendChild(button);
  });
}`
      }
    ]
  },
  {
    id: 'salvamento',
    name: 'Salvamento e Persistência',
    description: 'Grave estados do jogo localmente e prepare sincronização com backend.',
    items: [
      {
        id: 'save-local',
        title: 'Salvar Jogo no LocalStorage',
        description: 'Serializa o estado principal e persiste o progresso local do jogador.',
        tags: ['save', 'localStorage', 'persistence'],
        code: `function saveGame(state) {
  localStorage.setItem('game-save', JSON.stringify({
    version: 1,
    savedAt: new Date().toISOString(),
    state
  }));
}

saveGame({ player, city, exploredCells: [...exploredCells] });`
      },
      {
        id: 'load-local',
        title: 'Carregar Jogo do LocalStorage',
        description: 'Restaura um save local e retorna o estado para reidratação do jogo.',
        tags: ['load', 'restore'],
        code: `function loadGame() {
  const raw = localStorage.getItem('game-save');
  if (!raw) return null;

  const save = JSON.parse(raw);
  return save.state;
}

const loadedState = loadGame();
console.log('Save carregado:', loadedState);`
      },
      {
        id: 'autosave',
        title: 'Auto Save Periódico',
        description: 'Programa salvamento automático em intervalos fixos.',
        tags: ['autosave', 'interval'],
        code: `function startAutoSave(getGameState, intervalMs = 30000) {
  return setInterval(() => {
    saveGame(getGameState());
    console.log('Auto save executado');
  }, intervalMs);
}

const autoSaveId = startAutoSave(() => ({ player, city }), 60000);`
      }
    ]
  },
  {
    id: 'backend',
    name: 'Backend e Sincronização',
    description: 'Estrutura inicial para APIs, perfil de usuário e upload de progresso.',
    items: [
      {
        id: 'payload-sincronizacao',
        title: 'Montar Payload de Sincronização',
        description: 'Normaliza dados importantes do jogo para envio ao servidor.',
        tags: ['api', 'sync', 'payload'],
        code: `function buildSyncPayload(player, city) {
  return {
    player: {
      id: player.id,
      name: player.name,
      level: player.level,
      health: player.health,
      energy: player.energy
    },
    city: {
      fuel: city.fuel,
      heatLevel: city.heatLevel,
      citizens: city.citizens
    },
    syncedAt: new Date().toISOString()
  };
}`
      },
      {
        id: 'upload-progresso',
        title: 'Enviar Progresso para API',
        description: 'Exemplo de envio assíncrono para endpoint de salvamento remoto.',
        tags: ['fetch', 'remote-save', 'api'],
        code: `async function syncProgress(apiUrl, token, payload) {
  const response = await fetch(apiUrl + '/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error('Falha ao sincronizar save');
  return response.json();
}`
      },
      {
        id: 'perfil-remoto',
        title: 'Buscar Perfil do Jogador',
        description: 'Carrega perfil e configurações iniciais antes de montar a sessão do jogo.',
        tags: ['profile', 'bootstrap', 'session'],
        code: `async function fetchPlayerProfile(apiUrl, token) {
  const response = await fetch(apiUrl + '/me', {
    headers: { Authorization: 'Bearer ' + token }
  });

  if (!response.ok) throw new Error('Perfil não encontrado');
  return response.json();
}`
      }
    ]
  },
  {
    id: 'audio',
    name: 'Áudio e Feedback Imersivo',
    description: 'Gerencie trilhas, efeitos sonoros e resposta aos eventos do jogo.',
    items: [
      {
        id: 'audio-manager',
        title: 'Gerenciador de Áudio',
        description: 'Controla reprodução de música, volume e efeitos com cache simples.',
        tags: ['audio', 'sfx', 'music'],
        code: `class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.masterVolume = 0.8;
  }

  register(key, src) {
    const audio = new Audio(src);
    audio.volume = this.masterVolume;
    this.sounds.set(key, audio);
  }

  play(key) {
    const audio = this.sounds.get(key);
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
  }
}

const audioManager = new AudioManager();`
      },
      {
        id: 'som-alerta-frio',
        title: 'Tocar Alerta de Frio Crítico',
        description: 'Aciona efeito sonoro quando o calor da cidade entra em zona de risco.',
        tags: ['warning', 'sfx'],
        code: `function playColdAlert(city, audioManager) {
  if (city.heatLevel <= 1 || city.fuel < 50) {
    audioManager.play('cold-alert');
  }
}`
      },
      {
        id: 'musica-contextual',
        title: 'Música Contextual por Situação',
        description: 'Troca trilhas conforme exploração, combate ou tempestade.',
        tags: ['adaptive-music', 'state'],
        code: `function resolveMusicState({ inCombat, stormActive, baseView }) {
  if (inCombat) return 'combat-theme';
  if (stormActive) return 'storm-theme';
  if (baseView) return 'base-theme';
  return 'exploration-theme';
}`
      }
    ]
  }
];

const elements = {
  categoryNav: document.getElementById('categoryNav'),
  snippetList: document.getElementById('snippetList'),
  searchInput: document.getElementById('searchInput'),
  snippetCategory: document.getElementById('snippetCategory'),
  snippetTitle: document.getElementById('snippetTitle'),
  snippetDescription: document.getElementById('snippetDescription'),
  snippetTags: document.getElementById('snippetTags'),
  codeEditor: document.getElementById('codeEditor'),
  copyBtn: document.getElementById('copyBtn'),
  saveBtn: document.getElementById('saveBtn'),
  resetBtn: document.getElementById('resetBtn'),
  favoriteBtn: document.getElementById('favoriteBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importFile: document.getElementById('importFile'),
  resetAllBtn: document.getElementById('resetAllBtn'),
  showAllBtn: document.getElementById('showAllBtn'),
  showFavoritesBtn: document.getElementById('showFavoritesBtn'),
  statCategories: document.getElementById('statCategories'),
  statSnippets: document.getElementById('statSnippets'),
  statSaved: document.getElementById('statSaved'),
  statFavorites: document.getElementById('statFavorites'),
  categorySectionTemplate: document.getElementById('categorySectionTemplate'),
  commandButtonTemplate: document.getElementById('commandButtonTemplate')
};

let favorites = loadFavorites();
let overrides = loadOverrides();
let activeSnippetId = null;
let activeCategoryFilter = null;
let showFavoritesOnly = false;

function flattenSnippets(data = defaultData) {
  return data.flatMap(category => category.items.map(item => ({ ...item, categoryId: category.id, categoryName: category.name })));
}

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveOverrides() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function getSnippetById(snippetId) {
  return flattenSnippets().find(item => item.id === snippetId);
}

function getSnippetCode(snippet) {
  return overrides[snippet.id] ?? snippet.code;
}

function renderCategoryNav() {
  elements.categoryNav.innerHTML = '';

  defaultData.forEach(category => {
    const button = document.createElement('button');
    button.textContent = category.name;
    if (activeCategoryFilter === category.id) button.classList.add('active');
    button.addEventListener('click', () => {
      activeCategoryFilter = activeCategoryFilter === category.id ? null : category.id;
      renderCategoryNav();
      renderSnippetList();
    });
    elements.categoryNav.appendChild(button);
  });
}

function renderSnippetList() {
  const query = elements.searchInput.value.trim().toLowerCase();
  elements.snippetList.innerHTML = '';

  const filteredCategories = defaultData
    .filter(category => !activeCategoryFilter || category.id === activeCategoryFilter)
    .map(category => ({
      ...category,
      items: category.items.filter(item => {
        const matchesSearch = !query || [item.title, item.description, category.name, ...(item.tags || [])]
          .join(' ')
          .toLowerCase()
          .includes(query);
        const matchesFavorite = !showFavoritesOnly || favorites.includes(item.id);
        return matchesSearch && matchesFavorite;
      })
    }))
    .filter(category => category.items.length > 0);

  filteredCategories.forEach(category => {
    const section = elements.categorySectionTemplate.content.firstElementChild.cloneNode(true);
    section.dataset.categoryId = category.id;
    section.querySelector('.category-label').textContent = 'Categoria';
    section.querySelector('.category-name').textContent = category.name;
    section.querySelector('.category-description').textContent = category.description;
    section.querySelector('.category-count').textContent = category.items.length + ' comando(s)';

    const grid = section.querySelector('.command-grid');
    category.items.forEach(item => {
      const button = elements.commandButtonTemplate.content.firstElementChild.cloneNode(true);
      button.textContent = item.title;
      button.dataset.snippetId = item.id;
      if (activeSnippetId === item.id) button.classList.add('active');
      button.addEventListener('click', () => openSnippet(item.id));
      grid.appendChild(button);
    });

    elements.snippetList.appendChild(section);
  });

  if (!filteredCategories.length) {
    const empty = document.createElement('div');
    empty.className = 'category-section';
    empty.innerHTML = '<h3>Nenhum resultado encontrado</h3><p class="category-description">Tente outro termo de busca, remova o filtro atual ou restaure a visualização completa.</p>';
    elements.snippetList.appendChild(empty);
  }

  updateStats(filteredCategories);
}

function updateStats(filteredCategories = defaultData) {
  const visibleSnippetCount = filteredCategories.reduce((total, category) => total + category.items.length, 0);
  elements.statCategories.textContent = defaultData.length;
  elements.statSnippets.textContent = visibleSnippetCount;
  elements.statSaved.textContent = Object.keys(overrides).length;
  elements.statFavorites.textContent = favorites.length;
}

function openSnippet(snippetId) {
  const snippet = getSnippetById(snippetId);
  if (!snippet) return;

  activeSnippetId = snippetId;
  const code = getSnippetCode(snippet);

  elements.snippetCategory.textContent = snippet.categoryName;
  elements.snippetTitle.textContent = snippet.title;
  elements.snippetDescription.textContent = snippet.description;
  elements.codeEditor.value = code;
  elements.codeEditor.disabled = false;
  elements.copyBtn.disabled = false;
  elements.saveBtn.disabled = false;
  elements.resetBtn.disabled = false;
  elements.favoriteBtn.disabled = false;
  elements.favoriteBtn.textContent = favorites.includes(snippet.id) ? '★ Favorito' : '☆ Favoritar';

  elements.snippetTags.innerHTML = '';
  (snippet.tags || []).forEach(tag => {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = tag;
    elements.snippetTags.appendChild(span);
  });

  renderSnippetList();
}

async function copyActiveSnippet() {
  if (!activeSnippetId) return;
  try {
    await navigator.clipboard.writeText(elements.codeEditor.value);
    showToast('Snippet copiado para a área de transferência.');
  } catch {
    showToast('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
  }
}

function saveActiveSnippet() {
  if (!activeSnippetId) return;
  overrides[activeSnippetId] = elements.codeEditor.value;
  saveOverrides();
  updateStats();
  showToast('Alteração salva no navegador.');
}

function resetActiveSnippet() {
  if (!activeSnippetId) return;
  const snippet = getSnippetById(activeSnippetId);
  delete overrides[activeSnippetId];
  saveOverrides();
  elements.codeEditor.value = snippet.code;
  updateStats();
  showToast('Snippet restaurado para a versão padrão.');
}

function toggleFavorite() {
  if (!activeSnippetId) return;
  if (favorites.includes(activeSnippetId)) {
    favorites = favorites.filter(id => id !== activeSnippetId);
  } else {
    favorites.push(activeSnippetId);
  }
  saveFavorites();
  openSnippet(activeSnippetId);
  updateStats();
}

function exportSnippets() {
  const payload = {
    exportedAt: new Date().toISOString(),
    overrides,
    favorites
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'manual-jogo-snippets-backup.json';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Backup exportado com sucesso.');
}

function importSnippets(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      overrides = parsed.overrides || {};
      favorites = parsed.favorites || [];
      saveOverrides();
      saveFavorites();
      renderSnippetList();
      renderCategoryNav();
      if (activeSnippetId) openSnippet(activeSnippetId);
      showToast('Backup importado com sucesso.');
    } catch {
      showToast('Arquivo inválido. Use um JSON exportado por esta página.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function resetAllData() {
  const confirmed = confirm('Deseja realmente apagar todas as edições salvas e favoritos?');
  if (!confirmed) return;

  overrides = {};
  favorites = [];
  saveOverrides();
  saveFavorites();

  if (activeSnippetId) openSnippet(activeSnippetId);
  renderSnippetList();
  renderCategoryNav();
  showToast('Todos os dados locais foram restaurados.');
}

function showToast(message) {
  const current = document.querySelector('.toast');
  if (current) current.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2800);
}

function bindEvents() {
  elements.searchInput.addEventListener('input', renderSnippetList);
  elements.copyBtn.addEventListener('click', copyActiveSnippet);
  elements.saveBtn.addEventListener('click', saveActiveSnippet);
  elements.resetBtn.addEventListener('click', resetActiveSnippet);
  elements.favoriteBtn.addEventListener('click', toggleFavorite);
  elements.exportBtn.addEventListener('click', exportSnippets);
  elements.importFile.addEventListener('change', importSnippets);
  elements.resetAllBtn.addEventListener('click', resetAllData);

  elements.showAllBtn.addEventListener('click', () => {
    showFavoritesOnly = false;
    activeCategoryFilter = null;
    renderCategoryNav();
    renderSnippetList();
  });

  elements.showFavoritesBtn.addEventListener('click', () => {
    showFavoritesOnly = !showFavoritesOnly;
    renderSnippetList();
    showToast(showFavoritesOnly ? 'Filtro de favoritos ativado.' : 'Filtro de favoritos desativado.');
  });
}

function init() {
  bindEvents();
  renderCategoryNav();
  renderSnippetList();

  const firstSnippet = flattenSnippets()[0];
  if (firstSnippet) openSnippet(firstSnippet.id);
}

init();