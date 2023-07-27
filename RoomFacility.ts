import {RoomName} from "./Config";

export type EventItem = {
    type: "needCarry";
    subType: "input"| "output" | "pickup";
    objId: string;
    objType: "spawn"|"builder"|"source"|"drop"|"upgrader"| "extension";
    resourceType: ResourceConstant;
    amount: number;
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
}


export class RoomFacility {
    public static roomFacilityMap:{[name:string]:RoomFacility} = {};

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


    public constructor(roomName: RoomName, memory: RoomFacilityMemory) {
        this.roomName = roomName;
        this.memory = memory;
        this.room = Game.rooms[roomName];
        RoomFacility.roomFacilityMap[roomName] = this;
    }

    public getSpawnList(): StructureSpawn[] {
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
        if(!this.constructionSiteList){
            this.constructionSiteList = this.room.find(FIND_MY_CONSTRUCTION_SITES);
        }
        return this.constructionSiteList;
    }

    public getTowerList(): StructureTower[] {
        if(!this.towerList){
            this.towerList = this.room.find<StructureTower>(FIND_MY_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_TOWER;
                }
            })
        }
        return this.towerList;
    }

    public getSourceContainerList(): StructureContainer[] {
        if(!this.sourceContainerList){
            this.sourceContainerList = this.room.find<StructureContainer>(FIND_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_CONTAINER && s.pos.findInRange(FIND_SOURCES, 1).length > 0;
                }
            })
        }
        return this.sourceContainerList;
    }

    public getExtensionList(): StructureExtension[] {
        if(!this.extensionList){
            this.extensionList = this.room.find<StructureExtension>(FIND_MY_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_EXTENSION;
                }
            })
        }
        return this.extensionList;
    }

    public getStorage(): StructureStorage {
        if(!this.storage){
            this.storage = this.room.storage;
        }
        return this.storage;
    }
}