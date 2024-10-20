import {CarryGroup, CarryMemory} from "./CarryGroup";
import {Move, MoveMemory} from "./move";
import {UpgradeGroup, UpgradeMemory} from "./UpgradeGroup";
import {HarvestGroup, HarvestMemory} from "./HarvestGroup";
import {RoomFacility, RoomFacilityMemory} from "./RoomFacility";
import {REPAIR_CONFIG, RoomName} from "./Config";
import {BuilderGroup, BuildMemory} from "./BuilderGroup";
import {ClaimGroup} from "./ClaimGroup";
import {GroupMemory} from "./BaseGroup";
import {CarryGroupV2, CarryMemoryV2} from "./CarryGroupV2";
import {Spawn} from "./Spawn";
import {Metric} from "./Metric";
import {TmpMemory} from "./TmpMemory";
import {RepairGroup, RepairMemory} from "./RepairGroup";
import {DefenderGroup, DefenderMemory} from "./DefenderGroup";
import {RemoteCarryGroup, RemoteCarryMemory} from "./RemoteCarryGroup";


export type RoomMemory = {
    move: MoveMemory;
    facility: RoomFacilityMemory;
    carry: CarryMemory;
    carry_v2?: CarryMemoryV2;
    harvest: HarvestMemory;
    upgrade: UpgradeMemory;
    build: BuildMemory;
    claim: GroupMemory;
    repair: RepairMemory;
    defend: DefenderMemory;
    remoteCarry: RemoteCarryMemory;
}

