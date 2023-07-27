import {RoomController} from "./RoomController";
import {RoomFacility} from "./RoomFacility";
import {Move} from "./move";
import {RoomName} from "./Config";


type ExpandGroupPos = {
    headPos: RoomPosition;
    direction: DirectionConstant;
}


export type ExpandGroupMemory = {
    creepNameList: string[];
    state: "spawn" | "meeting" | "run" | "recycle";
    nameShape: string[][];
}

export type ExpandGroupCreepMemory = {
    role: string;
    shapeX: number;
    shapeY: number;
    targetPos?: RoomPosition;
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
        this.memory.creepNameList = sortObjList.map(obj => obj.name);
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

    protected reserveMove(creep: Creep, toPos: RoomPosition, range: number): void {

    }

    protected moveAll(): void {

    }

    private setCreepTargetPos(headPos: RoomPosition, headDir: DirectionConstant): void {
        let headName = this.memory.nameShape[headPos.x][headPos.y];
        let headCreep = Game.creeps[headName];
        let queue = [];
        let setPos = {};
        queue.push({
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
                curMemory.targetPos = new RoomPosition(targetX, targetY, curPos.roomName);
            }
            for (let dir in directionBiasMap) {
                let shapeX = curMemory.shapeX + directionBiasMap[dir].x;
                let shapeY = curMemory.shapeY + directionBiasMap[dir].y;
                let dirCreepName = this.memory.nameShape[shapeX][shapeY];
                if (!dirCreepName) {
                    continue;
                }
                queue.push({
                    name: dirCreepName,
                    dir: Number(dir),
                    pos: curMemory.targetPos
                })
            }
        }
    }

    protected groupMoveTo(pos: RoomPosition, range: number): void {
        let headPos = this.expandSpawnConfig.headPos;
        let headCreepName = this.memory.nameShape[headPos.x][headPos.y];
        let headCreep = Game.creeps[headCreepName];
        let pathCache = {
            paths: PathFinder.search(headCreep.pos, {
                    pos: pos,
                    range: range
                },
                // {
                //     roomCallback(roomName: string): boolean | CostMatrix {
                //         try {
                //             let costMatrix = new PathFinder.CostMatrix();
                //             for (let posKey in roadPos) {
                //                 let pos = posKey.split("-")
                //                 costMatrix.set(Number(pos[0]), Number(pos[1]), 1)
                //             }
                //             for (let posKey in creepPos) {
                //                 if (roadPos[posKey]) {
                //                     continue;
                //                 }
                //                 let cName = creepPos[posKey];
                //                 let c = Game.creeps[cName];
                //                 if (!c || c.memory.module == "carry") {
                //                     continue
                //                 }
                //                 console.log("move conflict" + cName + " " + posKey)
                //                 let pos = posKey.split("-")
                //                 costMatrix.set(Number(pos[0]), Number(pos[1]), 255)
                //             }
                //         } catch (e) {
                //             console.log(e.stack);
                //         }
                //     }
                // }
                ),
            createTime: Game.time,
            refreshTime: 0
        }

    }
}