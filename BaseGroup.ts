import {RoomFacility} from "./RoomFacility";
import {Move} from "./move";
import {RoomName} from "./Config";
import {Spawn, SpawnConfig} from "./Spawn";

export type GroupMemory = {
    creepNameList: string[];
}

export type GroupCreepMemory = {
    configHash: string;
}

export type CreepPartConfig = {
    workNum?: number;
    carryNum?: number;
    moveNum?: number;
    rangeAttackNum?: number;
    healNum?: number;
    autoNum?: number;
}



export abstract class BaseGroup<T extends GroupMemory> {
    protected move: Move;
    protected memory: T;
    protected roomFacility: RoomFacility;
    protected roomName: RoomName;
    protected spawn: Spawn;

    public constructor(move: Move, memory: T, roomFacility: RoomFacility, spawn: Spawn) {
        this.move = move;
        this.memory = memory;
        this.roomFacility = roomFacility;
        this.roomName = roomFacility.roomName;
        this.spawn = spawn;
    }

    protected abstract moduleName: string;

    protected abstract getSpawnConfigList(): SpawnConfig[];

    protected abstract runEachCreep(creep: Creep);

    public run() {
        try {
            this.spawnCreeps()
            let nameSet = {}
            let creepList = [];
            for (let creepName of this.memory.creepNameList) {
                if (nameSet[creepName]) {
                    this.logInfo(`creep name duplicate: ${this.roomName} ${creepName}`);
                    continue;
                }
                nameSet[creepName] = true
                if (!Game.creeps[creepName]) {
                    this.logInfo(`creep not exist: ${this.roomName} ${creepName}`);
                    this.recycleCreeps(creepName);
                    continue;
                }
                let creep = Game.creeps[creepName];
                if (creep.spawning) {
                    continue;
                }
                creepList.push(creep);
            }
            this.beforeRunEach(creepList);
            creepList.forEach(creep => {
                this.runEachCreep(creep);
            });
        }catch (e) {
            this.logError(`run error: ${this.roomName}`);
            console.log(e);
        }
    }

    protected beforeRunEach(creepList: Creep[]) {
    }

    protected spawnCreeps() {
        let spawnConfigList = this.getSpawnConfigList();
        if(!spawnConfigList){
            return;
        }
        spawnConfigList.forEach(((c,idx)=>{
            if(!c.configHash){
                c.configHash = idx.toString();
            }
        }));
        let configMap: {[configHash:string]:SpawnConfig} = {};
        spawnConfigList.forEach(c=>{
            if(c.configHash in configMap){
                this.logInfo(`configHash duplicate: ${this.roomName} ${c.configHash}`);
                return;
            }
            configMap[c.configHash] = c;
        })
        let recycleNameList = [];
        this.memory.creepNameList.forEach(name => {
            let creep = Game.creeps[name];
            if (!creep) {
                recycleNameList.push(name);
                return;
            }
            let configHash = creep.memory.group.configHash;
            if (configHash in configMap) {
                configMap[configHash].num--;
            }
        })
        recycleNameList.forEach(name => {
            this.recycleCreeps(name);
        });
        let resultConfigList = [];
        for (let configHash in configMap) {
            let c = configMap[configHash];
            if (c.num <= 0) {
                continue;
            }
            c.onSuccess = (name) => {
                this.memory.creepNameList.push(name);
            }
            resultConfigList.push(c);
        }
        this.spawn.reserveSpawn(resultConfigList);
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

    protected moveNormal(creep: Creep, pos: RoomPosition | { pos: RoomPosition }, range: number) {
        creep.moveTo(pos, {
            visualizePathStyle: {
                stroke: '#ffffff'
            },
            range: range,
            costCallback(roomName: string, costMatrix: CostMatrix): void | CostMatrix {
                // if (roomName == "W2N19"||roomName=="W7N15") {
                //     for (let i = 0; i < 50; i++) {
                //         costMatrix.set(0, i, 255)
                //         costMatrix.set(49, i, 255)
                //         costMatrix.set(i, 0, 255)
                //         costMatrix.set(i, 49, 255)
                //     }
                // }
            }
        });
    }

    protected countBodyCost(body: BodyPartConstant[]): number {
        let cost = 0;
        body.forEach(part => {
            cost += BODYPART_COST[part];
        });
        return cost;
    }

    protected logInfo(info:string){
        // 绿色
        console.log(`<span style="color: #00ff00;">[INFO]</span> [${this.roomName}] [${this.moduleName}]${info}`)
        // console.log(`[${this.roomName}] [${this.moduleName}]${info}`)
    }

    protected logError(info:string){
        // 红色
        console.log(`<span style="color: #ff0000;">[ERROR]</span> [${this.roomName}] [${this.moduleName}]${info}`)
    }

    //迭代器 生成范围内的顶点
    protected* getPosList(centerPos: RoomPosition, dis: number): IterableIterator<RoomPosition> {
        for (let x = centerPos.x - dis; x <= centerPos.x + dis; x++) {
            for (let y = centerPos.y - dis; y <= centerPos.y + dis; y++) {
                //范围不合理
                if (x <= 0 || x >= 49 || y <= 0 || y >= 49) {
                    continue;
                }
                yield new RoomPosition(x, y, centerPos.roomName);
            }
        }
    }

    protected getPartConfigCost(config:CreepPartConfig): number{
        let result = 0;
        if(config.workNum) {
            result += config.workNum * 100;
        }
        if(config.carryNum) {
            result += config.carryNum * 50;
        }
        if(config.moveNum) {
            result += config.moveNum * 50;
        }
        if(config.rangeAttackNum){
            result += config.rangeAttackNum * 150;
        }
        if(config.healNum){
            result += config.healNum * 250;
        }
        return result;
    }

    protected isPartConfigAvailable(config:CreepPartConfig): boolean{
        if(this.getPartConfigCost(config)<=this.roomFacility.getCapacityEnergy()){
            return true;
        }
        return false;
    }
}