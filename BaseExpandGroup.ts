import {RoomFacility} from "./RoomFacility";
import {RoomName} from "./Config";
import {curry} from "lodash";


type MoveRecord = {
    [creepName: string]: {
        disabled?: boolean;
        activeDir?: DirectionConstant;
        activePos?: RoomPosition;
        passiveDir?: DirectionConstant;
    }
}

export type ExpandGroupMemory = {
    creepNameList: string[];
    state: "spawn" | "meeting" | "run" | "recycle";
    nameShape: {
        [key: number]: string;
    };
    moveRecord: MoveRecord;
    headName?: string;
    nextPosMap: {
        [posKey: string]: string;
    };
    curPosMap: {
        [posKey: string]: string;
    };
}

export type ExpandGroupCreepMemory = {
    role?: string;
    shapeX?: number;
    shapeY?: number;
    targetPos?: RoomPosition;
    planTargetPos?: boolean;
    parentName?: string;
    expandMove?: {
        toPos: RoomPosition;
        path: PathFinderPath;
        index: number;
        blockTick: number;
    };
}


type RoleConfig = {
    body: BodyPartConstant[];
    memory: ExpandGroupCreepMemory;
}

export type ExpandSpawnConfig = {
    name: string;
    spawnRoomName: RoomName;
    shape: string[][];
    runOrder: string[];
    roleConfigMap: {
        [role: string]: RoleConfig;
    };
    meet: {
        pos: RoomPosition;
        dir: DirectionConstant;
    };
    headPos: {
        x: number;
        y: number;
    };
}

type SetPosItem = {
    parentCreep: Creep;
    name: string;
    dir: DirectionConstant;
    pos: RoomPosition;
}

let directionBiasMap = {
    [TOP]: {
        x: 0,
        y: -1
    },
    [TOP_RIGHT]: {
        x: 1,
        y: -1
    },
    [RIGHT]: {
        x: 1,
        y: 0
    },
    [BOTTOM_RIGHT]: {
        x: 1,
        y: 1
    },
    [BOTTOM]: {
        x: 0,
        y: 1
    },
    [BOTTOM_LEFT]: {
        x: -1,
        y: 1
    },
    [LEFT]: {
        x: -1,
        y: 0
    },
    [TOP_LEFT]: {
        x: -1,
        y: -1
    }
}

function getReverseDir(dir: DirectionConstant): DirectionConstant {
    return <DirectionConstant>((dir + 3) % 8 + 1);
}

function getDirRoom(roomName: string, x: number, y: number): string {
    if (x == 0 && y == 0) {
        return roomName;
    }
    //w23s22, e2s22, e2n2, w23n2
    let mts = roomName.match(/([EW])(\d+)([NS])(\d+)/);
    let xDir = mts[1];
    let xNum = Number(mts[2]);
    let yDir = mts[3];
    let yNum = Number(mts[4]);
    let standX = xDir == "W" ? -xNum : xNum + 1;
    let standY = yDir == "N" ? -yNum : yNum + 1;
    let newX = standX + x;
    let newY = standY + y;
    let newXDir = newX <= 0 ? "W" : "E";
    let newYDir = newY <= 0 ? "N" : "S";
    let newXNum = newX <= 0 ? -newX : newX - 1;
    let newYNum = newY <= 0 ? -newY : newY - 1;
    return `${newXDir}${newXNum}${newYDir}${newYNum}`;
}

function getStandPos(x: number, y: number, roomName: string): RoomPosition {
    let xRoomBias = 0;
    let yRoomBias = 0;
    if (x < 0) {
        xRoomBias = -1;
        x = 49;
    }
    if (x > 49) {
        xRoomBias = 1;
        x = 0;
    }
    if (y < 0) {
        yRoomBias = -1;
        y = 49;
    }
    if (y > 49) {
        yRoomBias = 1;
        y = 0;
    }
    let targetRoomName = getDirRoom(roomName, xRoomBias, yRoomBias);
    return new RoomPosition(x, y, targetRoomName);
}

