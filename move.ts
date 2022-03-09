import {RoomName} from "./globalConfig";

export type MoveMemory = {
    pathCache: PathCache;
    moveRecord: MoveRecord;
}

type PathCache = {
    //pathId:fx-fy#tx-ty#range
    [pathId: string]: {
        paths: PathStep[];
        createTime: number;
    }
}

type MoveRecord = {
    [creepName: string]: {
        activeDir?: DirectionConstant;
        passiveDir?: DirectionConstant;
    }
}

export type MoveCreepMemory = {
    pathId: string;
    index: number;
    lastPos: RoomPosition;
    toPos: RoomPosition;
}

function getReverseDir(dir: DirectionConstant): DirectionConstant {
    return <DirectionConstant>((dir + 3) % 8 + 1);
}

export class Move {
    protected roomName: RoomName;
    protected memory: MoveMemory;


    public constructor(roomName: RoomName, m: MoveMemory) {
        this.roomName = roomName;
        this.memory = m;
    }

    public reserveMove(creep: Creep, toPos: RoomPosition, range: number): void {
        if (creep.memory.move) {
            let memoryToPos = creep.memory.move.toPos;
            if (memoryToPos.x != toPos.x || memoryToPos.y != toPos.y) {
                creep.memory.move = null;
            }
        }

        if (!creep.memory.move) {
            let fromPos = creep.pos;
            creep.memory.move = {
                pathId: fromPos.x + "-" + fromPos.y + "#" + toPos.x + "-" + toPos.y + "#" + range,
                index: 0,
                lastPos: creep.pos,
                toPos: toPos
            }
        }
        let creepMemory = creep.memory.move;
        let pathCache = this.memory.pathCache[creepMemory.pathId];
        let room = Game.rooms[this.roomName];
        if (!pathCache) {
            let roads = room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_ROAD
                }
            })
            pathCache = {
                paths: room.findPath(creep.pos, toPos, {
                    range: range,
                    costCallback(roomName: string, costMatrix: CostMatrix): void | CostMatrix {
                        if (roomName == "W7N24") {
                            for (let x = 0; x < 50; x++) {
                                costMatrix.set(x, 0, 255)
                            }
                        }
                        for (let road of roads) {
                            costMatrix.set(road.pos.x, road.pos.y, 0)
                        }
                    }
                }),
                createTime: Game.time
            }
            this.memory[creepMemory.pathId] = pathCache
        }

        //todo check if start pos is in paths
        let lastPos = creepMemory.lastPos;
        let nextStep = pathCache.paths[creepMemory.index];
        if (lastPos.x == creep.pos.x && lastPos.y == creep.pos.y) {
            let otherCreeps = room.lookForAt(LOOK_CREEPS, nextStep.x, nextStep.y)
            let roads = room.lookForAt(LOOK_STRUCTURES, nextStep.x, nextStep.y).filter(s => s.structureType == STRUCTURE_ROAD);
            if (otherCreeps.length && !roads.length) {
                let c = otherCreeps[0];

                if (!this.memory.moveRecord[c.name]) {
                    this.memory.moveRecord[c.name] = {}
                }
                this.memory.moveRecord[c.name].passiveDir = getReverseDir(nextStep.direction);
            }
        } else {
            creepMemory.index++;
        }

        nextStep = pathCache.paths[creepMemory.index];
        if (!this.memory.moveRecord[creep.name]) {
            this.memory.moveRecord[creep.name] = {}
        }
        this.memory.moveRecord[creep.name].activeDir = nextStep.direction;
    }

    public moveAll(): void {
        for (let creepName in this.memory.moveRecord) {
            let creep = Game.creeps[creepName];
            let record = this.memory.moveRecord[creepName];
            if (record.activeDir) {
                creep.move(record.activeDir);
            } else if (record.passiveDir) {
                creep.move(record.passiveDir);
            }
        }
    }
}