"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spawn = void 0;
class Spawn {
    static reserveCreep(template) {
        if (Game.creeps[template.name]) {
            console.warn(`${template.name} is existed`);
            return;
        }
        if (template.spawnNames.length == 0) {
            console.warn("spawnNames is empty");
            return;
        }
        if (template.bakTick) {
            var name = null;
            var origin = Game.creeps[template.name];
            var bak = Game.creeps[template.name + "-bak"];
            if (!origin && bak && bak.ticksToLive < template.bakTick) {
                name = template.name;
            }
            if (!bak && origin && origin.ticksToLive < template.bakTick) {
                name = template.name + "-bak";
            }
            if (!origin && !bak) {
                name = template.name;
            }
            if (!name) {
                return;
            }
            template.name = name;
        }
        for (let i in template.spawnNames) {
            let spawnName = template.spawnNames[i];
            let spawn = Game.spawns[spawnName];
            if (!spawn || !spawn.isActive()) {
                console.log(`${spawnName} is null or not active`);
                continue;
            }
            if (spawn.spawning) {
                console.log(`${spawnName} is busy`);
                continue;
            }
            let reservedPlan = this.spawnMap.get(spawnName);
            if (!reservedPlan || reservedPlan.priority < template.priority) {
                this.spawnMap.set(spawnName, template);
                console.log(`${template.name} reserved`);
            }
        }
    }
    static spawnCreep() {
        for (let spawnName in this.spawnMap) {
            let template = this.spawnMap.get(spawnName);
            let res = Game.spawns[spawnName].spawnCreep(template.body, template.name, {
                memory: template.memory
            });
            console.log("[SpawnCreep]:" + template.name + "-" + res);
        }
        this.spawnMap.clear();
    }
    static show() {
        for (let name in Game.spawns) {
            let spawn = Game.spawns[name];
            if (!spawn.spawning) {
                continue;
            }
            spawn.room.visual.text('🛠️' + spawn.spawning.name, spawn.pos.x + 1, spawn.pos.y, {
                align: 'left',
                opacity: 0.8
            });
        }
    }
}
exports.Spawn = Spawn;
//# sourceMappingURL=spawn.js.map