import {CarryGroup, CarryMemory} from "./CarryGroup";
import {Move, MoveMemory} from "./move";
import {UpgradeGroup, UpgradeMemory} from "./UpgradeGroup";
import {HarvestGroup, HarvestMemory} from "./HarvestGroup";
import {RoomFacility, RoomFacilityMemory} from "./RoomFacility";
import {RoomName} from "./Config";
import {GroupMemory} from "./BaseGroup";
import {BuilderGroup, BuildMemory} from "./BuilderGroup";


export type RoomMemory = {
    move: MoveMemory;
    facility: RoomFacilityMemory;
    carry: CarryMemory;
    harvest: HarvestMemory;
    upgrade: UpgradeMemory;
    build: BuildMemory;
}

export class RoomController {

    private roomName: RoomName;
    private roomMemory: RoomMemory;
    private room: Room;
    private roomFacility: RoomFacility;
    private move: Move;
    private harvestGroup: HarvestGroup;
    private upgradeGroup: UpgradeGroup;
    private carryGroup: CarryGroup;
    private buildGroup: BuilderGroup;

    public constructor(roomName: RoomName, roomMemory: RoomMemory) {
        this.roomName = roomName;
        this.roomMemory = roomMemory;
        this.room = Game.rooms[roomName];

        this.initMemory();

        this.roomFacility = new RoomFacility(this.roomName, this.roomMemory.facility);
        this.move = new Move(this.roomName, this.roomMemory.move, this.roomFacility);
        this.harvestGroup = new HarvestGroup(this.move, this.roomMemory.harvest, this.roomFacility);
        this.upgradeGroup = new UpgradeGroup(this.move, this.roomMemory.upgrade, this.roomFacility);
        this.carryGroup = new CarryGroup(this.move, this.roomMemory.carry, this.roomFacility);
        this.buildGroup = new BuilderGroup(this.move, this.roomMemory.build, this.roomFacility);
    }

    public run() {
        this.checkEvent();
        this.handleEvent();

        this.runTower();

        this.harvestGroup.run();
        this.upgradeGroup.run();
        this.buildGroup.run();

        this.carryGroup.run();
        this.carryGroup.visual();
        this.move.moveAll();
        this.move.cleanCache();

    }

    protected checkEvent() {
        let drops = this.room.find(FIND_DROPPED_RESOURCES);
        if (drops.length != 0) {
            for (let drop of drops) {
                if (drop.amount < 10) {
                    continue;
                }
                this.roomFacility.submitEvent({
                    type: "needCarry",
                    subType: "pickup",
                    objId: drop.id,
                    resourceType: drop.resourceType,
                    amount: drop.amount,
                    objType: "drop"
                })
            }
        }

        this.roomFacility.getSpawnList().forEach(spawn => {
            let amount = spawn.store.getFreeCapacity("energy");
            if (amount > 0) {
                this.roomFacility.submitEvent({
                    type: "needCarry",
                    subType: "input",
                    objId: spawn.id,
                    resourceType: "energy",
                    amount: amount,
                    objType: "spawn"
                })
            }
        });

        this.roomFacility.getSourceContainerList().forEach(container => {
            for (let resourceType in container.store) {
                let amount = container.store[resourceType];
                if (amount > 100) {
                    this.roomFacility.submitEvent({
                        type: "needCarry",
                        subType: "output",
                        objId: container.id,
                        resourceType: resourceType as ResourceConstant,
                        amount: amount,
                        objType: "source"
                    })
                }
            }
        });

        this.roomFacility.getExtensionList().forEach(extension => {
            let amount = extension.store.getFreeCapacity("energy");
            if (amount > 0) {
                this.roomFacility.submitEvent({
                    type: "needCarry",
                    subType: "input",
                    objId: extension.id,
                    resourceType: "energy",
                    amount: amount,
                    objType: "extension"
                })
            }
        });

    }


    protected handleEvent() {
        let eventList = this.roomFacility.getEventList();
        // console.log("eventList:"+JSON.stringify(eventList))
        for (let event of eventList) {
            if (event.type == "needCarry") {
                let obj = Game.getObjectById(event.objId);
                let priority = 0;
                if(event.objType == "spawn" || event.objType == "extension"){
                    priority = 1;
                }
                if(event.objType == "drop"){
                    priority = 1;
                }
                this.carryGroup.addCarryReq(<ObjectWithPos>obj, event.subType, event.resourceType, event.amount, priority);
            }
            // console.log("unknown event type:"+event.type)
        }
        this.roomFacility.clearEventList();
    }


    protected initMemory() {
        // 初始化
        if (!this.roomMemory.facility) {
            this.roomMemory.facility = {
                eventList: []
            }
        }
        if (!this.roomMemory.move) {
            this.roomMemory.move = {
                pathCache: {}
            }
        }
        if (!this.roomMemory.harvest) {
            this.roomMemory.harvest = {
                creepNameList: []
            }
        }
        if (!this.roomMemory.upgrade) {
            this.roomMemory.upgrade = {
                creepNameList: []
            }
        }
        if (!this.roomMemory.carry) {
            this.roomMemory.carry = {
                creepNameList: [],
                taskMap: {}
            }
        }
        if (!this.roomMemory.build) {
            this.roomMemory.build = {
                creepNameList: [],
                workPosMap: {}
            }
        }
    }

    public runTower(): void {
        for (let tower of this.roomFacility.getTowerList()) {
            let hostiles = tower.room.find(FIND_HOSTILE_CREEPS);
            if (hostiles.length) {
                tower.attack(hostiles[Math.floor(Math.random() * hostiles.length)]);
                continue;
            }
            let damagedStructure = tower.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    if (structure.structureType != STRUCTURE_WALL &&
                        structure.structureType != STRUCTURE_RAMPART) {
                        return structure.hits < structure.hitsMax - 1000;
                    }
                    return structure.hits < 20000;
                }
            });
            if (damagedStructure.length) {
                tower.repair(damagedStructure[Math.floor(Math.random() * damagedStructure.length)]);
            }
        }
    }

}