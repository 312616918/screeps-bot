"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const harvest_1 = require("./harvest");
module.exports.loop = function () {
    for (let roomNameStr in config_1.RoomName) {
        let roomName = roomNameStr;
        let harvestModule = new harvest_1.Harvest(roomName);
        harvestModule.run();
    }
};
//# sourceMappingURL=main.js.map