function checkPosWalkable(pos: RoomPosition): boolean {
    let room = Game.rooms[pos.roomName];
    if (!room) {
        return true;
    }
    let terrain = room.getTerrain();
    if (terrain.get(pos.x, pos.y) == TERRAIN_MASK_WALL) {
        return false;
    }
    for (const struct of room.find(FIND_STRUCTURES)) {
        if (struct.pos.x != pos.x || struct.pos.y != pos.y) {
            continue;
        }
        if (struct.structureType == STRUCTURE_CONTAINER) {
            continue;
        }
        if (struct.structureType == STRUCTURE_RAMPART && struct.my) {
            continue;
        }
        if (struct.structureType == STRUCTURE_ROAD) {
            continue;
        }
        return false;
    }
    return true;
}

export abstract class BaseExpandGroup<T extends ExpandGroupMemory> {
    protected memory: T;
    protected name: string;
    protected abstract expandSpawnConfig: ExpandSpawnConfig;

    public constructor(memory: T) {
        this.memory = memory;
        this.memory.curPosMap = {};
        this.memory.nextPosMap = {};
    }

    protected abstract runEachCreep(creep: Creep);

    public run() {
        this.name = this.expandSpawnConfig.name;
        this.spawnCreeps()
        let nameSet = {}
        let creepList = [];
        for (let creepName of this.memory.creepNameList) {
            if (nameSet[creepName]) {
                console.log(`creep name duplicate: ${this.name} ${creepName}`);
                continue;
            }
            nameSet[creepName] = true
            if (!Game.creeps[creepName]) {
                console.log(`creep not exist: ${this.name} ${creepName}`);
                this.recycleCreeps(creepName);
                continue;
            }
            let creep = Game.creeps[creepName];
            if (creep.spawning) {
                continue;
            }
            let creepMemory = creep.memory.expand;
            let shapePosKey = `${creepMemory.shapeX}_${creepMemory.shapeY}`;
            if (this.memory.nameShape[shapePosKey] != creepName) {
                this.memory.nameShape[shapePosKey] = creepName;
            }
            let posKey = `${creep.pos.x}_${creep.pos.y}_${creep.pos.roomName}`;
            this.memory.curPosMap[posKey] = creepName;
            creepList.push(creep);
        }
        for (let creep of creepList) {
            this.runEachCreep(creep);
        }
        if (this.memory.state == "spawn" || this.memory.state == "meeting") {
            this.setCreepTargetPos(this.expandSpawnConfig.meet.pos, this.expandSpawnConfig.meet.dir);
            let allInPos = this.checkAlreadyInPos();
            this.moveAll();
            if (allInPos && this.memory.state == "meeting") {
                this.memory.state = "run";
            }
            return;
        }
        if (this.memory.state == "run") {
            for (let flagName in Game.flags) {
                let mtx = flagName.match(/(.+)_(\d)/);
                if (!mtx) {
                    continue;
                }
                let name = mtx[1];
                if (name != this.name) {
                    continue;
                }
                let dir = Number(mtx[2]);
                this.reverseMoveAsOne(Game.flags[flagName].pos, <DirectionConstant>dir);
            }
        }
        this.memory.curPosMap = {};
        this.memory.nextPosMap = {};
    }


