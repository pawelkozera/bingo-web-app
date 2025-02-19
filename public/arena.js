import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initSingInAnonymously, db, STREAMER_NAME, store } from './firebase-config.js';

initSingInAnonymously();

const arenaRef = doc(db, "streamer", STREAMER_NAME, "game_name", "arena");
const playersRef = collection(db, "streamer", STREAMER_NAME, "game_name", "arena", "players");

const PLAYERS = new Set(["je1lybeann", "p0js"]);
let IS_ACTIVE = true;
let ADD_BOTS = false;
let MAX_PLAYERS = 5;

async function fetchSettingsOnce() {
    const snapshot = await getDoc(arenaRef);
    if (snapshot.exists()) {
        const data = snapshot.data();
        IS_ACTIVE = true;
        ADD_BOTS = data.addBots || false;
        MAX_PLAYERS = data.max_players || 5;
    }
}

fetchSettingsOnce();

const unsubscribe = onSnapshot(playersRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const newPlayer = {
                id: change.doc.id,
                ...change.doc.data()
            };
            PLAYERS.add(newPlayer.id);
        }
    });
}, (error) => {
    console.error("Error listening to players:", error);
});

const GAME_MODES = {
    FREE_FOR_ALL: 'free_for_all',
    TEAM_DEATHMATCH: 'team_deathmatch'
};

let currentGameMode;
let teams = { red: [], blue: [] };
let restartTimeout;

class Fighter {
    constructor(name, x, y, team, isMeleeOnly = false) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.health = 100;
        this.speed = 5;
        this.team = team;
        this.attackType = isMeleeOnly ? 'melee' : this.determineAttackType();
        this.attackCooldown = 0;
        this.projectiles = [];
        this.color = this.getColor(team);
        this.element = this.createFighterElement();
        this.updatePosition();
    }

    getColor(team) {
        if (currentGameMode === GAME_MODES.TEAM_DEATHMATCH) {
            return team === 'red' ? 'bg-red-400' : 'bg-blue-400';
        }
        return this.getRandomJellybeanColor();
    }

    update() {
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }

    determineAttackType() {
        const totalFighters = fighters.length + 1;
        const maxArchers = Math.floor(totalFighters * 0.3);
        const currentArchers = fighters.filter(f => f.attackType === 'ranged').length;
        
        if (currentArchers >= maxArchers) return 'melee';
        
        return Math.random() < 0.5 ? 'ranged' : 'melee';
    }

    moveToCombatPosition(target, desiredDistance) {
        // Only melee fighters should reposition
        if (this.attackType === 'ranged') return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > desiredDistance) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        } else if (distance < desiredDistance - 20) {
            this.x -= (dx / distance) * 2;
            this.y -= (dy / distance) * 2;
        }
        
        // Keep within arena bounds
        this.x = Math.max(0, Math.min(ARENA_WIDTH - PLAYER_SIZE, this.x));
        this.y = Math.max(0, Math.min(ARENA_HEIGHT - PLAYER_SIZE, this.y));
        
        this.updatePosition();
    }

    attack(target) {
        if (this.attackCooldown > 0) return;

        if (this.attackType === 'melee') {
            target.takeDamage(10);
            this.attackCooldown = 5;
        } else {
            this.shootProjectile(target);
            this.attackCooldown = 25;
        }
    }

    shootProjectile(target) {
        const projectile = new Projectile(
            this.x + 20,
            this.y + 20,
            target,
            this.color
        );
        this.projectiles.push(projectile);
    }

    getRandomJellybeanColor() {
        const colors = [
            'bg-pink-400', 'bg-purple-400', 'bg-yellow-400', 
            'bg-blue-400', 'bg-green-400', 'bg-red-400'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createFighterElement() {
        const div = document.createElement('div');
        div.className = `jellybean absolute w-10 h-14 rounded-full 
                        ${this.color} border-2 border-white 
                        shadow-lg flex items-center justify-center 
                        transition-all duration-100`;
        
        // Jellybean body
        div.innerHTML = `
            <div class="absolute -bottom-8 text-center 
                        text-white text-lg font-bold bg-black/30 
                        px-2 rounded-full">
                ${this.name}
            </div>
            <div class="w-4 h-4 bg-white/30 rounded-full 
                       absolute top-2 left-2"></div>
            <div class="health-bar absolute bottom-0 w-full h-2 bg-gray-600">
                <div class="health h-full bg-green-400" style="width: ${this.health}%"></div>
            </div>
        `;
        
        document.getElementById('arena').appendChild(div);
        return div;
    }

    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.element.querySelector('.health').style.width = `${this.health}%`;
        
        // Add damage animation
        this.element.classList.add('scale-125');
        setTimeout(() => {
            this.element.classList.remove('scale-125');
        }, 100);

        // Trigger explosion when health reaches 0
        if (this.health <= 0) {
            this.createExplosion();
        }
    }

    createExplosion() {
        const colors = ['bg-pink-400', 'bg-yellow-400', 'bg-purple-400', 'bg-blue-400'];
        const particles = 16;
        
        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 * i) / particles;
            const distance = Math.random() * 60 + 30;
            const size = Math.random() * 8 + 4;
            const rotation = Math.random() * 360;
            
            particle.className = `absolute candy-glitter ${
                colors[Math.floor(Math.random() * colors.length)]
            } shadow-lg rounded-full`;
            
            // Random shape (circle or oval)
            if (Math.random() > 0.5) {
                particle.classList.add('rounded-full');
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
            } else {
                particle.classList.add('rounded-[30%]');
                particle.style.width = `${size * 1.5}px`;
                particle.style.height = `${size}px`;
            }
            
            particle.style.left = `${this.x + 20}px`;
            particle.style.top = `${this.y + 20}px`;
            
            particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
            particle.classList.add('animate-explode');

            document.getElementById('arena').appendChild(particle);
            
            // Animate particle
            requestAnimationFrame(() => {
                particle.style.transform = `rotate(${rotation + 360}deg)
                    translate(${Math.cos(angle) * distance}px, 
                    ${Math.sin(angle) * distance}px)
                    scale(0)`;
                particle.style.opacity = '0';
            });
    
            // Remove particle after animation
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    findClosestEnemy() {
        let closestEnemy = null;
        let minDistance = Infinity;

        fighters.forEach(enemy => {
            if (enemy === this || enemy.health <= 0) return;
            if (currentGameMode === GAME_MODES.TEAM_DEATHMATCH && enemy.team === this.team) return;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                closestEnemy = enemy;
            }
        });

        return closestEnemy;
    }
}

