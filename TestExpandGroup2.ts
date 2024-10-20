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


export class TestExpandGroup2 extends BaseExpandGroup<TestExpandGroupMemory> {
    protected beforeRecycle(creepMemory: CreepMemory): void {
    }

    protected expandSpawnConfig: ExpandSpawnConfig = {
        name: "test-group2",
        spawnRoomName: RoomName.W2N18,
        shape: [
            ["*", "x"],
            // ["x", "x", "x", "x"]
        ],
        runOrder: ["*", "s", "x"],
        roleConfigMap: {
            "*": {
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
                body: [TOUGH, TOUGH, HEAL, HEAL, HEAL,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    HEAL, HEAL, HEAL, HEAL, HEAL,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    // HEAL, HEAL, HEAL, HEAL, HEAL,
                    // MOVE, MOVE, MOVE, MOVE, MOVE,
                    // HEAL, HEAL, HEAL, HEAL, HEAL,
                    // MOVE, MOVE, MOVE, MOVE, MOVE,
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
        //降序排列
        let creepList = this.memory.creepNameList.map(name => Game.creeps[name])
            .sort((a, b) => {
                let aDamage = a.hitsMax - a.hits;
                let bDamage = b.hitsMax - b.hits;
                return bDamage - aDamage;
            });
        let creepMemory = <TestExpandGroupCreepMemory>creep.memory.expand;
        let target = creepList[0];
        if (target.hitsMax == target.hits) {
            target = Game.getObjectById(creepMemory.lastHealCreepId);
            if (!target) {
                return;
            }
        }
        creepMemory.lastHealCreepId = target.id;
        if (creep.pos.getRangeTo(target) <= 1) {
            creep.heal(target);
            return;
        }
        creep.rangedHeal(target);
    }

    private runAttack(creep: Creep) {
        let creepMemory = <TestExpandGroupCreepMemory>creep.memory.expand;
        let lastAttackObj = Game.getObjectById<Creep>(creepMemory.lastRangeAttackId);
        if (!lastAttackObj || Game.time % 10 == 0) {
            let enemyCreepList = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
            if (enemyCreepList.length > 0) {
                lastAttackObj = enemyCreepList[0];
            }
        }
        if (lastAttackObj) {
            creepMemory.lastRangeAttackId = lastAttackObj.id;
            creep.rangedAttack(lastAttackObj);
        }

        let attackFlag = Game.flags[`${this.name}-attack`];
        if (!attackFlag || !attackFlag.room) {
            return;
        }

        let posKey = `${attackFlag.pos.x}-${attackFlag.pos.y}`;
        if (creepMemory.lastAttackPos == posKey) {
            let target = Game.getObjectById<Structure | Creep>(creepMemory.lastAttackObjId);
            if (target) {
                creepMemory.lastAttackObjId = target.id;
                if (target instanceof Creep) {
                    creep.rangedAttack(target);
                } else {
                    creep.dismantle(target);
                }
                return;
            }
        }
        creepMemory.lastAttackPos = posKey;

        let targetStructureList = attackFlag.pos.lookFor(LOOK_STRUCTURES);
        if (targetStructureList.length > 0) {
            creepMemory.lastAttackObjId = targetStructureList[0].id;
            creep.dismantle(targetStructureList[0]);
            if (!lastAttackObj) {
                creep.rangedAttack(targetStructureList[0]);
            }
            return;
        }
    }

}