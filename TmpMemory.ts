import {Metric} from "./Metric";
import {MoveMemory} from "./move";
import {RoomName} from "./Config";


export class TmpMemory {
    private static isEffect: boolean;

    private static moveMemoryMap: {
        [roomName in RoomName]?: MoveMemory
    }

    public static metric() {
        if (this.isEffect) {
            return;
        }
        Metric.recordCount(1, "type", "global_mem_clean")
        this.isEffect = true;
    }

    public static getMoveMemory(roomName: RoomName) {
        if (!this.moveMemoryMap) {
            Metric.recordCount(1, "type", "global_move_clean");
            this.moveMemoryMap = {}
        }
        let memory = this.moveMemoryMap[roomName];
        if (!memory) {
            memory = this.moveMemoryMap[roomName] = {
                pathCache: {}
            };
        }
        return memory;
    }
}