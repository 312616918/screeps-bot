import {BaseGroup, CreepPartConfig, GroupMemory} from "./BaseGroup";
import {SpawnConfig} from "./Spawn";
import _ = require("lodash");

export type DefenderMemory = {} & GroupMemory;

export type DefenderCreepMemory = {
    targetId?: string;
    status: "idle" | "escape" | "attack";
    safePos?: InnerPosition;
}

export class DefenderGroup extends BaseGroup<DefenderMemory> {
    protected moduleName: string = "defender";

    protected getSpawnConfigList(): SpawnConfig[] {
        let hostileList = this.roomFacility.getHostileCreepList();
        if (hostileList.length == 0) {
            return [];
        }

        if (hostileList.length == 1) {
            let userName = hostileList[0].owner.username;
            if (userName == "Invader") {
                return [];
            }
        }

        let partConfig = this.getPartConfigByAuto();
        if (!partConfig) {
            return [];
        }
        let body = [].concat(_.times(partConfig.rangeAttackNum, () => RANGED_ATTACK),
            _.times(partConfig.moveNum, () => MOVE),
            _.times(partConfig.healNum, () => HEAL));
        let spawnConfigList: SpawnConfig[] = [];
        spawnConfigList.push({
            body: body,
            memory: {
                module: this.moduleName,
                defend: {
                    status: "idle",
                }
            },
            num: 5
        });
        return spawnConfigList;
    }

    protected runEachCreep(creep: Creep) {
        let creepMemory = creep.memory.defend;
        this.runHeal(creep);

        // 损失了20%的血量，逃跑
        if (creep.hits < creep.hitsMax * 0.8) {
            creepMemory.status = "escape";
        }

        if (creepMemory.status == "idle") {
            // 寻找目标
            let hostileList = this.roomFacility.getHostileCreepList();
            if (hostileList.length == 0) {
                return;
            }
            // 可以在安全点攻击
            let safePosList = this.getSafePosList(creep);
            let target = null;
            let safePos = null;
            for (let pos of safePosList) {
                for (let hostile of hostileList) {
                    if (hostile.pos.getRangeTo(pos) <= 3) {
                        target = hostile;
                        safePos = pos;
                        break;
                    }
                }
                if (target) {
                    break;
                }
            }
            if (!target) {
                target = creep.pos.findClosestByRange(hostileList);
            }
            creepMemory.status = "attack";
            creepMemory.targetId = target.id;
            creepMemory.safePos = safePos;
        }
        if (creepMemory.status == "attack") {
            this.runAttack(creep);
            return;
        }
        if (creepMemory.status == "escape") {
            this.runEscape(creep);
            return;
        }
        this.logError(`defender status error ${creepMemory.status}`);
    }

    protected runAttack(creep: Creep): void {
        let creepMemory = creep.memory.defend;
        let target = Game.getObjectById<Creep>(creepMemory.targetId);
        if (!target || target.pos.roomName != this.roomName) {
            creepMemory.status = "idle";
            return;
        }
        if (creepMemory.safePos) {
            let safePos = new RoomPosition(creepMemory.safePos.x, creepMemory.safePos.y, this.roomName);
            if (creep.pos.getRangeTo(safePos) > 0) {
                this.move.reserveMove(creep, safePos, 0);
            }
        } else {
            if (creep.pos.getRangeTo(target) > 3) {
                this.move.reserveMove(creep, target.pos, 3);
                return;
            }
        }

        let res = creep.rangedAttack(target);
        console.log(`defender attack res ${target.id} ${res}`)
        if (res == ERR_NOT_IN_RANGE && !creepMemory.safePos) {
            this.move.reserveMove(creep, target.pos, 1);
            return;
        }
    }

    protected runHeal(creep: Creep): void {
        if (creep.hits >= creep.hitsMax) {
            return;
        }
        creep.heal(creep);
    }

    protected runEscape(creep: Creep): void {
        // 跑到安全点，或者攻击范围外
        let safePosList = this.getSafePosList(creep);
        let closedSafePos = creep.pos.findClosestByRange(safePosList);
        if (creep.pos.getRangeTo(closedSafePos) <= 3) {
            this.move.reserveMove(creep, closedSafePos, 0);
            return;
        }

        let hostileList = this.roomFacility.getHostileCreepList();
        let closedhostile = creep.pos.findClosestByRange(hostileList);
        if (creep.pos.getRangeTo(closedhostile) <= 4) {
            let savePos = this.roomFacility.getController().pos;
            if (this.roomFacility.getStorage()) {
                savePos = this.roomFacility.getStorage().pos;
            }
            this.move.reserveMove(creep, savePos, 0);
            return;
        }
    }

    protected beforeRecycle(creepMemory: CreepMemory): void {
    }

    private getSafePosList(creep: Creep): RoomPosition[] {
        let usedPosKeyMap = {};
        this.memory.creepNameList.forEach(name => {
            if (name == creep.name) {
                return;
            }
            let c = Game.creeps[name];
            if (!c) {
                return;
            }
            let cMemory = c.memory.defend;
            if (!cMemory.safePos) {
                return;
            }
            usedPosKeyMap[cMemory.safePos.x + "_" + cMemory.safePos.y] = true;
        })
        return this.roomFacility.getRampartList()
            .map(rampart => rampart.pos)
            .filter(pos => !usedPosKeyMap[pos.x + "_" + pos.y]);
    }

    private getPartConfigByAuto(): CreepPartConfig {

        let result: CreepPartConfig = {};

        result = {
            rangeAttackNum: 10,
            moveNum: 12,
            healNum: 2
        }
        if (this.isPartConfigAvailable(result)) {
            return result;
        }

        for (let i = 10; i > 0; i--) {
            result = {
                rangeAttackNum: i,
                moveNum: i + 1,
                healNum: 1
            }
            if (this.isPartConfigAvailable(result)) {
                return result;
            }
        }

        result = {
            rangeAttackNum: 1,
            moveNum: 1
        };
        return result;
    }
}