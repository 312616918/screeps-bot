import {DevConfig, DevLevelConfig, REPAIR_CONFIG, RoomName} from "./Config";
import {ALL_ROOM_CARRY_CONFIG, RoomCarryConfig} from "./CarryConfig";
import _ = require("lodash");

export type EventItem = {
    type: "needCarry";
    subType: "input" | "output" | "pickup";
    objId: string;
    objType: "spawn" | "builder" | "source" | "drop" | "upgrader" | "extension"
        | "terminal" | "repair" | "tower" | "ruin" | "hostile_structure" | "storage" | "tombstone";
    resourceType: ResourceConstant;
    amount: number;
}

export type ClosestRecord = {
    objId: string;
    distance: number;
}

type ObjType = "my_spawn" | "link" | "extension" | "source" | "source_container" | "tower" | "site"
    | "hostile_creeps" | "damaged_structure" | "dropped_resources" | "my_creeps"
    | "repair_wall" | "repair_rampart" | "ruin" | "hostile_structure" | "rampart" | "tombstone";

export type RoomFacilityMemory = {
    // spawnNameList: string[];
    // towerNameList: string[];
    // labNameList: string[];
    // linkNameList: string[];
    // terminalName: string;
    // storageName: string;
    // factoryName: string;
    // nukerName: string;
    // observerName: string;
    // powerSpawnName: string;
    // extensionNameList: string[];
    // sourceNameList: string[];

    eventList: EventItem[];
    lastLowEnergyTime: number;
    lastEnergy: number;
    lastEnergyChangedTime: number;
    closestLinkMap: {
        [objId: string]: ClosestRecord;
    };
    carryConfig: RoomCarryConfig;
    roadPos: {
        //x-y:id
        [posKey: string]: string;
    }
    objIdMap: {
        [t in ObjType]?: string[];
    }
    runningExpand?: boolean;
    lastAttackedTime?: number;
}


export class RoomFacility {
    public static roomFacilityMap: { [name: string]: RoomFacility } = {};

    public roomName: RoomName;
    private room: Room;
    private memory: RoomFacilityMemory;

    private creepPos: {
        //x-y:name
        [posKey: string]: string;
    }
    private controller: StructureController;
    private storage: StructureStorage;
    private terminal: StructureTerminal;
    private devConfig: DevConfig;
    private lastDevTick: number;

    private objMap: {
        [t in ObjType]?: [];
    }


    public constructor(roomName: RoomName, memory: RoomFacilityMemory) {
        this.roomName = roomName;
        this.memory = memory;
        this.room = Game.rooms[roomName];
        RoomFacility.roomFacilityMap[roomName] = this;
        if (!this.objMap) {
            this.objMap = {};
        }
        if (!this.memory.objIdMap) {
            this.memory.objIdMap = {}
        }
        this.initLowEnergyStatus();
    }

    public needChaim(): boolean {
        if (!this.roomIsMine()) {
            console.log(`room ${this.roomName} is not mine`)
            return true;
        }
        if (!this.getRoom()) {
            console.log(`room ${this.roomName} not found`)
            return true;
        }
        // if (this.getController().level <= 3) {
        //     if (this.getTowerList() || this.getTowerList().length == 0) {
        //         return true;
        //     }
        //     if (!this.getSpawnList() || this.getSpawnList().length == 0) {
        //         return true;
        //     }
        //     if (this.getCapacityEnergy() < 300 + 50 * 10) {
        //         return true;
        //     }
        // }
        if (!this.getSpawnList() || this.getSpawnList().length == 0) {
            console.log(`room ${this.roomName} no spawn`);
            return true;
        }
        return false;
    }

    public isRunningExpand(): boolean {
        return this.memory.runningExpand;
    }

    public getDevConfig(): DevConfig {
        if (this.devConfig && this.lastDevTick && Game.time - this.lastDevTick < 100) {
            return this.devConfig;
        }
        if (!this.roomIsMine()) {
            return null;
        }

        let level = this.getController().level;
        let amount = this.getCapacityEnergy();
        for (let i = DevLevelConfig.length - 1; i >= 0; i--) {
            let c = DevLevelConfig[i];
            if (level < c.minLevel) {
                continue;
            }
            if (amount < c.minEnergy) {
                continue;
            }
            this.devConfig = c;
            this.lastDevTick = Game.time;
            return c;
        }
        return null;
    }

    public getRoom(): Room {
        return this.room;
    }

    public roomIsMine(): boolean {
        return this.room && this.room.controller && this.room.controller.my;
    }