type StructureWithStore = {
    store: StoreDefinition
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
    private carryGroupV2: CarryGroupV2;
    private buildGroup: BuilderGroup;
    private claimGroup: ClaimGroup;
    private repairGroup: RepairGroup;
    private defenderGroup: DefenderGroup;
    private remoteCarryGroup: RemoteCarryGroup;
    private spawn: Spawn;
    private chaimMode: boolean;

    public constructor(roomName: RoomName, roomMemory: RoomMemory) {
        this.roomName = roomName;
        this.roomMemory = roomMemory;
        this.room = Game.rooms[roomName];

        this.initMemory();

        this.roomFacility = new RoomFacility(this.roomName, this.roomMemory.facility);
        let moveMemory = TmpMemory.getMoveMemory(this.roomName);
        this.roomMemory.move = null;
        this.move = new Move(this.roomName, moveMemory, this.roomFacility);
        this.spawn = new Spawn(this.roomName, this.roomFacility);

        //未就绪房间
        this.chaimMode = false;
        if (this.roomFacility.needChaim()) {
            this.chaimMode = true;
            console.log(`room ${this.roomName} not ready`)
        }
        if (this.chaimMode
            || (this.roomMemory.claim && this.roomMemory.claim.creepNameList.length > 0)) {
            // 结束了chaimMode但是还有creep可以利用
            this.claimGroup = new ClaimGroup(this.move, this.roomMemory.claim, this.roomFacility, this.spawn);
        }

        this.harvestGroup = new HarvestGroup(this.move, this.roomMemory.harvest, this.roomFacility, this.spawn);
        this.upgradeGroup = new UpgradeGroup(this.move, this.roomMemory.upgrade, this.roomFacility, this.spawn);
        this.repairGroup = new RepairGroup(this.move, this.roomMemory.repair, this.roomFacility, this.spawn);
        // if (this.roomName == "W2N22"||this.roomName == "W1N15") {
        //     this.carryGroupV2 = new CarryGroupV2(this.move, this.roomMemory.carry_v2, this.roomFacility, this.spawn);
        // } else {
        //     this.carryGroup = new CarryGroup(this.move, this.roomMemory.carry, this.roomFacility, this.spawn);
        // }
        // 推全使用carryV2
        this.carryGroupV2 = new CarryGroupV2(this.move, this.roomMemory.carry_v2, this.roomFacility, this.spawn);
        // v1的creep全部转移到v2
        if (this.roomMemory.carry && this.roomMemory.carry.creepNameList && this.roomMemory.carry.creepNameList.length > 0) {
            this.roomMemory.carry_v2.creepNameList.push(...this.roomMemory.carry.creepNameList);
            this.roomMemory.carry.creepNameList = [];
        }


        this.buildGroup = new BuilderGroup(this.move, this.roomMemory.build, this.roomFacility, this.spawn);
        this.defenderGroup = new DefenderGroup(this.move, this.roomMemory.defend, this.roomFacility, this.spawn);
        this.remoteCarryGroup = new RemoteCarryGroup(this.move, this.roomMemory.remoteCarry, this.roomFacility, this.spawn);
    }

    public run() {
        Metric.recordCount(1, "type", "room_run", "room", this.roomName);
        this.safeMode();
        // 先清理cache，以防cpu不足无法清理
        this.move.cleanCache();
        this.roomFacility.clearIfNecessary();

        if (this.claimGroup) {
            this.claimGroup.run();
        }
        if (this.chaimMode) {
            this.move.moveAll();
            this.spawn.spawnCreeps();
            this.runTower();
            return;
        }

        this.checkEvent();
        this.handleEvent();

        this.runTower();

        this.harvestGroup.run();
        this.upgradeGroup.run();
        this.buildGroup.run();
        this.repairGroup.run();
        this.defenderGroup.run();

        if (this.carryGroupV2) {
            this.carryGroupV2.run();
            this.carryGroupV2.visual();
        } else {
            this.carryGroup.run();
            this.carryGroup.visual();
        }
        this.remoteCarryGroup.run();
        this.spawn.spawnCreeps();
        this.move.moveAll();
        this.roomFacility.visualize();

    }

    public runTower(): void {
        let towerList = this.roomFacility.getTowerList();
        if (!towerList || towerList.length == 0) {
            return;
        }
        let room = this.roomFacility.getRoom();
        if (!room) {
            return;
        }
        let hostiles = this.roomFacility.getHostileCreepList();
        let damagedStructure = this.roomFacility.getDamagedStructureList();
        let repairRampart = this.roomFacility.getRepairRampartList();
        for (let tower of this.roomFacility.getTowerList()) {
            if (hostiles.length) {
                tower.attack(hostiles[Math.floor(Math.random() * hostiles.length)]);
                continue;
            }
            if (damagedStructure.length) {
                tower.repair(damagedStructure[Math.floor(Math.random() * damagedStructure.length)]);
                continue;
            }
            if (repairRampart.length) {
                // 默认1M
                for (let rampart of repairRampart) {
                    if (rampart.hits >= rampart.hitsMax - 1000) {
                        continue;
                    }
                    // 太低的是没有就绪，不处理，但是要维持存在
                    if (rampart.hits > 2000 && rampart.hits < REPAIR_CONFIG.targetHit - 10000) {
                        continue;
                    }
                    tower.repair(rampart);
                    break;
                }
            }
        }
    }

    public getRoomName(): RoomName {
        return this.roomName;
    }

    public getRoomFacility(): RoomFacility {
        return this.roomFacility;
    }

    protected checkEvent() {
        if (Game.time % 2 != 0) {
            return;
        }

        let drops = this.roomFacility.getDroppedResourceList();
        if (drops.length != 0) {
            for (let drop of drops) {
                if (drop.amount < 100) {
                    continue;
                }
                if (this.roomFacility.getSourceContainerList().length != 0 && drop.amount < 200) {
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

        this.roomFacility.getTowerList().forEach(tower => {
            let amount = tower.store.getFreeCapacity("energy");
            if (amount > 500) {
                this.roomFacility.submitEvent({
                    type: "needCarry",
                    subType: "input",
                    objId: tower.id,
                    resourceType: "energy",
                    amount: amount,
                    objType: "tower"
                });
            }
        })
        let storage = this.roomFacility.getStorage();
        this.roomFacility.getRuinList().forEach(ruin => {
            for (let typeStr in ruin.store) {
                let resourcesType = <ResourceConstant>typeStr;
                if (resourcesType != RESOURCE_ENERGY
                    && (!storage || storage.store.getFreeCapacity() < 10000)) {
                    continue;
                }
                let amount = ruin.store.getUsedCapacity(resourcesType);
                if (amount > 0) {
                    this.roomFacility.submitEvent({
                        type: "needCarry",
                        subType: "output",
                        objId: ruin.id,
                        resourceType: resourcesType,
                        amount: amount,
                        objType: "ruin"
                    });
                }
            }
        })

        this.roomFacility.getHostileStructureList().forEach(structure => {
            if (structure.structureType != STRUCTURE_STORAGE
                && structure.structureType != STRUCTURE_EXTENSION
                && structure.structureType != STRUCTURE_TOWER
                && structure.structureType != STRUCTURE_LINK
                && structure.structureType != STRUCTURE_TERMINAL
                && structure.structureType != STRUCTURE_FACTORY
                && structure.structureType != STRUCTURE_LAB) {
                return false;
            }

            let amount = (<StructureStorage | StructureExtension | StructureTower | StructureLink>structure).store
                .getUsedCapacity(RESOURCE_ENERGY);
            if (amount > 0) {
                this.roomFacility.submitEvent({
                    type: "needCarry",
                    subType: "output",
                    objId: structure.id,
                    resourceType: RESOURCE_ENERGY,
                    amount: amount,
                    objType: "hostile_structure"
                });
            }
        })

        // // 临时转移
        // if (Game.time % 10 == 0 && this.roomName == RoomName.E11N11) {
        //     let storage = Game.getObjectById<StructureStorage>("664a22e7750d2d1f2f3c5769");
        //     let terminal = Game.getObjectById<StructureTerminal>("66507838659b91050b2f157b");
        //     if (storage && terminal) {
        //         for (let key in terminal.store) {
        //             let resourceType = <ResourceConstant>key;
        //             let amount = terminal.store.getUsedCapacity(resourceType);
        //             if (amount > 0) {
        //                 this.roomFacility.submitEvent({
        //                     type: "needCarry",
        //                     subType: "output",
        //                     objId: terminal.id,
        //                     resourceType: resourceType,
        //                     amount: 0,
        //                     objType: "terminal"
        //                 });
        //                 this.roomFacility.submitEvent({
        //                     type: "needCarry",
        //                     subType: "input",
        //                     objId: storage.id,
        //                     resourceType: resourceType,
        //                     amount: 0,
        //                     objType: "storage"
        //                 });
        //             }
        //         }
        //     }
        // }
    }

    protected handleEvent() {
        let eventList = this.roomFacility.getEventList();
        // console.log("eventList:"+JSON.stringify(eventList))
        for (let event of eventList) {
            if (event.type == "needCarry") {
                let obj = Game.getObjectById(event.objId);
                let priority = 0;
                let increase = 0;
                if (event.objType == "ruin") {
                    priority = -1;
                }
                if (event.objType == "hostile_structure") {
                    priority = -1;
                    let target = Game.getObjectById(event.objId);
                    if (target instanceof StructureExtension || target instanceof StructureTower) {
                        priority = 4;
                    }
                }
                if (event.objType == "builder") {
                    priority = 2;
                    increase = 10;
                }
                if (event.objType == "spawn" || event.objType == "extension") {
                    priority = 3;
                }
                if (event.objType == "drop") {
                    // priority = 1;
                }
                if (event.objType == "tower") {
                    priority = 4;
                }
                if (event.objType == "upgrader") {
                    increase = 5;
                }
                if (this.carryGroupV2) {
                    this.carryGroupV2.addCarryReq(<ObjectWithPos>obj, event.subType, event.resourceType, event.amount, priority, increase);
                    continue;
                }
                this.carryGroup.addCarryReq(<ObjectWithPos>obj, event.subType, event.resourceType, event.amount, priority);
            }
            console.log("unknown event type:" + event.type)
        }
        this.roomFacility.clearEventList();
    }

    protected initMemory() {
        // 初始化
        if (!this.roomMemory.facility) {
            this.roomMemory.facility = {
                lastEnergy: 0,
                lastEnergyChangedTime: 0,
                eventList: [],
                lastLowEnergyTime: 0,
                closestLinkMap: {},
                carryConfig: null,
                roadPos: null,
                objIdMap: {},
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
                taskMap: {},
                storageTaskMap: {}
            }
        }
        if (!this.roomMemory.carry_v2) {
            this.roomMemory.carry_v2 = {
                creepNameList: [],
                taskMap: {},
                nodeTaskMap: {},
                linkTaskMap: {},
            }
        }
        if (!this.roomMemory.build) {
            this.roomMemory.build = {
                creepNameList: [],
                workPosMap: {}
            }
        }
        if (!this.roomMemory.claim) {
            this.roomMemory.claim = {
                creepNameList: []
            }
        }
        if (!this.roomMemory.repair) {
            this.roomMemory.repair = {
                creepNameList: []
            }
        }
        if (!this.roomMemory.defend) {
            this.roomMemory.defend = {
                creepNameList: []
            }
        }
        if (!this.roomMemory.remoteCarry) {
            this.roomMemory.remoteCarry = {
                creepNameList: [],
                singleCost: 0
            }
        }
    }

    private safeMode(): void {
        let controller = this.roomFacility.getController();
        if (!controller) {
            return;
        }
        if (controller.safeMode) {
            return;
        }
        if (this.roomFacility.getSpawnList().length == 0) {
            return;
        }
        let hostiles = this.roomFacility.getHostileCreepList();
        for (const hostile of hostiles) {
            if (hostile.owner.username == "Manni") {
                this.roomFacility.getController().activateSafeMode();
                // 邮件
                Game.notify("Manni attack!! Activate safeMode");
                return;
            }
        }

    }
}