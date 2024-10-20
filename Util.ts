import {directionBiasMap} from "./Config";

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


type PosDistanceInfo = {
    pos: RoomPosition;
    distance: number;
}


/**
 * 获取指位置路径距离最近的位置
 * @param pos
 * @private
 */
export function* getClosedPathPosCode(pos: RoomPosition): IterableIterator<PosDistanceInfo> {
    let posQueue: PosDistanceInfo[] = [{
        pos: pos,
        distance: 0
    }];
    let handedMap = {};
    while (posQueue.length > 0) {
        let curInfo = posQueue.shift();
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
            posQueue.push(info);
            yield info;
        }
    }
}