"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const harvest_1 = require("./harvest");
const upgrade_1 = require("./upgrade");
const carry_1 = require("./carry");
module.exports.loop = function () {
    for (let roomNameStr in config_1.RoomName) {
        let roomName = roomNameStr;
        let harvestModule = new harvest_1.Harvest(roomName);
        harvestModule.run();
        let upgradeModule = new upgrade_1.Upgrade(roomName);
        upgradeModule.run();
        let carryModule = new carry_1.Carry(roomName);
        carryModule.run();
        let room = Game.rooms[roomName];
        let drops = room.find(FIND_DROPPED_RESOURCES);
        if (drops.length != 0) {
            for (let drop of drops) {
                carryModule.addCarryReq(drop, "pickup", "energy", drop.amount);
            }
        }
    }
};
//# sourceMappingURL=main.js.map