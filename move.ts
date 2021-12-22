import {RoomName} from "./config";

export type MoveMemory = {
    [roomName in RoomName]?: {
        pathCache: PathCache;
    }
}

type PathCache = {
    //pathId:fx-fy#tx-ty#range
    [pathId: string]: {
        paths: PathStep[];
        createTime: number;
    }
}

export type MoveCreepMemory = {
    pathId: string;
    index: number;
}

export class Move {
    protected roomName: RoomName;
    protected pathCache: PathCache;
    static entities: {
        [roomName in RoomName]?: Move;
    } = {};

    protected creepDirection: {
        [creepId: string]: {
            nextDirection?: DirectionConstant;
            askedDirection?: DirectionConstant;
        }
    } = {};

    public constructor(roomName: RoomName) {
        this.roomName = roomName;
        if (!Memory.move) {
            Memory.move = {}
        }
        if (!Memory.move[this.roomName]) {
            Memory.move[this.roomName] = {
                pathCache: {}
            }
        }
        this.pathCache = Memory.move[this.roomName].pathCache;
        Move.entities[this.roomName] = this;
    }

    public reserveMove(creep: Creep, toPos: RoomPosition, range: number): void {
        if (!creep.memory.move) {
            let fromPos = creep.pos;
            creep.memory.move = {
                pathId: fromPos.x + "-" + fromPos.y + "#" + toPos.x + "-" + toPos.y + "#" + range,
                index: 0
            }
        }
        let creepMemory = creep.memory.move;
        let pathCache = this.pathCache[creepMemory.pathId];
        if (!pathCache) {
            let room = Game.rooms[this.roomName];
            this.pathCache[creepMemory.pathId] = {
                paths: room.findPath(creep.pos, toPos,{
                    range:range
                }),
                createTime: Game.time
            }
            pathCache = this.pathCache[creepMemory.pathId];
        }
        if (!this.creepDirection[creep.name]) {
            this.creepDirection[creep.name] = {};
        }
        let creepDir = this.creepDirection[creep.name];

        let blockCreeps = toPos.lookFor(LOOK_CREEPS);
        if (blockCreeps.length != 0) {
            this.askMove(blockCreeps[0],creep.pos);
        }
        if(pathCache.paths[creepMemory.index]){
            creepDir.nextDirection=pathCache.paths[creepMemory.index].direction;

        }
    }

    public askMove(creep: Creep, pos: RoomPosition): void {
        if (!this.creepDirection[creep.name]) {
            this.creepDirection[creep.name] = {};
        }
        let creepDir = this.creepDirection[creep.name];
        creepDir.askedDirection = creep.pos.getDirectionTo(pos);
    }
    
    public moveAll():void{
        for(let creepName in this.creepDirection){
            let creep=Game.creeps[creepName];
            let creepDirection=this.creepDirection[creepName];
            if(creepDirection.nextDirection){
                let result=creep.move(creepDirection.nextDirection);
                if(result==OK){
                    creep.memory.move.index+=1;
                    if(creep.memory.move.index>=this.pathCache[creep.memory.move.pathId].paths.length){
                        delete creep.memory.move;
                    }
                    continue;
                }
            }
            if(creepDirection.askedDirection){
                let result=creep.move(creepDirection.askedDirection);
            }
        }
    }
}