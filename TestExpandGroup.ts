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
                body: [MOVE],
                memory: {}
            },
            "x": {
                body: [MOVE],
                memory: {}
            }
        },
        meet: {
            pos: new RoomPosition(35, 25, RoomName.W2N18),
            dir: TOP
        },
        headPos: {
            x: 0,
            y: 0
        }
    };

    protected runEachCreep(creep: Creep) {
    }

}