import {RoomController} from "./RoomController";
import {RoomFacility} from "./RoomFacility";
import {Move} from "./move";
import {RoomName} from "./Config";


type ExpandGroupPos = {
    headPos: RoomPosition;
    direction: DirectionConstant;
}

type MoveRecord = {
    [creepName: string]: {
        activeDir?: DirectionConstant;
        passiveDir?: DirectionConstant;
    }
}

export type ExpandGroupMemory = {
    creepNameList: string[];
    state: "spawn" | "meeting" | "run" | "recycle";
    nameShape: string[][];
    moveRecord: MoveRecord;
}

export type ExpandGroupCreepMemory = {
    role: string;
    shapeX: number;
    shapeY: number;
    targetPos?: RoomPosition;
    parentName?: string;
    expandMove?: {
        toPos: RoomPosition;
        path: PathFinderPath;
        index: number;
        blockTick: number;
    }
}


type roleConfig = {
    body: BodyPartConstant[];
    memory: CreepMemory;
}

export type ExpandSpawnConfig = {
    name: string;
    spawnRoomName: RoomName;
    shape: string[][];
    runOrder: string[];
    roleConfigMap: {
        [role: string]: roleConfig;
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
            this.setCreepTargetPos(this.expandSpawnConfig.meet.pos, this.expandSpawnConfig.meet.dir);
        }
        let inPosNum = 0;
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
            if (this.memory.state == "spawn" || this.memory.state == "meeting") {
                let targetPos = creep.memory.expand[this.name].targetPos;
                targetPos = new RoomPosition(targetPos.x, targetPos.y, targetPos.roomName);
                if (creep.pos.getRangeTo(targetPos) > 0) {
                    creep.moveTo(targetPos, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                } else {
                    inPosNum++;
                }
                continue;
            }
            this.runEachCreep(creep);
        }
        if (inPosNum != 0
            && inPosNum == this.memory.creepNameList.length
            && this.memory.state == "meeting") {
            this.memory.state = "run";
        }
    }


    protected spawnCreeps() {
        if (!this.memory.state || this.memory.state == "spawn") {
            this.memory.state = "spawn";
        }
        if (this.memory.state != "spawn") {
            return;
        }
        //获取shape中各个role的数量
        let posNumMap = {};
        let spawnList = RoomFacility.roomFacilityMap[this.expandSpawnConfig.spawnRoomName].getSpawnList();
        let hasSpawn = false;
        this.expandSpawnConfig.shape.forEach((row, y) => {
            row.forEach((role, x) => {
                let posKey = `${x}_${y}`;
                if (posNumMap[posKey]) {
                    return;
                }
                let creepName = `${this.name}_${Game.time}_${posKey}`;
                let config = this.expandSpawnConfig.roleConfigMap[role];
                for (const spawn of spawnList) {
                    if (spawn.spawning) {
                        continue;
                    }
                    hasSpawn = true;
                    let res = spawn.spawnCreep(config.body, creepName, {
                        memory: {
                            module: this.name,
                            expand: {
                                [this.name]: {
                                    role: role,
                                    shapeX: x,
                                    shapeY: y
                                }
                            }
                        }
                    })
                    if (res == OK) {
                        this.memory.creepNameList.push(creepName);
                        this.memory.nameShape[x][y] = creepName;
                        break;
                    }
                }
            })
        });
        if (hasSpawn) {
            return;
        }
        let orderIdxMap = {};
        let orderList = this.expandSpawnConfig.runOrder;
        for (let i = 0; i < orderList.length; i++) {
            orderIdxMap[orderList[i]] = i;
        }
        let sortObjList = this.memory.creepNameList.map(name => {
            let creep = Game.creeps[name];
            let role = creep.memory.expand[this.name].role;
            return {
                name: name,
                idx: orderIdxMap[role]
            }
        }).sort((a, b) => {
            return a.idx - b.idx
        });
        this.memory.creepNameList = sortObjList.map(obj => obj.name).reverse();
        this.memory.state = "meeting";
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

    private PathFinderPath(fromPos:RoomPosition, toPos:RoomPosition, range:number){
        return PathFinder.search(fromPos, {
            pos: toPos,
            range: range
        },
        {
            roomCallback(roomName: string): boolean | CostMatrix {
                try {
                    let costMatrix = new PathFinder.CostMatrix();
                    let roomFacility = RoomFacility.roomFacilityMap[roomName];
                    if (roomFacility) {
                        for (let posKey in roomFacility.getCreepPos()) {
                            let pos = posKey.split("-");
                            costMatrix.set(Number(pos[0]), Number(pos[1]), 1)
                        }
                    }
                    return costMatrix;
                } catch (e) {
                    console.log(e.stack);
                }
            }
        })
    }

    protected reverseMove(creep: Creep): void {
        let toPos = creep.memory.expand[this.name].targetPos;
        let creepMoveMemory = creep.memory.expand[this.name].expandMove;
        if (creepMoveMemory) {
            //target has changed
            let targetPos = creepMoveMemory.toPos;
            if (targetPos.x != toPos.x || targetPos.y != toPos.y) {
                creep.memory.expand[this.name].expandMove = null;
                creepMoveMemory = null;
            }
        }

        if (!creepMoveMemory) {
            creepMoveMemory = creep.memory.expand[this.name].expandMove = {
                toPos: toPos,
                path: this.PathFinderPath(creep.pos, toPos, 0),
                index: -1,
                blockTick: 0
            }
            // 不可达，移动到父级位置
            if (creepMoveMemory.path.incomplete) {
                let parentName = creep.memory.expand[this.name].parentName;
                if (parentName) {
                    let parentCreep = Game.creeps[parentName];
                    if (parentCreep) {
                        let parentPos = parentCreep.pos;
                        creepMoveMemory.path = this.PathFinderPath(creep.pos, parentPos, 0);
                    }
                }
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
                    creep.memory.expand[this.name].expandMove = null;
                    return;
                }
                let nextDir = creep.pos.getDirectionTo(nextPos.x, nextPos.y);
                let roomFacility = RoomFacility.roomFacilityMap[creep.room.name];
                if (roomFacility) {
                    let posKey = `${nextPos.x}_${nextPos.y}`
                    let cName = roomFacility.getCreepPos()[posKey];
                    if (cName && Game.creeps[cName]) {
                        if (!this.memory.moveRecord[cName]) {
                            this.memory.moveRecord[cName] = {}
                        }
                        this.memory.moveRecord[cName].passiveDir = getReverseDir(nextDir);
                    }

                }
            }
            if (creep.pos.getRangeTo(nextPos.x, nextPos.y) > 1) {
                console.log("error nextStep more than 1 range </br>" + JSON.stringify(creepMoveMemory) + "</br>"
                    + JSON.stringify(nextPos) + "</<br>" + creep.name);
                creep.memory.expand[this.name].expandMove = null;
                return;
            }
            let nextDir = creep.pos.getDirectionTo(nextPos.x, nextPos.y);
            if (!this.memory.moveRecord[creep.name]) {
                this.memory.moveRecord[creep.name] = {}
            }
            this.memory.moveRecord[creep.name].activeDir = nextDir;
        } catch (e) {
            console.log(e.stack);
        }
    }

    protected moveAll(): void {
        let moveRecord = this.memory.moveRecord;
        for (let creepName in moveRecord) {
            let creep = Game.creeps[creepName];
            if (!creep) {
                continue;
            }
            let record = moveRecord[creepName];
            if (record.activeDir) {
                creep.move(record.activeDir);
            } else if (record.passiveDir) {
                creep.move(record.passiveDir);
            }
            let creepMoveMemory = creep.memory.expand[this.name].expandMove;
            if (!creepMoveMemory || !creepMoveMemory.path) {
                continue;
            }
            let path = creepMoveMemory.path.path;
            new RoomVisual(creep.room.name).poly(path.map(p => [p.x, p.y]))
        }
        this.memory.moveRecord = {};
    }

    private setCreepTargetPos(headPos: RoomPosition, headDir: DirectionConstant): void {
        let headName = this.memory.nameShape[headPos.x][headPos.y];
        let headCreep = Game.creeps[headName];
        let queue = [];
        let setPos = {};
        queue.push({
            parentName: null,
            name: headName,
            dir: null,
            pos: headCreep.pos
        });
        let idx = 0;
        while (idx < queue.length) {
            let curNode = queue[idx];
            idx++;
            let curPos = curNode.pos;
            let curDir = curNode.dir;
            let curPosKey = `${curPos.x}_${curPos.y}`;
            if (setPos[curPosKey]) {
                continue;
            }
            let curCreep = Game.creeps[curNode.name];
            let curMemory = curCreep.memory.expand[this.name];
            if (curDir == null) {
                curMemory.targetPos = curPos;
            } else {
                let targetDir = (headDir - TOP + curDir + 8) % 8 + 1;
                let targetX = curPos.x + directionBiasMap[targetDir].x;
                let targetY = curPos.y + directionBiasMap[targetDir].y;
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
                curMemory.targetPos = new RoomPosition(targetX, targetY, targetRoomName);
                curMemory.parentName = curNode.parentName;
            }
            for (let dir in directionBiasMap) {
                let shapeX = curMemory.shapeX + directionBiasMap[dir].x;
                let shapeY = curMemory.shapeY + directionBiasMap[dir].y;
                let dirCreepName = this.memory.nameShape[shapeX][shapeY];
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
    }
}