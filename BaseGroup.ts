import {RoomController} from "./RoomController";
import {RoomFacility} from "./RoomFacility";
import {Move} from "./move";
import {RoomName} from "./Config";

export type GroupMemory = {
    creepNameList: string[];
}

export type GroupCreepMemory = {
    configIndex: number;
}

export type SpawnConfig = {
    body: BodyPartConstant[];
    memory: CreepMemory;
    num: number;
}

export abstract class BaseGroup<T extends GroupMemory> {
    protected move: Move;
    protected memory: T;
    protected roomFacility: RoomFacility;
    protected roomName: RoomName;

    public constructor(move: Move, memory: T, roomFacility: RoomFacility) {
        this.move = move;
        this.memory = memory;
        this.roomFacility = roomFacility;
        this.roomName = roomFacility.roomName;
    }

    protected abstract moduleName: string;

    protected abstract getSpawnConfigList(): SpawnConfig[];

    protected abstract runEachCreep(creep: Creep);

    public run() {
        this.spawnCreeps()
        let nameSet = {}
        for (let creepName of this.memory.creepNameList) {
            if (nameSet[creepName]) {
                console.log(`creep name duplicate: ${this.roomName} ${creepName}`);
                continue;
            }
            nameSet[creepName] = true
            if (!Game.creeps[creepName]) {
                console.log(`creep not exist: ${this.roomName} ${creepName}`);
                this.recycleCreeps(creepName);
                continue;
            }
            let creep = Game.creeps[creepName];
            if (creep.spawning) {
                continue;
            }
            this.runEachCreep(creep);
        }
    }


    protected spawnCreeps() {
        let spawnConfigList = this.getSpawnConfigList();
        let configNumList = spawnConfigList.map(config => config.num);
        let recycleNameList = [];
        this.memory.creepNameList.forEach(name => {
            let creep = Game.creeps[name];
            if (!creep) {
                recycleNameList.push(name);
                return;
            }
            let configIndex = creep.memory.group.configIndex;
            if(configIndex >= configNumList.length){
                return;
            }
            configNumList[configIndex]--;
        })
        recycleNameList.forEach(name => {
            this.recycleCreeps(name);
        });
        configNumList.forEach((num, index) => {
            if (num <= 0) {
                return;
            }
            let config = spawnConfigList[index];
            for (const spawn of this.roomFacility.getSpawnList()) {
                if (spawn.spawning) {
                    continue;
                }
                let creepName = this.moduleName + "-" + Game.time + "-" + index;
                let res = spawn.spawnCreep(config.body, creepName, {
                    memory: {
                        module: this.moduleName,
                        group: {
                            configIndex: index
                        },
                        ...config.memory
                    }
                })
                if (res == OK) {
                    this.memory.creepNameList.push(creepName);
                    break;
                }
            }
        });
    }

    protected recycleCreeps(creepName) {
        let index = this.memory.creepNameList.indexOf(creepName);
        if (index >= 0) {
            this.memory.creepNameList.splice(index, 1);
        }
        this.beforeRecycle(Memory.creeps[creepName])
        delete Memory.creeps[creepName];
    }

    protected abstract beforeRecycle(creepMemory: CreepMemory): void;

}