    protected spawnCreeps() {
        if (!this.memory.state || this.memory.state == "spawn") {
            this.memory.state = "spawn";
        }
        if (this.memory.state != "spawn") {
            return;
        }
        let existCreepNum = 0;
        for (let creepName of this.memory.creepNameList) {
            if (Game.creeps[creepName]) {
                existCreepNum++;
            }
        }

        //获取shape中各个role的数量
        let spawnList = RoomFacility.roomFacilityMap[this.expandSpawnConfig.spawnRoomName].getSpawnList();
        let allCreepNum = 0;
        let headPosKey = `${this.expandSpawnConfig.headPos.x}_${this.expandSpawnConfig.headPos.y}`;
        this.expandSpawnConfig.shape.forEach((row, y) => {
            row.forEach((role, x) => {
                allCreepNum++;
                let shapePosKey = `${x}_${y}`;
                let shapeCreepName = this.memory.nameShape[shapePosKey];
                if (Game.creeps[shapeCreepName]) {
                    return;
                }
                let posKey = `${x}_${y}`;
                let creepName = `${this.name}_${Game.time}_${posKey}`;
                let config = this.expandSpawnConfig.roleConfigMap[role];
                for (const spawn of spawnList) {
                    if (spawn.spawning) {
                        continue;
                    }
                    let res = spawn.spawnCreep(config.body, creepName, {
                        memory: {
                            module: this.name,
                            expand: {
                                role: role,
                                shapeX: x,
                                shapeY: y,
                                ...config.memory
                            }
                        }
                    })
                    if (res == OK) {
                        this.memory.creepNameList.push(creepName);
                        this.memory.nameShape[shapePosKey] = creepName;
                        if (headPosKey == shapePosKey) {
                            this.memory.headName = creepName;
                        }
                        break;
                    }
                }
            })
        });
        let orderIdxMap = {};
        let orderList = this.expandSpawnConfig.runOrder;
        for (let i = 0; i < orderList.length; i++) {
            orderIdxMap[orderList[i]] = i;
        }
        let sortObjList = this.memory.creepNameList.map(name => {
            let creep = Game.creeps[name];
            if (!creep) {
                return null;
            }
            let role = creep.memory.expand.role;
            return {
                name: name,
                idx: orderIdxMap[role]
            }
        }).filter(obj => obj != null).sort((a, b) => {
            return a.idx - b.idx
        });
        this.memory.creepNameList = sortObjList.map(obj => obj.name).reverse();
        if (existCreepNum == allCreepNum) {
            this.memory.state = "meeting";
        }
    }

    protected recycleCreeps(creepName) {
        let index = this.memory.creepNameList.indexOf(creepName);
        if (index >= 0) {
            this.memory.creepNameList.splice(index, 1);
        }
        this.beforeRecycle(Memory.creeps[creepName])
        delete Memory.creeps[creepName];
    }

    protected abstract beforeRecycle(creepMemory: CreepMemory): void;

    private pathFinderPath(fromPos: RoomPosition, toPos: RoomPosition, range: number) {
        let moveRecord = this.memory.moveRecord;
        return PathFinder.search(fromPos, {
                pos: toPos,
                range: range
            },
            {
                roomCallback(roomName: string): boolean | CostMatrix {
                    try {
                        let costMatrix = new PathFinder.CostMatrix();
                        // //已预定位置无法通过
                        // for (let posKey in moveRecord.nextPosMap) {
                        //     let sp = posKey.split("_");
                        //     let x = Number(sp[0]);
                        //     let y = Number(sp[1]);
                        //     let posRoomName = sp[2];
                        //     if (posRoomName != roomName) {
                        //         continue;
                        //     }
                        //     costMatrix.set(x, y, 255);
                        // }
                        let room = Game.rooms[roomName];
                        if (room) {
                            room.find(FIND_STRUCTURES).forEach(function (struct) {
                                if (struct.structureType === STRUCTURE_ROAD) {
                                    // Favor roads over plain tiles
                                    costMatrix.set(struct.pos.x, struct.pos.y, 1);
                                    return;
                                }
                                if (struct.structureType == STRUCTURE_CONTAINER) {
                                    return;
                                }
                                if (struct.structureType == STRUCTURE_RAMPART && struct.my) {
                                    return;
                                }
                                // Can't walk through non-walkable buildings
                                costMatrix.set(struct.pos.x, struct.pos.y, 255);
                            });
                        }
                        return costMatrix;
                    } catch (e) {
                        console.log(e.stack);
                    }
                }
            })
    }

