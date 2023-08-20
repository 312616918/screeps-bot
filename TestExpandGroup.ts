import {BaseExpandGroup, ExpandGroupMemory, ExpandSpawnConfig} from "./BaseExpandGroup";
import {RoomName} from "./Config";

type TestExpandGroupMemory = {} & ExpandGroupMemory;


export class TestExpandGroup extends BaseExpandGroup<TestExpandGroupMemory> {
    protected beforeRecycle(creepMemory: CreepMemory): void {
    }

    protected expandSpawnConfig: ExpandSpawnConfig = {
        name: "test-group",
        spawnRoomName: RoomName.W2N18,
        shape: [
            ["*", "x"],
            ["x", "x"]
        ],
        runOrder: ["*", "x"],
        roleConfigMap: {
            "*": {
                body: [TOUGH, TOUGH,
                    MOVE, MOVE,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    HEAL, HEAL, HEAL, HEAL, HEAL,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    HEAL, HEAL, HEAL, HEAL, HEAL,
                    MOVE, MOVE, MOVE, MOVE, MOVE,
                    HEAL, HEAL, HEAL, HEAL, HEAL,],
                memory: {}
            },
            "x": {
                body: [TOUGH, TOUGH,
                    MOVE, MOVE,
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
            pos: new RoomPosition(4, 12, RoomName.W2N18),
            dir: TOP
        },
        headPos: {
            x: 0,
            y: 0
        }
    };

    protected runEachCreep(creep: Creep) {
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
            return;
        }
        let creepList = this.memory.creepNameList.map(name => Game.creeps[name]);
        creepList.forEach(otherCreep => {
            if (otherCreep.id == creep.id) {
                return;
            }
            if (otherCreep.hits >= otherCreep.hitsMax) {
                return;
            }
            if (creep.pos.getRangeTo(otherCreep.pos) > 1) {
                creep.rangedHeal(otherCreep);
            } else {
                creep.heal(otherCreep);
            }
        })

    }

}