    public isInLowEnergy(): boolean {
        //初始等级
        if (this.getController() && this.getController().level < 2) {
            return true;
        }
        //超过400周期，能量不超过300
        if (this.memory.lastLowEnergyTime && Game.time - this.memory.lastLowEnergyTime > 400) {
            console.log(`room ${this.roomName} is low energy`)
            return true;
        }
        //能量没有任何变动
        if (this.memory.lastEnergyChangedTime > 0 && Game.time - this.memory.lastEnergyChangedTime > 1500) {
            console.log(`room ${this.roomName} is low energy`)
            return true;
        }
        return false;

    }

    public getCapacityEnergy(): number {
        if (!this.room) {
            return 0;
        }
        return this.room.energyCapacityAvailable;
    }

    public getAvailableEnergy(): number {
        if (!this.room) {
            return 0;
        }
        return this.room.energyAvailable;
    }

    public getSpawnList(): StructureSpawn[] {
        return this.getCachedObjList<StructureSpawn>("my_spawn");
    }

    public getSourceList(): Source[] {
        return this.getCachedObjList<Source>("source");
    }

    public getRoadPos() {
        if (this.memory.roadPos) {
            return this.memory.roadPos;
        }
        //raods
        this.memory.roadPos = {}
        let roads = this.room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return s.structureType == STRUCTURE_ROAD;
            }
        })
        for (let road of roads) {
            this.memory.roadPos[`${road.pos.x}-${road.pos.y}`] = road.id;
        }
        return this.memory.roadPos;
    }

    public getCreepPos() {
        if (this.creepPos != undefined) {
            return this.creepPos;
        }
        this.creepPos = {}
        let sc = this.getMyCreepList();
        for (let c of sc) {
            this.creepPos[`${c.pos.x}-${c.pos.y}`] = c.name;
        }
        return this.creepPos;
    }

    public submitEvent(event: EventItem) {
        this.memory.eventList.push(event);
    }

    public getEventList(): EventItem[] {
        return this.memory.eventList;
    }

    public clearEventList() {
        this.memory.eventList = [];
    }

    public getController(): StructureController {
        if (!this.room) {
            return null;
        }
        if (!this.controller) {
            this.controller = this.room.controller;
        }
        return this.controller;
    }

    public getConstructionSiteList(): ConstructionSite[] {
        return this.getCachedObjList<ConstructionSite>("site");
    }

    public getTowerList(): StructureTower[] {
        return this.getCachedObjList<StructureTower>("tower");
    }

    public getSourceContainerList(): StructureContainer[] {
        return this.getCachedObjList<StructureContainer>("source_container");
    }

    public getExtensionList(): StructureExtension[] {
        return this.getCachedObjList<StructureExtension>("extension");
    }

    public getStorage(): StructureStorage {
        if (!this.storage && this.room) {
            if (this.room.storage && !this.room.storage.my) {
                return null;
            }
            this.storage = this.room.storage;
        }
        return this.storage;
    }

    public getLinkList(): StructureLink[] {
        return this.getCachedObjList<StructureLink>("link");
    }

    public getClosestLink(objId: string): ClosestRecord {
        if (!this.memory.closestLinkMap) {
            this.memory.closestLinkMap = {};
        }
        if (this.memory.closestLinkMap[objId] && Game.time % 1000 != 0) {
            return this.memory.closestLinkMap[objId];
        }
        let result = this.memory.closestLinkMap[objId] = {
            objId: null,
            distance: 255
        };
        let obj = Game.getObjectById<{ pos: RoomPosition }>(objId);
        if (!obj) {
            return result;
        }
        let linkList = this.getLinkList();
        let closestLink: StructureLink = null;
        let minDistance = 99999;
        for (let link of linkList) {
            let distance = obj.pos.findPathTo(link.pos, {
                ignoreCreeps: true,
            }).length;
            if (distance < minDistance) {
                minDistance = distance;
                closestLink = link;
            }
        }
        if (!closestLink) {
            return result;
        }
        result.objId = closestLink.id;
        result.distance = minDistance;
        return result;
    }

    public getTerminal(): StructureTerminal {
        if (!this.terminal && this.room) {
            this.terminal = this.room.terminal;
        }
        return this.terminal;
    }

    public visualize() {
        this.getSpawnList().forEach(spawn => {
            if (!spawn.spawning) {
                return;
            }
            let spawnedTime = spawn.spawning.needTime - spawn.spawning.remainingTime;
            let progress = spawnedTime / spawn.spawning.needTime;
            spawn.room.visual.text(
                `🛠️${spawn.spawning.name} ${spawnedTime}/${spawn.spawning.needTime}= ${Math.floor(progress * 100)}%`,
                spawn.pos.x + 1,
                spawn.pos.y, {
                    align: 'left',
                    opacity: 0.1
                });
        })
    }

    public clearIfNecessary() {
        if (Game.time % 100 == 0) {
            for (let key in this.memory.closestLinkMap) {
                let obj = Game.getObjectById(key);
                if (!obj) {
                    delete this.memory.closestLinkMap[key];
                }
            }
            this.memory.carryConfig = null;

            this.memory.roadPos = null;

            this.memory.objIdMap = {};
        }
        if (this.getSourceList().length == 0) {
            console.log("init objIdMap")
            this.memory.objIdMap = {};
        }
        if (Game.time % 10 == 0 && this.getSpawnList().length == 0) {
            this.memory.objIdMap = {};
        }

        // 如果有，每周期都更新，否则，每10周期更新
        let realTimeObjType: ObjType[] = ["hostile_creeps", "damaged_structure", "dropped_resources"]
        for (let objType of realTimeObjType) {
            let cacheIdList = this.memory.objIdMap[objType];
            if (cacheIdList && cacheIdList.length > 0) {
                delete this.memory.objIdMap[objType];
                continue;
            }
            if (Game.time % 10 == 0) {
                delete this.memory.objIdMap[objType];
                continue;
            }
        }

        if (Game.time % 10 == 0) {
            delete this.memory.objIdMap["my_creeps"];
        }
    }

    public getCarryConfig(): RoomCarryConfig {
        let roomName = this.roomName;
        // 手动配置
        let config = ALL_ROOM_CARRY_CONFIG[roomName];
        if (config) {
            return config;
        }

        if (Game.time % 100 == 0) {
            this.memory.carryConfig = null;
        }

        // 自动缓存
        config = this.memory.carryConfig;
        if (config) {
            return config;
        }
        // 生成
        if (this.getLinkList().length == 0) {
            return null;
        }
        let roleMap = {};
        let storage = this.getStorage();
        this.getLinkList().forEach(link => {
            if (storage) {
                if (link.pos.getRangeTo(storage) <= 2) {
                    roleMap[link.id] = "both"
                    return;
                }
            }
            // 距离source小于等于2
            let source = link.pos.findClosestByRange(FIND_SOURCES);
            if (!source || source.pos.getRangeTo(link.pos) > 2) {
                roleMap[link.id] = "in"
                return;
            }
            roleMap[link.id] = "out"
        })
        config = {
            link: [],
            node: []
        }
        for (let linkId in roleMap) {
            let link = Game.getObjectById<StructureLink>(linkId);
            if (!link) {
                continue;
            }
            config.link.push({
                pos: link.pos,
                status: roleMap[linkId],
                increase: 0
            })
            if (roleMap[linkId] == "in") {
                config.node.push({
                    range: 1,
                    resourceType: RESOURCE_ENERGY,
                    nodePos: link.pos,
                    type: "input"
                })
            }
        }
        this.memory.carryConfig = config;
        return config;
    }

    public ticksSinceLastAttacked(): number {
        if (!this.memory.lastAttackedTime) {
            return Game.time;
        }
        return Game.time - this.memory.lastAttackedTime;
    }

    public isInSafeMode(): boolean {
        let controller = this.getController();
        if (!controller) {
            return false;
        }
        return controller.safeMode && controller.safeMode > 0;
    }

    public getHostileCreepList(): Creep[] {
        let result = this.getCachedObjList<Creep>("hostile_creeps");
        if (result && result.length > 0) {
            this.memory.lastAttackedTime = Game.time;
        }
        if(this.roomName==RoomName.E31N9){
            return _.filter(result, creep => creep.owner.username != "claptan");
        }
        return result;
    }

    public getMyCreepList(): Creep[] {
        return this.getCachedObjList<Creep>("my_creeps");
    }

    public getDamagedStructureList(): Structure[] {
        let structureList = this.getCachedObjList<Structure>("damaged_structure");
        return _.filter(structureList, s => s.hits < s.hitsMax);
    }

    public getDroppedResourceList(): Resource[] {
        return this.getCachedObjList<Resource>("dropped_resources");
    }

    public getRepairWallList(): StructureWall[] {
        return this.getCachedObjList<StructureWall>("repair_wall");
    }

    public getRepairRampartList(): StructureRampart[] {
        return this.getCachedObjList<StructureRampart>("repair_rampart");
    }

    public getRampartList(): StructureRampart[] {
        return this.getCachedObjList<StructureRampart>("rampart");
    }

    public getRuinList(): Ruin[] {
        return this.getCachedObjList<Ruin>("ruin");
    }

    public getHostileStructureList(): Structure[] {
        return this.getCachedObjList<Structure>("hostile_structure");
    }

    public getTombsList(): Tombstone[] {
        return this.getCachedObjList<Tombstone>("tombstone");
    }

    private initLowEnergyStatus() {
        if (!this.room) {
            return;
        }
        if (this.room.energyCapacityAvailable != this.room.energyAvailable) {
            if (this.memory.lastEnergy != this.room.energyAvailable) {
                this.memory.lastEnergy = this.room.energyAvailable;
                this.memory.lastEnergyChangedTime = Game.time;
            }
        }
        let availableEnergy = this.room.energyAvailable;
        if (availableEnergy > 300) {
            this.memory.lastLowEnergyTime = 0;
            return;
        }
        if (!this.memory.lastLowEnergyTime || this.memory.lastLowEnergyTime <= 0) {
            this.memory.lastLowEnergyTime = Game.time;
            console.log(`room ${this.roomName} start low energy`)
            return;
        }
    }

    private getCachedObjList<T>(objType: ObjType): T[] {
        let objList = this.objMap[objType];
        if (objList) {
            return objList;
        }
        let objIdList = this.memory.objIdMap[objType];
        if (objIdList) {
            return this.getObjList<T>(objIdList);
        }
        if (!this.room) {
            return [];
        }

        let findObjList: Structure[] | Source[] | ConstructionSite[] | Creep[] | Resource[] | Ruin[] | Tombstone[] = [];
        switch (objType) {
            case "my_spawn":
                findObjList = this.room.find(FIND_MY_SPAWNS);
                break
            case "source":
                findObjList = this.room.find(FIND_SOURCES);
                break;
            case "source_container":
                findObjList = this.room.find<StructureContainer>(FIND_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_CONTAINER && s.pos.findInRange(FIND_SOURCES, 1).length > 0;
                    }
                })
                break;
            case "extension":
                findObjList = this.room.find<StructureExtension>(FIND_MY_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_EXTENSION;
                    }
                });
                break;
            case "link":
                findObjList = this.room.find<StructureLink>(FIND_MY_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_LINK;
                    }
                });
                break;
            case "tower":
                findObjList = this.room.find<StructureTower>(FIND_MY_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_TOWER;
                    }
                });
                break;
            case "site":
                findObjList = this.room.find(FIND_MY_CONSTRUCTION_SITES);
                break;
            case "hostile_creeps":
                findObjList = this.room.find(FIND_HOSTILE_CREEPS);
                break;
            case "damaged_structure":
                findObjList = this.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        if (structure.structureType == STRUCTURE_WALL) {
                            return false;
                        }
                        if (structure.structureType == STRUCTURE_RAMPART) {
                            return false;
                        }
                        return structure.hits < 20000;
                    }
                })
                break;
            case "dropped_resources":
                findObjList = this.room.find(FIND_DROPPED_RESOURCES);
                break;
            case "my_creeps":
                findObjList = this.room.find(FIND_MY_CREEPS);
                break;
            case "repair_rampart":
                findObjList = this.room.find(FIND_MY_STRUCTURES, {
                    filter: (s) => {
                        // 临时指定为1M
                        return s.structureType == STRUCTURE_RAMPART
                            && s.hits < s.hitsMax && s.hits < REPAIR_CONFIG.targetHit - 10000;
                    }
                });
                break;
            case "repair_wall":
                findObjList = this.room.find(FIND_STRUCTURES, {
                    filter: (s) => {
                        if (s.structureType != STRUCTURE_WALL) {
                            return false;
                        }
                        // 限制必须是出口附近的wall
                        if (!this.isEntryWallPos(s.pos)) {
                            return false;
                        }
                        // 临时指定
                        return s.hits < s.hitsMax && s.hits < REPAIR_CONFIG.targetHit - 10000;
                    }
                });
                break;
            case "ruin":
                findObjList = this.room.find(FIND_RUINS);
                break;
            case "hostile_structure":
                findObjList = this.room.find(FIND_HOSTILE_STRUCTURES);
                break;
            case "rampart":
                findObjList = this.room.find(FIND_STRUCTURES, {
                    filter: (s) => {
                        return s.structureType == STRUCTURE_RAMPART;
                    }
                });
                break;
            case "tombstone":
                findObjList = this.room.find(FIND_TOMBSTONES);
                break;
            default:
                console.log(`unk type ${objType}`);
        }
        this.memory.objIdMap[objType] = findObjList.map(s => s.id);
        return <T[]>findObjList;
    }

    private isEntryWallPos(pos: RoomPosition): boolean {
        return pos.x <= 2 || pos.x >= 47 || pos.y <= 2 || pos.y >= 47;
    }

    private getObjList<T>(idList: string[]): T[] {
        let result: T[] = [];
        for (let id of idList) {
            let obj = Game.getObjectById<T>(id);
            if (!obj) {
                continue;
            }
            result.push(obj);
        }
        return result;
    }
}