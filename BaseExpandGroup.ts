import {RoomFacility} from "./RoomFacility";
import {RoomName} from "./Config";


type MoveRecord = {
    [creepName: string]: {
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
}

export type ExpandGroupCreepMemory = {
    role?: string;
    shapeX?: number;
    shapeY?: number;
    targetPos?: RoomPosition;
    parentName?: string;
    expandMove?: {
        toPos: RoomPosition;
        path: PathFinderPath;
        index: number;
        blockTick: number;
    }
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

export abstract class BaseExpandGroup<T extends ExpandGroupMemory> {
    protected memory: T;
    protected name: string;
    protected abstract expandSpawnConfig: ExpandSpawnConfig;

    public constructor(memory: T) {
        this.memory = memory;
    }

    protected abstract runEachCreep(creep: Creep);

    public run() {
        this.name = this.expandSpawnConfig.name;
        this.spawnCreeps()
        let nameSet = {}
        if (this.memory.state == "spawn" || this.memory.state == "meeting") {
            let allInPos = this.setCreepTargetPos(this.expandSpawnConfig.meet.pos, this.expandSpawnConfig.meet.dir);
            for (let creepName of this.memory.creepNameList) {
                console.log(`try setCreepTargetPos ${creepName}`)
                let creep = Game.creeps[creepName];
                if (!creep) {
                    continue;
                }
                this.reverseMove(creep);
            }
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
            // let flag = Game.flags[this.name];
            // console.log(`flag ${this.name} ${JSON.stringify(flag)}`)
            // if (flag) {
            //     let pos = flag.pos;
            //     this.setCreepTargetPos(pos, TOP);
            // }
        }
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
            this.runEachCreep(creep);
        }
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

    private PathFinderPath(fromPos: RoomPosition, toPos: RoomPosition, range: number) {
        return PathFinder.search(fromPos, {
                pos: toPos,
                range: range
            },
            {
                roomCallback(roomName: string): boolean | CostMatrix {
                    try {
                        let costMatrix = new PathFinder.CostMatrix();
                        // let roomFacility = RoomFacility.roomFacilityMap[roomName];
                        // if (roomFacility) {
                        //     for (let posKey in roomFacility.getCreepPos()) {
                        //         let pos = posKey.split("-");
                        //         costMatrix.set(Number(pos[0]), Number(pos[1]), 1)
                        //     }
                        // }
                        let room = Game.rooms[roomName];
                        if (room) {
                            room.find(FIND_STRUCTURES).forEach(function (struct) {
                                if (struct.structureType === STRUCTURE_ROAD) {
                                    // Favor roads over plain tiles
                                    costMatrix.set(struct.pos.x, struct.pos.y, 1);
                                } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                                    (struct.structureType !== STRUCTURE_RAMPART ||
                                        !struct.my)) {
                                    // Can't walk through non-walkable buildings
                                    costMatrix.set(struct.pos.x, struct.pos.y, 0xff);
                                }
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
        for (let creepName of this.memory.creepNameList) {
            if (creepName == headCreep.name) {
                continue;
            }
            let creep = Game.creeps[creepName];
            let creepMemory = creep.memory.expand;
            let targetPos = creepMemory.targetPos;
            if (!targetPos) {
                continue;
            }
            targetPos = new RoomPosition(targetPos.x, targetPos.y, targetPos.roomName);
            if (creep.pos.getRangeTo(targetPos) == 0) {
                continue;
            }
            console.log(`not in pos ${creepName} ${JSON.stringify(targetPos)} ${creep.pos.getRangeTo(targetPos)}`)
            allInPos = false;
            break;
        }

        let headCreepMemory = headCreep.memory.expand;
        headCreepMemory.targetPos = pos;
        this.reverseMove(headCreep);
        console.log(`set reverseMoveAsOne ${headCreep.name} ${JSON.stringify(this.memory.moveRecord[headCreep.name])} ${allInPos}`)
        if (this.memory.moveRecord[headCreep.name] && allInPos) {
            let headDir = this.memory.moveRecord[headCreep.name].activeDir;
            if (keepDir) {
                headDir = keepDir;
            }
            console.log(`set reverseMoveAsOne ${headCreep.name} ${headDir} ${JSON.stringify(this.memory.moveRecord[headCreep.name])}`)
            this.setCreepTargetPos(this.memory.moveRecord[headCreep.name].activePos, headDir);
        } else {
            console.log("wait for other creep")
            this.memory.moveRecord[headCreep.name] = null;
        }
        for (let creepName of this.memory.creepNameList) {
            if (creepName == headCreep.name) {
                continue;
            }
            let creep = Game.creeps[creepName];
            if (!creep) {
                continue;
            }
            this.reverseMove(creep);
        }
        this.moveAll();
    }

    protected reverseMove(creep: Creep): void {
        let toPos = creep.memory.expand.targetPos;
        if (!toPos) {
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
                path: this.PathFinderPath(creep.pos, toPos, 0),
                index: -1,
                blockTick: 0
            }
            // 不可达，移动到父级位置
            // if (creepMoveMemory.path.incomplete) {
            //     let parentName = creep.memory.expand.parentName;
            //     if (parentName) {
            //         let parentCreep = Game.creeps[parentName];
            //         if (parentCreep) {
            //             let parentPos = parentCreep.pos;
            //             creepMoveMemory.path = this.PathFinderPath(creep.pos, parentPos, 0);
            //         }
            //     }
            // }
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
                if (creepMoveMemory.blockTick > 1) {
                    nextPos = new RoomPosition(nextPos.x, nextPos.y, creep.room.name);
                    let groupBlock = false;
                    nextPos.lookFor(LOOK_CREEPS).forEach(c => {
                        if (c.memory.module == this.name) {
                            creep.memory.expand.targetPos = creep.pos;
                            groupBlock = true;
                        }
                    });
                    if (groupBlock) {
                        return;
                    }
                }
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
                        //运行中无权干涉父级移动
                        // if (this.memory.state == "run" && c.name == creep.memory.expand.parentName) {
                        //     return;
                        // }
                        this.memory.moveRecord[c.name].passiveDir = getReverseDir(nextDir);
                    }
                });
            }
            if (creep.pos.getRangeTo(nextPos.x, nextPos.y) > 1) {
                console.log("error nextStep more than 1 range </br>" + JSON.stringify(creepMoveMemory) + "</br>"
                    + JSON.stringify(nextPos) + "</<br>" + creep.name);
                creep.memory.expand.expandMove = null;
                return;
            }
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

    private setCreepTargetPos(pos: RoomPosition, headDir: DirectionConstant): boolean {
        console.log("in setCreepTargetPos");
        let headPos = this.expandSpawnConfig.headPos;
        let headShapePosKey = `${headPos.x}_${headPos.y}`;
        let headName = this.memory.nameShape[headShapePosKey];
        let allInPos = false;
        if (!headName) {
            return allInPos;
        }
        let headCreep = Game.creeps[headName];
        if (!headCreep) {
            return allInPos;
        }
        console.log("setCreepTargetPos" + headName)
        let queue = [];
        let setPos = {};
        queue.push({
            parentName: null,
            name: headName,
            dir: null,
            pos: pos
        });
        let idx = 0;
        let handledMap = {};
        let placedPosMap = {};
        let oldPosMap = {};
        allInPos = true;
        while (idx < queue.length) {
            let curNode = queue[idx];
            console.log(`curNode ${idx}, ${queue.length}, ${JSON.stringify(curNode)}`)
            idx++;
            if (handledMap[curNode.name]) {
                continue;
            }
            handledMap[curNode.name] = true;
            let curPos = curNode.pos;
            let curDir = curNode.dir;
            let curCreep = Game.creeps[curNode.name];
            let curMemory = curCreep.memory.expand;
            if (curDir == null) {
                oldPosMap[curNode.name] = Game.creeps[curNode.name].pos;
                curMemory.targetPos = curPos;
                let posKey = `${curPos.x}_${curPos.y}`;
                placedPosMap[posKey] = true;
            } else {
                let targetDir = (headDir - TOP + curDir + 7) % 8 + 1;
                let targetX = curPos.x + directionBiasMap[targetDir].x;
                let targetY = curPos.y + directionBiasMap[targetDir].y;
                console.log(`set ${curNode.name} ${targetDir} ${targetX} ${targetY}`)
                let xRoomBias = 0;
                let yRoomBias = 0;
                if (targetX < 0) {
                    xRoomBias = -1;
                    targetX = 49;
                }
                if (targetX > 49) {
                    xRoomBias = 1;
                    targetX = 0;
                }
                if (targetY < 0) {
                    yRoomBias = -1;
                    targetY = 49;
                }
                if (targetY > 49) {
                    yRoomBias = 1;
                    targetY = 0;
                }
                let targetRoomName = getDirRoom(curPos.roomName, xRoomBias, yRoomBias);
                let targetPos = new RoomPosition(targetX, targetY, targetRoomName);


                let isWalkable = true;
                let room = Game.rooms[targetRoomName];
                if (room) {
                    let terrain = room.getTerrain();
                    if (terrain.get(targetPos.x, targetPos.y) == TERRAIN_MASK_WALL) {
                        isWalkable = false;
                    }
                    if (isWalkable) {
                        room.find(FIND_STRUCTURES).forEach(function (struct) {
                            if (!isWalkable) {
                                return;
                            }
                            if (struct.pos.x != targetPos.x || struct.pos.y != targetPos.y) {
                                return;
                            }
                            if (struct.structureType !== STRUCTURE_CONTAINER &&
                                (struct.structureType !== STRUCTURE_RAMPART ||
                                    !struct.my)) {
                                isWalkable = false;
                            }
                        });
                    }
                }
                oldPosMap[curNode.name] = curMemory.targetPos;
                if (isWalkable) {
                    targetPos = new RoomPosition(targetX, targetY, targetRoomName);
                    curMemory.targetPos = targetPos;
                } else {
                    //不可达，移动到父级位置
                    if (oldPosMap[curNode.parentName]) {
                        curMemory.targetPos = oldPosMap[curNode.parentName];
                        delete oldPosMap[curNode.parentName];
                    }
                }
                curMemory.parentName = curNode.parentName;
                if(curMemory.targetPos){
                    let posKey = `${curMemory.targetPos.x}_${curMemory.targetPos.y}`;
                    if(placedPosMap[posKey]){
                        curMemory.targetPos = curCreep.pos;
                    }else{
                        placedPosMap[posKey] = true;
                    }
                }

                // console.log(`set ${curNode.name} ${JSON.stringify(curMemory.targetPos)}`)
            }
            if (curCreep.pos.getRangeTo(curMemory.targetPos) > 0) {
                allInPos = false;
            }
            for (let dir in directionBiasMap) {
                let shapeX = curMemory.shapeX + directionBiasMap[dir].x;
                let shapeY = curMemory.shapeY + directionBiasMap[dir].y;
                let shapePosKey = `${shapeX}_${shapeY}`;
                let dirCreepName = this.memory.nameShape[shapePosKey];
                console.log(`check ${shapePosKey} ${dirCreepName}`)
                if (!dirCreepName) {
                    continue;
                }
                queue.push({
                    parentName: curNode.name,
                    name: dirCreepName,
                    dir: Number(dir),
                    pos: curMemory.targetPos
                })
            }
        }
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
                new RoomVisual(creep.room.name).poly(path.map(p => [p.x, p.y]))
            }
            if (creepMemory.targetPos) {
                new RoomVisual(creepMemory.targetPos.roomName)
                    .text(creepMemory.role, creepMemory.targetPos.x, creepMemory.targetPos.y)
            }
        }
    }
}