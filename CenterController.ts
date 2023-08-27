import {RoomName, TerminalConfig, terminalConfigMap} from "./Config";
import {RoomController} from "./RoomController";
import {ExpandController} from "./ExpandController";


export class CenterController {
    public run() {
        let roomControllerList = this.getRoomControllerList();
        for (let roomController of roomControllerList) {
            try{
                roomController.run();
            }catch (e) {
                console.log(`room ${roomController.getRoomName()} error`);
                console.log(e.stack);
            }
        }
        this.runExpand();
        this.runPixel();
        this.runTerminal(roomControllerList);


        this.deleteDeadCreep();
    }

    private getRoomControllerList() {
        let roomControllerList: RoomController[] = [];
        for (let roomName in RoomName) {
            let roomMemory = Memory.roomData[roomName];
            if (!roomMemory) {
                // @ts-ignore
                roomMemory = {};
                Memory.roomData[roomName] = roomMemory;
            }
            let roomController = new RoomController(RoomName[roomName], roomMemory);
            roomControllerList.push(roomController);
        }
        return roomControllerList;
    }

    private runExpand() {
        try {
            if (!Memory.expand) {
                Memory.expand = {}
            }
            let expandController = new ExpandController(Memory.expand);
            expandController.run();
        } catch (e) {
            console.log(e.stack);
        }
    }

    private runPixel() {
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

    private deleteDeadCreep() {
        if (Game.time % 10000 == 0) {
            for (let name in Memory.creeps) {
                if (!Game.creeps[name]) {
                    console.log(`delete creep ${name}`)
                    delete Memory.creeps[name];
                }
            }
        }
    }

    private runTerminal(roomControllerList: RoomController[]) {
        let sendInRoomController: RoomController;
        let sendInConfig: TerminalConfig;
        roomControllerList.forEach(roomController => {
            let config = terminalConfigMap[roomController.getRoomName()];
            if (config.type == "input") {
                sendInRoomController = roomController;
                sendInConfig = config;
            }
        })

        if (!sendInRoomController) {
            return;
        }

        roomControllerList.forEach(roomController => {
            let config = terminalConfigMap[roomController.getRoomName()];
            if (config.type != "output") {
                return;
            }
            let terminal = roomController.getRoomFacility().getTerminal();
            let storage = roomController.getRoomFacility().getStorage();
            if (!terminal || !storage) {
                return;
            }
            if (storage.store.getUsedCapacity("energy") <= config.maxStorageEnergy) {
                return;
            }
            if (terminal.store.getFreeCapacity("energy") < 10000) {
                return;
            }
            if (terminal.store.getUsedCapacity("energy") >= 10000) {
                let sendAmount = Math.min(terminal.store.getUsedCapacity("energy"), 10000);
                terminal.send("energy", sendAmount, sendInRoomController.getRoomName());
                return;
            }
            roomController.getRoomFacility().submitEvent({
                type: "needCarry",
                subType: "input",
                resourceType: "energy",
                objId: terminal.id,
                amount: 10000,
                objType: "terminal"
            })
        })

        let sendInTerminal = sendInRoomController.getRoomFacility().getTerminal();
        let sendInStorage = sendInRoomController.getRoomFacility().getStorage();
        if (!sendInTerminal || !sendInStorage) {
            return;
        }
        if (sendInTerminal.store.getUsedCapacity("energy") > 1000
            && sendInStorage.store.getFreeCapacity("energy") > 1000) {
            sendInRoomController.getRoomFacility().submitEvent({
                    type: "needCarry",
                    subType: "output",
                    resourceType: "energy",
                    objId: sendInTerminal.id,
                    amount: sendInTerminal.store.getUsedCapacity("energy"),
                    objType: "terminal"
                }
            )
        }
    }
}