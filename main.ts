import {RoomName} from "./config";
import {Harvest} from "./harvest";
import {Upgrade} from "./upgrade";
import {Carry} from "./carry";
import {Facility} from "./facility";
import {Spawn} from "./spawn";
import {Build} from "./build";
import {Move} from "./move";

module.exports.loop = function () {
    Facility.refresh();
    Facility.runTower();

    for (let roomNameStr in RoomName) {
        let roomName = <RoomName>roomNameStr;

        let moveModule = new Move(roomName);

        let facilityModule = new Facility(roomName);
        facilityModule.runLink();

        let carryModule = new Carry(roomName);
        carryModule.run();
        carryModule.visual();

        let harvestModule = new Harvest(roomName);
        harvestModule.run();

        let upgradeModule = new Upgrade(roomName);
        upgradeModule.run();

        let buildModule = new Build(roomName);
        buildModule.run();

        moveModule.moveAll();

        Spawn.spawnCreep();

        let room = Game.rooms[roomName];

        let sourceConfig = Memory.facility[roomName].sources;
        if (sourceConfig) {
            // for (let sourceId in sourceConfig) {
            //     let config = sourceConfig[sourceId];
            //     let container = Game.getObjectById<StructureContainer>(config.containerId);
            //     if (!container) {
            //         continue;
            //     }
            //     let amount = container.store.getUsedCapacity("energy");
            //     if (amount < 200) {
            //         continue;
            //     }
            //     carryModule.addCarryReq(container, "output", "energy", amount);
            // }
        }

        let drops = room.find(FIND_DROPPED_RESOURCES);
        if (drops.length != 0) {
            for (let drop of drops) {
                carryModule.addCarryReq(drop, "pickup", "energy", drop.amount);
            }
        }
        try {
            let fac = Memory.facility;
            let upgradeLink = Game.getObjectById<StructureLink>(fac[roomName].upgrade.linkId)
            if (upgradeLink && upgradeLink.store.getUsedCapacity("energy") > 0) {
                carryModule.addCarryReq(upgradeLink, "output", "energy", upgradeLink.store.getUsedCapacity("energy"));
            }
        } catch (e) {
            console.log(e)
        }


        let spawn = Game.spawns["Spawn1"];
        if (spawn.store.getFreeCapacity("energy") != 0) {
            carryModule.addCarryReq(spawn, "input", "energy", spawn.store.getFreeCapacity("energy"));
        }
    }

    //装载extension能量
    let fac = Memory.facility;
    for (let roomName in fac) {
        let roomFac = fac[<RoomName>roomName];
        let extensionIds = roomFac.extensionIds;
        if (!extensionIds) continue;
        for (let id of extensionIds) {
            let extension = Game.getObjectById<StructureExtension>(id);
            let freeCapacity = extension.store.getFreeCapacity("energy");
            if (freeCapacity > 0) {
                let carryModule = Carry.entities[<RoomName>roomName];
                if (!carryModule) {
                    continue;
                }
                carryModule.addCarryReq(extension, "input", "energy", freeCapacity);
            }
        }
    }

}