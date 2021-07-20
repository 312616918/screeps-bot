import {RoomName} from "./config";

export abstract class BaseModule{
    protected readonly roomName:RoomName;
    protected creepNameSet:Set<string>;

    protected constructor(roomName:RoomName) {
        this.roomName=roomName;
    }
    protected abstract spawnCreeps():void;
    protected abstract recoveryCreep(creepName:string):void;
    public abstract run():void;
}