class Projectile {
    constructor(x, y, target, color) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.color = color;
        this.element = this.createProjectileElement();
        this.speed = 30;
        this.active = true;
    }

    createProjectileElement() {
        const div = document.createElement('div');
        div.className = `absolute w-3 h-3 rounded-full ${this.color} 
                        shadow-lg animate-pulse`;
        div.style.left = `${this.x}px`;
        div.style.top = `${this.y}px`;
        document.getElementById('arena').appendChild(div);
        return div;
    }

    update() {
        if (!this.active || 
            !this.target.element.parentElement || 
            this.target.health <= 0) {
            this.remove();
            return;
        }

        // Update target position each frame
        const currentTargetX = this.target.x + 20;
        const currentTargetY = this.target.y + 20;
        
        const dx = currentTargetX - this.x;
        const dy = currentTargetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 20) {
            this.createImpactExplosion();
            this.target.takeDamage(7);
            this.remove();
            return;
        }

        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    createImpactExplosion() {
        const colors = ['bg-red-400', 'bg-blue-400'];
        const particles = 8;
        
        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 * i) / particles;
            const distance = Math.random() * 30 + 30;
            const size = Math.random() * 4 + 4;
            const rotation = Math.random() * 180;
            
            particle.className = `absolute candy-glitter ${
                colors[Math.floor(Math.random() * colors.length)]
            } shadow-lg rounded-full`;
            
            // Random shape (circle or oval)
            if (Math.random() > 0.5) {
                particle.classList.add('rounded-full');
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
            } else {
                particle.classList.add('rounded-[30%]');
                particle.style.width = `${size * 1.5}px`;
                particle.style.height = `${size}px`;
            }
            
            particle.style.left = `${this.x + 20}px`;
            particle.style.top = `${this.y + 20}px`;
            
            particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
            particle.classList.add('animate-explode');

            document.getElementById('arena').appendChild(particle);
            
            // Animate particle
            requestAnimationFrame(() => {
                particle.style.transform = `rotate(${rotation + 360}deg)
                    translate(${Math.cos(angle) * distance}px, 
                    ${Math.sin(angle) * distance}px)
                    scale(0)`;
                particle.style.opacity = '0';
            });
    
            // Remove particle after animation
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    remove() {
        this.active = false;
        this.element.remove();
    }
}

let fighters = [];
let fightInterval;
const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
const PLAYER_SIZE = 40;

function startFight() {
    if (!IS_ACTIVE) return;
    resetArena();

    // Determine game mode
    currentGameMode = determineGameMode();

    // Add real players from the PLAYERS set
    PLAYERS.forEach(playerId => {
        addRealPlayer(playerId);
    });
    
    // Add bots if enabled
    if (ADD_BOTS) {
        const botCount = MAX_PLAYERS - PLAYERS.size;
        if (botCount > 0) {
            addBots(botCount);
        }
    }

    // Initialize teams
    if (currentGameMode === GAME_MODES.TEAM_DEATHMATCH) {
        teams = { red: [], blue: [] };
        balanceTeams();
    }

    startGameLoop();
}

function addRealPlayer(playerId) {
    const fighter = new Fighter(
        playerId,
        Math.random() * (ARENA_WIDTH - PLAYER_SIZE),
        Math.random() * (ARENA_HEIGHT - PLAYER_SIZE),
        currentGameMode === GAME_MODES.TEAM_DEATHMATCH ? getAutoTeam() : null,
        currentGameMode === GAME_MODES.FREE_FOR_ALL
    );
    
    fighters.push(fighter);
    if (fighter.team) teams[fighter.team].push(fighter);
}