    protected reverseMoveAsOne(pos: RoomPosition, keepDir: DirectionConstant): void {
        let headCreep = Game.creeps[this.memory.headName];
        if (!headCreep) {
            return;
        }
        // console.log(`reverseMoveAsOne ${this.memory.headName} ${JSON.stringify(pos)} ${headCreep.pos.getRangeTo(pos)}`);
        //验证是否全部可达就位
        let allInPos = true;
        let hasNotPlanPos = false;
        for (let creepName of this.memory.creepNameList) {
            let creep = Game.creeps[creepName];
            let creepMemory = creep.memory.expand;
            let targetPos = creepMemory.targetPos;
            if (!targetPos) {
                continue;
            }
            targetPos = new RoomPosition(targetPos.x, targetPos.y, targetPos.roomName);
            if (creep.name == headCreep.name || creep.pos.getRangeTo(targetPos) == 0) {
                continue;
            }
            console.log(`not in pos ${creepName} ${JSON.stringify(targetPos)} ${creep.pos.getRangeTo(targetPos)}`)
            allInPos = false;
            hasNotPlanPos ||= !creepMemory.planTargetPos;
        }
        let headCreepMemory = headCreep.memory.expand;
        headCreepMemory.targetPos = pos;
        this.reverseMove(headCreep);
        let headMoveRecord = this.memory.moveRecord[headCreep.name];
        if (<Number>keepDir == 0) {
            if (headMoveRecord && headMoveRecord.activeDir) {
                keepDir = headMoveRecord.activeDir;
            }
        }
        if (<Number>keepDir == 0) {
            keepDir = TOP;
        }
        let nextPos = pos;
        if (headCreep.pos.getRangeTo(pos) > 0 || headMoveRecord) {
            nextPos = headMoveRecord.activePos;
        }
        if (!nextPos) {
            nextPos = pos;
        }
        this.setCreepTargetPos(nextPos, keepDir);
        if (!allInPos && !hasNotPlanPos && headMoveRecord) {
            console.log("wait for other creep")
            // headMoveRecord.disabled = true;
        }
        console.log(`set reverseMoveAsOne ${headCreep.name} ${JSON.stringify(this.memory.moveRecord[headCreep.name])} ${allInPos}`)
        this.moveAll();
    }

    protected reverseMove(creep: Creep): void {
        let toPos = creep.memory.expand.targetPos;
        if (!toPos) {
            creep.memory.expand.expandMove = null;
            return;
        }
        toPos = new RoomPosition(toPos.x, toPos.y, toPos.roomName);
        console.log(`reverseMove ${creep.name} ${JSON.stringify(toPos)} ${creep.pos.getRangeTo(toPos)}`)
        if (creep.pos.getRangeTo(toPos) == 0) {
            console.log("arrive target" + creep.name)
            creep.memory.expand.expandMove = null;
            return;
        }
        let creepMoveMemory = creep.memory.expand.expandMove;
        if (creepMoveMemory) {
            //target has changed
            let targetPos = creepMoveMemory.toPos;
            if (targetPos.x != toPos.x || targetPos.y != toPos.y) {
                creep.memory.expand.expandMove = null;
                creepMoveMemory = null;
            }
        }

        if (!creepMoveMemory) {
            creepMoveMemory = creep.memory.expand.expandMove = {
                toPos: toPos,
                path: this.pathFinderPath(creep.pos, toPos, 0),
                index: -1,
                blockTick: 0
            }
        }
        try {
            let path = creepMoveMemory.path.path;
            let nextPos = path[creepMoveMemory.index];
            if (creepMoveMemory.index == -1 || creep.pos.getRangeTo(nextPos.x, nextPos.y) == 0) {
                creepMoveMemory.index++;
                nextPos = path[creepMoveMemory.index];
                creepMoveMemory.blockTick = 0;
            } else {
                //last tick failed
                creepMoveMemory.blockTick++;
                if (creepMoveMemory.blockTick > 5) {
                    console.log("move block" + creep.name + JSON.stringify(creepMoveMemory))
                    creep.memory.expand.expandMove = null;
                    return;
                }
                let nextDir = creep.pos.getDirectionTo(nextPos.x, nextPos.y);
                // let roomFacility = RoomFacility.roomFacilityMap[creep.room.name];
                // if (roomFacility) {
                //     let posKey = `${nextPos.x}_${nextPos.y}`
                //     let cName = roomFacility.getCreepPos()[posKey];
                //     if (cName && Game.creeps[cName]) {
                //         if (!this.memory.moveRecord[cName]) {
                //             this.memory.moveRecord[cName] = {}
                //         }
                //         this.memory.moveRecord[cName].passiveDir = getReverseDir(nextDir);
                //     }
                // }
                creep.room.find(FIND_CREEPS).forEach(c => {
                    if (c.pos.x == nextPos.x && c.pos.y == nextPos.y) {
                        if (!this.memory.moveRecord[c.name]) {
                            this.memory.moveRecord[c.name] = {}
                        }
                        this.memory.moveRecord[c.name].passiveDir = getReverseDir(nextDir);
                    }
                });
            }
            //下一个位置已经被占用
            // let nextPosKey = `${nextPos.x}_${nextPos.y}_${nextPos.roomName}`;
            // if (this.memory.nextPosMap[nextPosKey]) {
            //     creep.memory.expand.expandMove = null;
            //     return;
            // }
            // this.memory.nextPosMap[nextPosKey] = creep.name;
            let nextDir = creep.pos.getDirectionTo(nextPos.x, nextPos.y);
            if (!this.memory.moveRecord[creep.name]) {
                this.memory.moveRecord[creep.name] = {}
            }
            this.memory.moveRecord[creep.name].activeDir = nextDir;
            this.memory.moveRecord[creep.name].activePos = nextPos;
        } catch (e) {
            console.log(e.stack);
            console.log(`move something is wrong ${creep.name}, ${JSON.stringify(creepMoveMemory)}}`);
            creep.memory.expand.expandMove = null;
        }
    }

