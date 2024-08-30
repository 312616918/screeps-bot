import {RoomName} from "./Config";
import {RoomFacility} from "./RoomFacility";
import _ = require("lodash");

export type SpawnConfig = {
    spawnRoomName?: RoomName;
    body: BodyPartConstant[];
    memory: CreepMemory;
    num: number;
    configHash?: string;
    // 成功回调
    onSuccess?: (creepName: string) => void;
}

const moduleOrderList: string[] = [
    "harvest", "carry", "build", "upgrade", "claim"
]
const moduleOrderMap = {};
for (let i = 0; i < moduleOrderList.length; i++) {
    moduleOrderMap[moduleOrderList[i]] = i;
}

export class Spawn {
    private roomName: RoomName;
    private roomFacility: RoomFacility;
    private allSpawnConfigList: SpawnConfig[] = [];

    public constructor(roomName: RoomName, roomFacility: RoomFacility) {
        this.roomName = roomName;
        this.roomFacility = roomFacility;
        this.allSpawnConfigList = [];
    }

    public reserveSpawn(spawnConfigList: SpawnConfig[]) {
        this.allSpawnConfigList = this.allSpawnConfigList.concat(spawnConfigList);
    }


    public spawnCreeps() {
        if (this.allSpawnConfigList.length == 0) {
            return
        }
        // 排序
        _.sortBy(this.allSpawnConfigList, c => {
            return moduleOrderMap[c.memory.module];
        })
        let usedSpawnSet: { [spawnId: string]: boolean } = {};
        for (let c of this.allSpawnConfigList) {
            if (c.num <= 0 || !c.configHash) {
                console.error(`spawn error ${this.roomName} ${c.memory.module} ${JSON.stringify(c)}`);
                continue
            }
            let spawnList = this.roomFacility.getSpawnList();
            if (c.spawnRoomName) {
                spawnList = Game.rooms[c.spawnRoomName].find(FIND_MY_SPAWNS);
            }
            for (const spawn of spawnList) {
                if (spawn.spawning) {
                    continue;
                }
                if (usedSpawnSet[spawn.name]) {
                    continue;
                }
                // usedSpawnSet[spawn.id] = true;
                let creepName = `${this.roomName}-${c.memory.module}-${Game.time}-${c.configHash}`
                let res = spawn.spawnCreep(c.body, creepName, {
                    memory: {
                        module: c.memory.module,
                        group: {
                            configHash: c.configHash
                        },
                        ...c.memory
                    }
                })
                console.log(`build creep res ${creepName}, res:${res}, body:${JSON.stringify(c.body)}`);
                if (res == OK) {
                    c.onSuccess(creepName);
                    usedSpawnSet[spawn.name] = true;
                    break;
                }
            }
        }
    }
}