import {logError, logInfo} from "./Util";
import {RoomFacility} from "./RoomFacility";


type RoomRecord = {
    roomName: string;
    status: "init" | "observed" | "used";
    time: number;
}

type ObserverMemory = {
    id: string;
    status: "idle" | "running";
    roomName: string;
}


export class Observer {

    private static recordMap: {
        [roomName: string]: RoomRecord
    } = {};

    private static observerMap: {
        [id: string]: ObserverMemory
    } = {};

    public static initEachTick() {
        // key数量为0
        if (Object.keys(this.recordMap).length == 0) {
            for (let roomName in RoomFacility.roomFacilityMap) {
                let fac = RoomFacility.roomFacilityMap[roomName];
                let observer = fac.getObserver();
                if (!observer) {
                    continue;
                }
                this.observerMap[roomName] = {
                    id: observer.id,
                    status: "idle",
                    roomName: roomName
                }
            }
        }

        // 标记空闲
        for (let id in this.observerMap) {
            this.observerMap[id].status = "idle";
        }

        // 检查上周期observed，但是没有使用的room
        for (let roomName in this.recordMap) {
            let record = this.recordMap[roomName];
            if (record.time != Game.time - 2) {
                continue;
            }
            if (record.status == "observed") {
                logError("room", roomName, "is not used");
            }
        }
    }


    public static getRoom(roomName: string): Room {
        // 已经有视野
        let room = Game.rooms[roomName];
        if (!room) {
            return null;
        }
        if (room.controller && room.controller.my) {
            logError("room", roomName, "is my room");
        }
        let record = this.recordMap[roomName];
        if (record) {
            record.status = "used";
            record.time = Game.time;
        }
        return room;
    }

    public static observeRoom(roomName: string) {
        logInfo("observe room", roomName);
        let room = this.getRoom(roomName);
        if (room) {
            logError("room has been observed", roomName);
            return;
        }

        let record = this.recordMap[roomName];
        if (!record) {
            record = this.recordMap[roomName] = {
                roomName: roomName,
                status: "init",
                time: Game.time
            }
        }

        // 已经提交任务
        if (record.status == "observed" && record.time == Game.time) {
            return;
        }

        // 提交任务
        let observeId = null;
        let minDistance = Infinity;
        for (let obsRoom in this.observerMap) {
            let observerMemory = this.observerMap[obsRoom];
            if (observerMemory.status == "running") {
                continue;
            }
            let distance = Game.map.getRoomLinearDistance(roomName, observerMemory.roomName);
            if (distance > 10) {
                continue;
            }
            if (distance < minDistance) {
                minDistance = distance;
                observeId = observerMemory.id;
            }
        }

        let observer = Game.getObjectById<StructureObserver>(observeId);
        if (!observer) {
            logError("no observer found", roomName, observeId);
            return;
        }

        let res = observer.observeRoom(roomName);
        if (res != OK) {
            logError("observeRoom failed", roomName, observeId, "res:" + res);
            return;
        }
        record.status = "observed";
        record.time = Game.time;

        let observerMemory = this.observerMap[observeId];
        if(!observerMemory){
            observerMemory = this.observerMap[observeId] = {
                id: observeId,
                status: "idle",
                roomName: roomName
            }
        }
        observerMemory.status = "running";
        observerMemory.roomName = roomName;
    }

}