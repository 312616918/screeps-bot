import {RoomController} from "./RoomController";
import {RoomName} from "./Config";
import {ExpandController} from "./ExpandController";


const profiler = require('screeps-profiler');


profiler.enable();
module.exports.loop = function () {
    profiler.wrap(function () {
        main();
    });
}


function runRoom(roomName: RoomName) {
    let roomMemory = Memory.roomData[roomName];
    if (!roomMemory) {
        // @ts-ignore
        roomMemory = {};
        Memory.roomData[roomName] = roomMemory;
    }
    let roomController = new RoomController(roomName, roomMemory);
    roomController.run();
}

function main() {
    console.log("tick:" + Game.time);

    for (let r in RoomName) {
        try {
            runRoom(RoomName[r]);
        } catch (e) {
            console.log(e.stack);
        }
    }

    try {
        if (!Memory.expand) {
            Memory.expand = {}
        }
        let expandController = new ExpandController(Memory.expand);
        expandController.run();
    } catch (e) {
        console.log(e.stack);
    }

    let bucket = Game.cpu.bucket;
    console.log("[CPU]:" + Game.cpu.getUsed().toFixed(2) + "  [BUCKET]:" + bucket)

    if (Game.time % 10 == 0) {
        if (!Memory.status) {
            Memory.status = {
                bucketTime: Game.time
            }
        }

        if (bucket >= 10000 && Game.time - Memory.status.bucketTime >= 10) {
            Game.cpu.generatePixel();
        }
        Memory.status.bucketTime = Game.time;
    }
}