    protected moveAll(): void {
        let moveRecord = this.memory.moveRecord;
        console.log(`in moveAll ${JSON.stringify(moveRecord)}`)
        for (let creepName in moveRecord) {
            let creep = Game.creeps[creepName];
            if (!creep) {
                continue;
            }
            let record = moveRecord[creepName];
            if (!record) {
                continue;
            }
            if (record.disabled) {
                continue;
            }
            console.log(`moveAll ${creepName} ${JSON.stringify(record)}`)
            if (record.activeDir) {
                creep.move(record.activeDir);
            } else if (record.passiveDir) {
                creep.move(record.passiveDir);
            }
            if (!creep.memory.expand) {
                continue;
            }
            let creepMoveMemory = creep.memory.expand.expandMove;
            if (!creepMoveMemory || !creepMoveMemory.path) {
                continue;
            }
            let path = creepMoveMemory.path.path;
            new RoomVisual(creep.room.name).poly(path.map(p => [p.x, p.y]))
        }
        this.memory.moveRecord = {};
    }

    protected checkAlreadyInPos(): boolean {
        for (let name of this.memory.creepNameList) {
            let creep = Game.creeps[name];
            let creepMemory = creep.memory.expand;
            if (!creepMemory.targetPos) {
                continue;
            }
            if (creep.pos.getRangeTo(creepMemory.targetPos) > 0) {
                return false;
            }
        }
        return true;
    }

