import {RoomName} from "./globalConfig";
import {RoomModule} from "./RoomModule";
import {Spawn} from "./spawn";

const profiler = require('screeps-profiler');


profiler.enable();
module.exports.loop = function () {
    profiler.wrap(function () {
        main();
    });
}

function main() {
    for (let r in RoomName) {
        try {
            let roomName = <RoomName>r;
            let roomModule = new RoomModule(roomName);
            roomModule.run();
        } catch (e) {
            console.log(e.stack);
        }
    }
    Spawn.spawnCreep();
    Spawn.show();

    let bucket = Game.cpu.bucket;
    console.log("[CPU]:" + Game.cpu.getUsed().toFixed(2) + "  [BUCKET]:" + bucket)

    if (Game.time % 100 == 0) {
        if (!Memory.status) {
            Memory.status = {
                bucketTime: Game.time
            }
        }

        if (bucket >= 10000 && Game.time - Memory.status.bucketTime >= 200) {
            Game.cpu.generatePixel();
        }
        Memory.status.bucketTime = Game.time;
    }
}