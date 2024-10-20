import {BaseExpandGroup, ExpandGroupCreepMemory, ExpandGroupMemory, ExpandSpawnConfig} from "./BaseExpandGroup";
import {RoomName} from "./Config";

type TestExpandGroupMemory = {} & ExpandGroupMemory;

type TestExpandGroupCreepMemory = {
    lastHealCreepId?: string;
    lastAttackObjId?: string;
    lastWorkObjId?: string;
    lastAttackPos?: string;
    lastRangeAttackId?: string;
} & ExpandGroupCreepMemory;


export class TestExpandGroup extends BaseExpandGroup<TestExpandGroupMemory> {
    protected beforeRecycle(creepMemory: CreepMemory): void {
    }

    protected expandSpawnConfig: ExpandSpawnConfig = {
        name: "test-group",
        spawnRoomName: RoomName.W2N18,
        shape: [
            ["*", "x", "x"],
            ["x", "x", "x"]
        ],
        runOrder: ["*", "s", "x"],
        roleConfigMap: {
            "*": {
                body: [
                    TOUGH, TOUGH, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,],
                memory: {}
            },
            "s": {
                body: [TOUGH, TOUGH, WORK, WORK, WORK,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    WORK, WORK, WORK, WORK, WORK,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    WORK, WORK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    WORK, WORK, WORK, WORK, WORK,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    WORK, WORK, WORK, WORK, WORK,],
                memory: {}
            },
            "x": {
                body: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    // MOVE, MOVE, MOVE, MOVE, MOVE,
                    // HEAL, HEAL, HEAL, HEAL, HEAL,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    HEAL, HEAL, HEAL, HEAL, HEAL,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    HEAL, HEAL, HEAL, HEAL, HEAL,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    HEAL, HEAL, HEAL, HEAL, HEAL,],
                memory: {}
            }
        },
        meet: {
            pos: new RoomPosition(37, 45, RoomName.W3N18),
            dir: BOTTOM
        },
        headPos: {
            x: 0,
            y: 0
        }
    };

    protected runEachCreep(creep: Creep) {
        let creepMemory = <TestExpandGroupCreepMemory>creep.memory.expand;
        switch (creepMemory.role) {
            case "*":
            case "s":
                this.runAttack(creep);
                break;
            case "x":
                this.runHeal(creep);
                break;
        }
    }

    private runHeal(creep: Creep) {
        console.log("run hell")
        //降序排列
        let creepList = this.memory.creepNameList.map(name => Game.creeps[name])
            .sort((a, b) => {
                let aDamage = a.hitsMax - a.hits;
                let bDamage = b.hitsMax - b.hits;
                if (aDamage == bDamage) {
                    return 0;
                }
                return aDamage > bDamage ? -1 : 1;
            });
        let target = creepList[0];
        if (target.hitsMax == target.hits) {
            return;
        }
        console.log(`heal ${target.id}`)
        if (creep.pos.getRangeTo(target) <= 1) {
            let res = creep.heal(target);
            console.log(`heal res ${creep.id} ${target.id} ${res}`)
            return;
        }
        let res = creep.rangedHeal(target);
        console.log(`range heal res ${target.id} ${res}`)
    }

    private runAttack(creep: Creep) {
        let creepMemory = <TestExpandGroupCreepMemory>creep.memory.expand;
        // 优先最近的creep
        let lastAttackObj = Game.getObjectById<Creep>(creepMemory.lastRangeAttackId);
        if (!lastAttackObj || creep.pos.getRangeTo(lastAttackObj)>3) {
            lastAttackObj = null;
            let enemyCreepList = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
            if (enemyCreepList.length > 0) {
                lastAttackObj = enemyCreepList[0];
            }
        }
        if (lastAttackObj) {
            creepMemory.lastRangeAttackId = lastAttackObj.id;
            creep.rangedAttack(lastAttackObj);
            // creep.attack(lastAttackObj);
            return;
        }

        // 指定攻击
        let attackFlag = Game.flags[`${this.name}-attack`];
        if (attackFlag && attackFlag.room && creep.pos.getRangeTo(attackFlag) <= 3) {
            let targetStructureList = attackFlag.pos.lookFor(LOOK_STRUCTURES);
            if (targetStructureList.length > 0) {
                creep.rangedAttack(targetStructureList[0]);
                // creep.dismantle(targetStructureList[0]);
                return;
            }
        }

        // 随机攻击，除了wall和rampart
        let structureList = creep.pos.findInRange(FIND_HOSTILE_STRUCTURES, 3, {
            filter: (s) => {
                if (s.structureType == STRUCTURE_RAMPART) {
                    return false;
                }
                return true;
            }
        });
        if (structureList.length > 0) {
            creep.rangedAttack(structureList[0]);
            // creep.dismantle(structureList[0]);
            return;
        }
    }
}