    private setCreepTargetPos(pos: RoomPosition, headDir: DirectionConstant): boolean {
        console.log("in setCreepTargetPos");
        let allInPos = false
        let headName = this.memory.headName;
        let headCreep = Game.creeps[headName];
        if (!headCreep) {
            return allInPos;
        }
        console.log("setCreepTargetPos" + headName)
        let queue: SetPosItem[] = [];
        queue.push({
            parentCreep: null,
            name: headName,
            dir: null,
            pos: pos
        });
        let idx = 0;
        let handledMap = {};
        let placedPosMap = {};
        allInPos = true;
        while (idx < queue.length) {
            let curNode = queue[idx];
            idx++;
            if (handledMap[curNode.name]) {
                continue;
            }
            handledMap[curNode.name] = true;
            console.log(`curNode ${idx}, ${queue.length}, ${JSON.stringify(curNode)}`)
            let curPos = curNode.pos;
            let curDir = curNode.dir;
            let curCreep = Game.creeps[curNode.name];
            if (!curCreep) {
                continue;
            }
            let curMemory = curCreep.memory.expand;
            curMemory.targetPos = curCreep.pos;
            if (curDir == null) {
                curMemory.targetPos = curPos;
                curMemory.planTargetPos = true;
            } else {
                let targetDir = (headDir - TOP + curDir + 7) % 8 + 1;
                console.log(JSON.stringify(curPos))
                console.log(`${headDir} ${targetDir}`)
                let targetX = curPos.x + directionBiasMap[targetDir].x;
                let targetY = curPos.y + directionBiasMap[targetDir].y;
                let targetPos = getStandPos(targetX, targetY, curPos.roomName)
                console.log(`set ${curNode.name} ${targetDir} ${targetX} ${targetY}`)
                curMemory.targetPos = targetPos;
                curMemory.planTargetPos = checkPosWalkable(targetPos);
                // let isWalkable = checkPosWalkable(targetPos);
                // if (isWalkable) {
                //     curMemory.targetPos = targetPos;
                // } else {
                //     //不可达，移动到父级位置
                //     if (curNode.parentCreep) {
                //         curMemory.targetPos = curNode.parentCreep.pos;
                //     }
                // }
            }
            this.reverseMove(curCreep);
            // let posKey = `${curMemory.targetPos.x}_${curMemory.targetPos.y}`;
            // if (placedPosMap[posKey]) {
            //     curMemory.targetPos = curCreep.pos;
            //     posKey = `${curMemory.targetPos.x}_${curMemory.targetPos.y}`;
            // }
            // this.reverseMove(curCreep);
            // let posChanged = false;
            // if (curMemory.expandMove && curMemory.expandMove.path.incomplete) {
            //     posChanged = true;
            //     curMemory.targetPos = curCreep.pos;
            //     posKey = `${curMemory.targetPos.x}_${curMemory.targetPos.y}`;
            // }
            // if (posChanged) {
            //     this.reverseMove(curCreep);
            // }
            // if (curMemory.expandMove) {
            //     let size = curMemory.expandMove.path.path.length;
            //     curMemory.expandMove.path.path.forEach((p, idx) => {
            //         // if(idx == size - 1){
            //         //     return;
            //         // }
            //         p = new RoomPosition(p.x, p.y, p.roomName);
            //         if (p.getRangeTo(headCreep.pos) == 0) {
            //             this.memory.headBlocked = true;
            //         }
            //     });
            // }

            // placedPosMap[posKey] = true;
            if (curCreep.pos.getRangeTo(curMemory.targetPos) > 0
                && curCreep.name != headName) {
                allInPos = false;
            }
            for (let dir in directionBiasMap) {
                let shapeX = curMemory.shapeX + directionBiasMap[dir].x;
                let shapeY = curMemory.shapeY + directionBiasMap[dir].y;
                let shapePosKey = `${shapeX}_${shapeY}`;
                let dirCreepName = this.memory.nameShape[shapePosKey];
                if (!dirCreepName) {
                    continue;
                }
                queue.push({
                    parentCreep: curCreep,
                    name: dirCreepName,
                    dir: <DirectionConstant>Number(dir),
                    pos: curMemory.targetPos
                })
            }
        }
        //处理掉队的creep
        // for (let creepName of this.memory.creepNameList) {
        //     console.log(`loss creep ${creepName}`)
        //     if (handledMap[creepName]) {
        //         continue;
        //     }
        //     let creep = Game.creeps[creepName];
        //     let creepMemory = creep.memory.expand;
        //     creepMemory.targetPos = headCreep.pos;
        //     allInPos = false;
        // }
        return allInPos;
    }

    public visualize(): void {
        for (let creepName of this.memory.creepNameList) {
            let creep = Game.creeps[creepName];
            if (!creep) {
                continue;
            }
            let creepMemory = creep.memory.expand;
            if (!creepMemory) {
                continue;
            }
            if (creepMemory.expandMove && creepMemory.expandMove.path) {
                let path = creepMemory.expandMove.path.path;
                let pathWithStart = [creep.pos].concat(path);
                new RoomVisual(creep.room.name).poly(pathWithStart.map(p => [p.x, p.y]))
            }
            if (creepMemory.targetPos) {
                new RoomVisual(creepMemory.targetPos.roomName)
                    .text(creepMemory.role, creepMemory.targetPos.x, creepMemory.targetPos.y)
                new RoomVisual(creep.room.name)
                    .text(`${creepMemory.targetPos.x}_${creepMemory.targetPos.y}`, creep.pos.x, creep.pos.y,
                        {
                            color: 'blue',
                            font: 0.5
                        });
            }
        }
    }
}