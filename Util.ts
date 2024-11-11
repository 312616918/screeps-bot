import {directionBiasMap} from "./Config";
import exp = require("node:constants");

export function checkPos(pos: RoomPosition, allowEdge = false): boolean {
    if (allowEdge) {
        return pos.x >= 0 && pos.x <= 49 && pos.y >= 0 && pos.y <= 49;
    }
    return pos.x > 0 && pos.x < 49 && pos.y > 0 && pos.y < 49
}

export function isSamePos(pos1: RoomPosition, pos2: RoomPosition): boolean {
    if (pos1 == null && pos2 == null) {
        return true;
    }
    if (pos1 == null || pos2 == null) {
        return false;
    }
    if (pos1.roomName != pos2.roomName) {
        return false;
    }
    if (pos1.x != pos2.x || pos1.y != pos2.y) {
        return false;
    }
    return true;
}

export function isInRoomEdge(pos: RoomPosition, roomName:string = null): boolean {
    let isEdge = pos.x == 0 || pos.x == 49 || pos.y == 0 || pos.y == 49;
    if(!roomName||!pos.roomName){
        return isEdge;
    }
    return isEdge && pos.roomName == roomName
}


type PosDistanceInfo = {
    pos: RoomPosition;
    distance: number;
}


/**
 * 获取指位置路径距离最近的位置
 * @param pos
 * @param maxDistance
 * @private
 */
export function* getClosedPathPosCode(pos: RoomPosition, maxDistance: number): IterableIterator<PosDistanceInfo> {
    let posQueue: PosDistanceInfo[] = [{
        pos: pos,
        distance: 0
    }];
    let handedMap = {};
    while (posQueue.length > 0) {
        let curInfo = posQueue.shift();
        yield curInfo;
        // 周围8个位置
        for (let dir in directionBiasMap) {
            let bias = directionBiasMap[dir];
            let newPos = new RoomPosition(
                curInfo.pos.x + bias.x,
                curInfo.pos.y + bias.y,
                curInfo.pos.roomName);
            let posCode = `${newPos.x}_${newPos.y}`;
            if (handedMap[posCode]) {
                continue;
            }
            handedMap[posCode] = true;
            if (!checkPos(newPos)) {
                continue;
            }
            let info = {
                pos: newPos,
                distance: curInfo.distance + 1
            }
            if (info.distance > maxDistance) {
                continue;
            }
            posQueue.push(info);
        }
    }
}
export function logInfo(...msg:string[]){
    // 默认
    console.log(`<span style="color: #00ff00;">[INFO]</span>${msg.join(" ")}`)
}

export function logError(...msg:string[]){
    // 红色
    console.log(`<span style="color: #ff0000;">[ERROR]</span>${msg.join(" ")}`)
}

let roomRe = /([EW])(\d+)([NS])(\d+)/
function getAbsPos(roomName: string): {
    x: number,
    y: number
}  {
    let m = roomRe.exec(roomName);
    if (!m) {
        throw new Error(`invalid room name: ${roomName}`);
    }
    let dirX = m[1];
    let x = parseInt(m[2]);
    let dirY = m[3];
    let y = parseInt(m[4]);
    if (dirX == "W") {
        x = -x - 1;
    }
    if (dirY == "N") {
        y = -y - 1;
    }
    return {
        x: x,
        y: y
    }
}
export function getRoomDistance(roomName1: string, roomName2: string): number {
    let absPos1 = getAbsPos(roomName1);
    let absPos2 = getAbsPos(roomName2);
    return Math.max(Math.abs(absPos1.x - absPos2.x), Math.abs(absPos1.y - absPos2.y));
}

export function getWorkPosList(roomPos:RoomPosition):RoomPosition[]{
    let room = Game.rooms[roomPos.roomName];
    if(!room){
        logError(`room ${roomPos.roomName} not found`);
        return [];
    }
    let terrain = room.getTerrain();
    let iter = getClosedPathPosCode(roomPos, 1);
    let res:RoomPosition[] = [];
    while(true){
        let info = iter.next();
        if(info.done) {
            break;
        }
        if(info.value.distance < 1){
            continue;
        }
        // 获取地形
        if(terrain.get(info.value.pos.x, info.value.pos.y) == TERRAIN_MASK_WALL) {
            continue;
        }
        res.push(info.value.pos);
    }
    return res;
}

export function getFarthestCornerPos(pos:RoomPosition):RoomPosition{
    let x = pos.x < 25? 49 : 0;
    let y = pos.y < 25? 49 : 0;
    return new RoomPosition(x, y, pos.roomName);
}

function tmpSale(){
    // Game.market.createOrder({
    //     type: ORDER_SELL,
    //     resourceType: RESOURCE_ZYNTHIUM_BAR,
    //     price: 180,
    //     totalAmount: 20000,
    //     roomName: "E11N11"
    // })
    //
    // Game.market.extendOrder("67191d10ac3ee50012106ec6", 60000)
}

function tmpProfile(){
    // Game.profiler.background();
    // // Game.profiler.output([lineCount]);
    // Game.profiler.output();
    // Game.profiler.reset();
}