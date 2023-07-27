import {RoomName} from "./globalConfig";

export abstract class BaseModule{
    protected readonly roomName:RoomName;
    protected creepNameList:string[];

    protected constructor(roomName:RoomName) {
        this.roomName=roomName;
    }
    protected abstract spawnCreeps():void;
    protected abstract recoveryCreep(creepName:string):void;
    public abstract run():void;
}