function addBots(quantity) {
    const existingNames = new Set([...PLAYERS, ...fighters.map(f => f.name)]);
    
    for (let i = 0; i < quantity; i++) {
        let botName;
        do {
            botName = `Bot`;
        } while (existingNames.has(botName));
        
        const fighter = new Fighter(
            botName,
            Math.random() * (ARENA_WIDTH - PLAYER_SIZE),
            Math.random() * (ARENA_HEIGHT - PLAYER_SIZE),
            currentGameMode === GAME_MODES.TEAM_DEATHMATCH ? getAutoTeam() : null,
            currentGameMode === GAME_MODES.FREE_FOR_ALL
        );
        
        fighters.push(fighter);
        if (fighter.team) teams[fighter.team].push(fighter);
    }
}

// Helper functions
function determineGameMode() {
    return (PLAYERS.size >= 4 || ADD_BOTS) && Math.random() > 0.5 ? 
        GAME_MODES.TEAM_DEATHMATCH : 
        GAME_MODES.FREE_FOR_ALL;
}

function getAutoTeam() {
    return teams.red.length <= teams.blue.length ? 'red' : 'blue';
}

function balanceTeams() {
    // Balance existing fighters between teams
    fighters.forEach((fighter, index) => {
        fighter.team = index % 2 === 0 ? 'red' : 'blue';
        teams[fighter.team].push(fighter);
    });
}

function startGameLoop() {
    fightInterval = setInterval(updateFight, 50);
}

function updateFight() {
    fighters.forEach(fighter => {
        fighter.projectiles = fighter.projectiles.filter(p => p.active);
        fighter.projectiles.forEach(p => p.update());
    });

    // Process moves and attacks
    fighters.forEach(fighter => {
        if (fighter.health <= 0) return;
        fighter.update();
        
        const target = fighter.findClosestEnemy();
        if (target) {
            if (fighter.attackType === 'melee') {
                // Melee movement logic
                const desiredDistance = PLAYER_SIZE;
                fighter.moveToCombatPosition(target, desiredDistance);
                
                const distance = Math.sqrt(
                    Math.pow(fighter.x - target.x, 2) + 
                    Math.pow(fighter.y - target.y, 2)
                );

                if (distance < desiredDistance + 20) {
                    fighter.attack(target);
                }
            } else {
                // Ranged attack logic (stand still)
                /*
                const attackRange = PLAYER_SIZE * 4; // 160px range
                const distance = Math.sqrt(
                    Math.pow(fighter.x - target.x, 2) + 
                    Math.pow(fighter.y - target.y, 2)
                );

                if (distance < attackRange) {
                    fighter.attack(target);
                }
                */
                fighter.attack(target);
            }
        }
    });

    // Check for deaths and clean up
    fighters = fighters.filter(fighter => {
        if (fighter.health <= 0) {
            fighter.element.remove();
            if (currentGameMode === GAME_MODES.TEAM_DEATHMATCH) {
                teams[fighter.team] = teams[fighter.team].filter(f => f !== fighter);
            }
            return false;
        }
        return true;
    });

    if (currentGameMode === GAME_MODES.TEAM_DEATHMATCH) {
        const allArchers = fighters.every(f => f.attackType === 'ranged');
        if (allArchers && fighters.length > 1) {
            fighters.forEach(f => {
                f.attackType = 'melee';
            });
        }

        Object.entries(teams).forEach(([teamName, teamMembers]) => {
            if (teamMembers.length === 1 && teamMembers[0].attackType === 'ranged') {
                teamMembers[0].attackType = 'melee';
                teamMembers[0].element.querySelector('.health').classList.add('bg-red-600');
            }
        });
    }

    // Check win condition
    if (currentGameMode === GAME_MODES.FREE_FOR_ALL && fighters.length <= 1) {
        endFight(fighters[0]);
    } else if (currentGameMode === GAME_MODES.TEAM_DEATHMATCH) {
        if (teams.red.length === 0) endFight(teams.blue[0], 'Blue Team');
        if (teams.blue.length === 0) endFight(teams.red[0], 'Red Team');
    }
}

function endFight(winner, teamName) {
    clearInterval(fightInterval);
    const winnerText = teamName || (winner ? winner.name : 'Nobody');
    
    // Auto-restart after 4 seconds
    clearTimeout(restartTimeout);
    restartTimeout = setTimeout(startFight, 2000);
}

function resetArena() {
    document.getElementById('arena').innerHTML = '' + 
            `<div class="absolute inset-0 flex flex-col items-center justify-center 
                text-7xl font-bold text-white/50
                select-none pointer-events-none">
                <span>Jellybean</span>
                <span>Arena</span>
            </div>`;
    fighters = [];
    teams = { red: [], blue: [] };
    if (fightInterval) clearInterval(fightInterval);
}

startFight();

//document.getElementById('startButton').addEventListener('click', startFight);
//document.getElementById('resetButton').addEventListener('click', resetArena);
