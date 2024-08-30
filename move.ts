import {RoomFacility} from "./RoomFacility";
import {RoomName} from "./Config";

export type MoveMemory = {
    pathCache: PathCache;
}

type PathCache = {
    //pathId:fx-fy#tx-ty#range
    [pathId: string]: {
        paths: PathStep[];
        createTime: number;
        refreshTime: number;
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
    //last tick index
    index: number;
    toPos: RoomPosition;
    conflictName: string;
    blockTick: number;
}

function getReverseDir(dir: DirectionConstant): DirectionConstant {
    return <DirectionConstant>((dir + 3) % 8 + 1);
}

export class Move {
    protected roomName: RoomName;
    protected memory: MoveMemory;
    protected fac: RoomFacility;

    protected moveRecord: MoveRecord;


    public constructor(roomName: RoomName, m: MoveMemory, f: RoomFacility) {
        this.roomName = roomName;
        this.memory = m;
        this.fac = f;
        this.moveRecord = {};
    }

    public reserveMove(creep: Creep, toPos: RoomPosition, range: number): void {
        if (creep.fatigue > 0 || creep.pos.getRangeTo(toPos) <= range) {
            return;
        }

        //multi reserve
        // if (this.moveRecord[creep.name]) {
        //     console.log("warn:multi move" + creep.name);
        // }

        //target has changed
        if (creep.memory.move) {
            let memoryToPos = creep.memory.move.toPos;
            if (memoryToPos.x != toPos.x || memoryToPos.y != toPos.y) {
                // console.log("target changed:" + creep.name + JSON.stringify(memoryToPos) + JSON.stringify(toPos))
                creep.memory.move = null;
            }
        }


        let room = Game.rooms[this.roomName];
        let creepMemory = creep.memory.move;

        //init memory
        if (!creepMemory) {
            let fromPos = creep.pos;
            creepMemory = creep.memory.move = {
                pathId: `${fromPos.x}-${fromPos.y}#${toPos.x}-${toPos.y}#${range}`,
                index: -1,
                toPos: toPos,
                conflictName: null,
                blockTick: 0
            }
        }
        let pathCache = this.memory.pathCache[creep.memory.move.pathId];
        //find/init cache
        if (!pathCache) {
            // console.log("find path")
            let roadPos = this.fac.getRoadPos();
            let creepPos = this.fac.getCreepPos();
            pathCache = this.memory.pathCache[creepMemory.pathId] = {
                paths: room.findPath(creep.pos, toPos, {
                    range: range,
                    costCallback(roomName: string, costMatrix: CostMatrix): void | CostMatrix {
                        try {
                            for (let i = 0; i < 50; i++) {
                                costMatrix.set(i, 0, 255)
                                costMatrix.set(i, 49, 255)
                                costMatrix.set(0, i, 255)
                                costMatrix.set(49, i, 255)
                            }

                            for (let posKey in roadPos) {
                                let pos = posKey.split("-")
                                costMatrix.set(Number(pos[0]), Number(pos[1]), 1)
                            }
                            for (let posKey in creepPos) {
                                if (roadPos[posKey]) {
                                    continue;
                                }
                                let cName = creepPos[posKey];
                                let c = Game.creeps[cName];
                                if (!c || c.memory.module == "carry") {
                                    continue
                                }
                                // console.log("move conflict" + cName + " " + posKey)
                                let pos = posKey.split("-")
                                costMatrix.set(Number(pos[0]), Number(pos[1]), 255)
                            }
                        } catch (e) {
                            console.log(e.stack);
                        }
                    }
                }),
                createTime: Game.time,
                refreshTime: 0
            }
        }
        pathCache.refreshTime = Game.time;

        //mark move
        try {
            let nextStep = pathCache.paths[creepMemory.index];
            //last tick success
            if (creepMemory.index == -1
                || (nextStep.x == creep.pos.x && nextStep.y == creep.pos.y)) {
                creepMemory.index++;
                nextStep = pathCache.paths[creepMemory.index];
                creepMemory.blockTick = 0;
            } else {
                creepMemory.blockTick++;
                if (creepMemory.blockTick > 5) {
                    console.log("move block" + creep.name + JSON.stringify(creepMemory))
                    creep.memory.move = null;
                    this.memory.pathCache[creepMemory.pathId] = null;
                    return;
                }
                //last tick failed
                let posKey = `${nextStep.x}-${nextStep.y}`
                let cName = this.fac.getCreepPos()[posKey];
                // console.log("move look for " + cName + " " + posKey)
                if (cName && Game.creeps[cName]) {
                    let cModule = Game.creeps[cName].memory.module;
                    if (cModule == "carry" || cModule == "build" || this.fac.getRoadPos()[posKey]) {
                        // console.log("ask move " + cName)
                        //mark other move
                        creepMemory.conflictName = cName;
                        if (!this.moveRecord[cName]) {
                            this.moveRecord[cName] = {}
                        }
                        this.moveRecord[cName].passiveDir = getReverseDir(nextStep.direction);
                    }
                }
            }
            if (!nextStep || creep.pos.getRangeTo(nextStep.x, nextStep.y) > 1) {
                console.log("error nextStep more than 1 range </br>" + JSON.stringify(pathCache) + "</br>"
                    + JSON.stringify(creepMemory) + "</br>" + JSON.stringify(nextStep) + "</<br>" + creep.name);
                creep.memory.move = null;
                this.memory.pathCache[creepMemory.pathId] = null;
                return;
            }
            if (!this.moveRecord[creep.name]) {
                this.moveRecord[creep.name] = {}
            }
            this.moveRecord[creep.name].activeDir = nextStep.direction;
        } catch (e) {
            console.log(`move something is wrong ${creep.name} ${creepMemory.index} ${JSON.stringify(pathCache)}`);
            creep.memory.move = null;
            if (pathCache && !pathCache.paths.length) {
                delete this.memory.pathCache[creepMemory.pathId];
            }
            console.log(e.stack)
        }
    }

    public moveAll(): void {
        for (let creepName in this.moveRecord) {
            let creep = Game.creeps[creepName];
            if (!creep) {
                continue;
            }
            let record = this.moveRecord[creepName];
            if (record.activeDir) {
                creep.move(record.activeDir);
            } else if (record.passiveDir) {
                creep.move(record.passiveDir);
            }

            //visual
            let pathId = creep.memory.move ? creep.memory.move.pathId : null;
            if (pathId) {
                let cache = this.memory.pathCache[pathId];
                if (cache) {
                    new RoomVisual(this.roomName).poly(cache.paths.map(p => [p.x, p.y]))
                }
            }
        }
        this.moveRecord = {};
    }

    public cleanCache(): void {
        if (Game.time % 111 != 0) {
            return
        }
        // // logsize
        // if (this.roomName == RoomName.W2N18) {
        //     //log memory address
        //     console.log(this.memory.pathCache === Memory.roomData.W2N18.move.pathCache)
        //     console.log(
        //         "path cache size:" + Object.keys(this.memory.pathCache).length
        //     )
        //
        // }
        for (let id in this.memory.pathCache) {
            let cache = this.memory.pathCache[id];
            if (!cache
                || !cache.createTime || Game.time - cache.createTime >= 1000
                || !cache.refreshTime || Game.time - cache.refreshTime >= 100) {
                console.log(`delete pathCache: ${id}`);
                delete this.memory.pathCache[id];
            }
        }
        // if (this.roomName == RoomName.W2N18) {
        //     console.log(
        //         "after path cache size:" + Object.keys(this.memory.pathCache).length
        //     )
        //     console.log(
        //         "raw len" + Object.keys(Memory.roomData.W2N18.move.pathCache).length
        //     )
        // }
    }
}