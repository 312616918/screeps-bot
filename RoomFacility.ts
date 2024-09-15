import {DevConfig, DevLevelConfig, RoomName} from "./Config";

export type EventItem = {
    type: "needCarry";
    subType: "input" | "output" | "pickup";
    objId: string;
    objType: "spawn" | "builder" | "source" | "drop" | "upgrader" | "extension" | "terminal";
    resourceType: ResourceConstant;
    amount: number;
}

export type ClosestRecord = {
    objId: string;
    distance: number;
}

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
    }
}


export class RoomFacility {
    public static roomFacilityMap: { [name: string]: RoomFacility } = {};

    public roomName: RoomName;
    private room: Room;
    private memory: RoomFacilityMemory;

    private spawnList: StructureSpawn[];
    private sourceList: Source[];
    private roadPos: {
        //x-y:id
        [posKey: string]: string;
    }
    private creepPos: {
        //x-y:name
        [posKey: string]: string;
    }
    private controller: StructureController;
    private constructionSiteList: ConstructionSite[];
    private towerList: StructureTower[];
    private sourceContainerList: StructureContainer[];
    private extensionList: StructureExtension[];
    private storage: StructureStorage;
    private linkList: StructureLink[];
    private terminal: StructureTerminal;
    private devConfig: DevConfig;
    private lastDevTick: number;


    public constructor(roomName: RoomName, memory: RoomFacilityMemory) {
        this.roomName = roomName;
        this.memory = memory;
        this.room = Game.rooms[roomName];
        RoomFacility.roomFacilityMap[roomName] = this;
        if (this.room) {
            let availableEnergy = this.room.energyAvailable;
            if (availableEnergy > 300) {
                this.memory.lastLowEnergyTime = 0;
            } else if (!this.memory.lastLowEnergyTime) {
                this.memory.lastLowEnergyTime = Game.time;
                console.log(`room ${roomName} start low energy`)
            }
            if (this.room.energyCapacityAvailable != this.room.energyAvailable) {
                if (this.memory.lastEnergy != this.room.energyAvailable) {
                    this.memory.lastEnergy = this.room.energyAvailable;
                    this.memory.lastEnergyChangedTime = Game.time;
                }
            }
        }
    }

    public needChaim(): boolean {
        if (!this.roomIsMine()) {
            return true;
        }
        if (this.getController().level <= 3) {
            if (this.getTowerList() || this.getTowerList().length == 0) {
                return true;
            }
            if (!this.getSpawnList() || this.getSpawnList().length == 0) {
                return true;
            }
            if (this.getCapacityEnergy() < 300 + 50 * 10) {
                return true;
            }
        }
        return false;
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
        //超过400周期，能量不超过300
        if (this.memory.lastLowEnergyTime && Game.time - this.memory.lastLowEnergyTime > 400) {
            return true;
        }
        //能量没有任何变动
        if (this.memory.lastEnergyChangedTime > 0 && Game.time - this.memory.lastEnergyChangedTime > 1500) {
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

    public getSpawnList(): StructureSpawn[] {
        if (!this.room) {
            return [];
        }
        if (!this.spawnList) {
            this.spawnList = [];
            this.room.find(FIND_MY_SPAWNS).forEach(spawn => {
                this.spawnList.push(spawn);
            });
        }
        return this.spawnList;
    }

    public getSourceList(): Source[] {
        if (!this.sourceList) {
            this.sourceList = [];
            this.room.find(FIND_SOURCES).forEach(source => {
                this.sourceList.push(source);
            });
        }
        return this.sourceList;
    }

    public getRoadPos() {
        if (this.roadPos != undefined) {
            return this.roadPos;
        }
        //raods
        this.roadPos = {}
        let roads = this.room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return s.structureType == STRUCTURE_ROAD;
            }
        })
        for (let road of roads) {
            this.roadPos[`${road.pos.x}-${road.pos.y}`] = road.id;
        }
        return this.roadPos;
    }

    public getCreepPos() {
        if (this.creepPos != undefined) {
            return this.creepPos;
        }
        this.creepPos = {}
        let sc = this.room.find(FIND_MY_CREEPS);
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
        if (!this.controller) {
            this.controller = this.room.controller;
        }
        return this.controller;
    }

    public getConstructionSiteList(): ConstructionSite[] {
        if (!this.constructionSiteList) {
            this.constructionSiteList = this.room.find(FIND_MY_CONSTRUCTION_SITES);
        }
        return this.constructionSiteList;
    }

    public getTowerList(): StructureTower[] {
        if (!this.towerList && this.room) {
            this.towerList = this.room.find<StructureTower>(FIND_MY_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_TOWER;
                }
            })
        }
        return this.towerList;
    }

    public getSourceContainerList(): StructureContainer[] {
        if (!this.sourceContainerList && this.room) {
            this.sourceContainerList = this.room.find<StructureContainer>(FIND_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_CONTAINER && s.pos.findInRange(FIND_SOURCES, 1).length > 0;
                }
            })
        }
        return this.sourceContainerList;
    }

    public getExtensionList(): StructureExtension[] {
        if (!this.extensionList && this.room) {
            this.extensionList = this.room.find<StructureExtension>(FIND_MY_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_EXTENSION;
                }
            })
        }
        return this.extensionList;
    }

    public getStorage(): StructureStorage {
        if (!this.storage && this.room) {
            this.storage = this.room.storage;
        }
        return this.storage;
    }

    public getLinkList(): StructureLink[] {
        if (!this.linkList) {
            this.linkList = this.room.find<StructureLink>(FIND_MY_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_LINK;
                }
            })
        }
        return this.linkList;
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
        if (Game.time % 1000 != 0) {
            return;
        }
        for (let key in this.memory.closestLinkMap) {
            let obj = Game.getObjectById(key);
            if (!obj) {
                delete this.memory.closestLinkMap[key];
            }
        }
    }
}