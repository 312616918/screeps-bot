//@ts-check


const spawn = require("../spawn");


var carry = {

    spawnCreeps: function () {

        // /**
        //  * @type SimpleCreepPlan
        //  */
        // var config={
        //     "W3N15":{
        //         body:[CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
        //         amount:6
        //     },
        //     "W2N16"
        // }

        var creepPlan = [{
            namePrefix: "Carrier-A-",
            spawnName: "Spawn1",
            amount: 8,
            body: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
            memory: {
                workRoom: "W3N15"
            }
        }, {
            namePrefix: "Carrier-B-",
            spawnName: "Spawn3",
            amount: 3,
            body: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
            memory: {
                workRoom: "W2N16"
            }
        }, {
            namePrefix: "Carrier-W2N18-",
            spawnName: "Spawn4",
            amount: 3,
            body: [CARRY, CARRY,CARRY, CARRY,  MOVE, MOVE],
            memory: {
                workRoom: "W2N18"
            }
        }, {
            namePrefix: "Carrier-W3N19-",
            spawnName: "Spawn6",
            amount: 4,
            body: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
            memory: {
                workRoom: "W3N19"
            }
        }, {
            namePrefix: "Carrier-W7N16-",
            spawnName: "Spawn7",
            amount: 2,
            body: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
            memory: {
                workRoom: "W7N16"
            }
        }, {
            namePrefix: "Carrier-W2N15-",
            spawnName: "Spawn8",
            amount: 4,
            body: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
            memory: {
                workRoom: "W2N15"
            }
        }];

        for (let i in creepPlan) {
            let plan = creepPlan[i];
            for (let i = 0; i < plan.amount; i++) {
                let name = plan.namePrefix + i;
                if (Game.creeps[name]) {
                    continue;
                }
                let template = {
                    name: name,
                    body: plan.body,
                    memory: plan.memory,
                    priority: 0,
                    spawnNames: [plan.spawnName]
                }

                spawn.reserveCreep(template);
                break;
            }

        }

    },

    cleanReq: function () {

    },

    /**
     * 
     * @param {Structure|Creep|Ruin|Resource|Tombstone} obj 
     * @param {reqType} type 
     * @param {ResourceConstant} resourceType 
     * @param {number} amount 
     */
    addReq: function (obj, type, resourceType, amount) {

        if (!obj || !type || !resourceType || amount <= 0) {
            return;
        }

        var carryReqs = Memory.carryReqs;
        if (carryReqs[obj.pos.roomName] == undefined) {
            carryReqs[obj.pos.roomName] = {};
        }
        let roomReqs = carryReqs[obj.pos.roomName];
        let key = obj.id + "#" + type + "#" + resourceType;
        if (roomReqs[key] == undefined) {
            roomReqs[key] = {
                id: obj.id,
                type: type,
                resourceType: resourceType,
                amount: 0,
                reserve: 0
            }
        }
        if (amount < 0) {
            amount = 0;
        }
        roomReqs[key].amount = amount;

    },
    /**
     * 
     * @param {Creep} creep 
     * @param {string} reqId 
     * @param {number} capacity 
     */
    takeReq: function (creep, reqId, capacity) {
        let roomReqs = Memory.carryReqs[creep.pos.roomName];
        let req = roomReqs[reqId];
        creep.memory.reqId = reqId;
        creep.memory.reserve = capacity;
        creep.memory.resourceType = req.resourceType;
        req.reserve += creep.memory.reserve;
        creep.say(req.type + " !");
        // console.log(creep.name+"  " +reqId)

    },
    /**
     * 
     * @param {string} creepName 
     */
    finishReq: function (creepName) {
        let creepMenory = Memory.creeps[creepName];
        let roomReq = Memory.carryReqs[creepMenory.workRoom];
        let req = roomReq[creepMenory.reqId];
        req.reserve -= creepMenory.reserve;
        req.amount -= creepMenory.reserve;

        if (req.amount <= 0) {
            delete roomReq[creepMenory.reqId];
        }
        creepMenory.reqId = null;
    },

    /**
     * 
     * @param {string} creepName 
     */
    cancelReq: function (creepName) {
        let creepMenory = Memory.creeps[creepName];
        let req = Memory.carryReqs[creepMenory.workRoom][creepMenory.reqId];
        req.reserve -= creepMenory.reserve;
        creepMenory.reqId = null;
    },

    initReq: function () {
        if (Memory.carryReqs == undefined) {
            Memory.carryReqs = {};
        }
        var carryReqs = Memory.carryReqs;
        //req容错校准
        for (let id in carryReqs) {
            let roomReqs = carryReqs[id];
            for (let key in roomReqs) {
                let req = roomReqs[key];
                if (req.amount == null) {
                    req.amount = 0;
                }
                if (req.amount < 0) {
                    req.amount = 0;
                }
                if (req.reserve < 0 || req.reserve > 4000) {
                    req.reserve = 0;
                }
                if (!Game.getObjectById(req.id)) {
                    delete roomReqs[key];
                }
            }

        }

        let fac = Memory.facility;

        for (let roomName in fac) {
            let roomFac = fac[roomName];
            for (let id in roomFac.sources) {
                let con = Game.getObjectById(roomFac.sources[id].containerId);
                if (!con) {
                    continue;
                }
                this.addReq(con, "output", RESOURCE_ENERGY, con["store"].getUsedCapacity() - 200);
            }

            if (roomFac.mineral) {
                let mineralCon = Game.getObjectById(roomFac.mineral.containerId);
                if (mineralCon) {
                    this.addReq(mineralCon,
                        "output",
                        roomFac.mineral.resourceType,
                        mineralCon["store"].getUsedCapacity(roomFac.mineral.resourceType) - 200);
                }
            }

        }


        let ruins = Game.rooms["W3N19"].find(FIND_RUINS);

        for (let id in ruins) {
            let r = ruins[id];
            if (r.store && r.store.getUsedCapacity(RESOURCE_ENERGY)) {
                this.addReq(r, "output", RESOURCE_ENERGY, r.store.getUsedCapacity(RESOURCE_ENERGY));
            }
        }

        let ownRoomNames = ["W3N19", "W2N16", "W7N16","W2N15"];
        for (let roomName in fac) {
            let room = Game.rooms[roomName];
            let drop = room.find(FIND_DROPPED_RESOURCES);
            for (let i in drop) {
                let d = drop[i];
                this.addReq(d, "pickup", d.resourceType, d.amount);
            }

            let tomb = room.find(FIND_TOMBSTONES)

            for (let i in tomb) {
                let t = tomb[i];
                for (let type in t.store) {
                    // @ts-ignore
                    this.addReq(t, "output", type, t.store.getUsedCapacity(type))
                }
            }
        }

        for (let name in Game.structures) {
            var structure = Game.structures[name];
            // if (structure.pos.roomName == "W2N15") {
            //     continue;
            // }

            if (!structure["store"] || !structure["store"].getFreeCapacity(RESOURCE_ENERGY)) {
                continue;
            }

            let freeCapacity = structure["store"].getFreeCapacity(RESOURCE_ENERGY);


            if (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_NUKER) {
                this.addReq(structure, "input", RESOURCE_ENERGY, freeCapacity);
                continue;
            }

            if (structure.structureType == STRUCTURE_TOWER) {
                // console.log(structure.store.getFreeCapacity(RESOURCE_ENERGY))
                this.addReq(structure, "input", RESOURCE_ENERGY, freeCapacity - 200);
                continue;
            }
            // console.log(structure.name)

            if (structure.structureType == STRUCTURE_SPAWN && structure["name"] != "Spawn2") {
                this.addReq(structure, "input", RESOURCE_ENERGY, freeCapacity);
                continue;
            }
        }

        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.memory.needEnergy && creep.store.getFreeCapacity(RESOURCE_ENERGY)) {

                this.addReq(creep, "input", RESOURCE_ENERGY, creep.memory.needEnergy);

                continue;
            }
        }

    },

    /**
     * 
     * @param {Creep} creep 
     */
    run: function (creep) {

        if (creep.memory.resourceType == undefined) {
            creep.memory.resourceType = null;
        }

        if (creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
            creep.memory.resourceType = RESOURCE_ENERGY
        }

        var roomReqs = Memory.carryReqs[creep.memory.workRoom];
        let fac = Memory.facility;

        if (creep.pos.roomName != creep.memory.workRoom) {
            creep.moveTo(Game.rooms[creep.memory.workRoom].controller);
            return;
        }

        /**
         * @type StructureStorage
         */
        let storage = Game.getObjectById(fac[creep.memory.workRoom].storageId);

        //分配任务
        if (!creep.memory.reqId) {
            let dis = 1024;
            let tarid = null;
            let tarReq = null;
            for (let id in roomReqs) {
                let req = roomReqs[id];

                //跳过即将完成
                if (req.amount <= req.reserve) {
                    continue;
                }

                //跳过类型不合
                if (creep.store.getUsedCapacity() && req.resourceType != creep.memory.resourceType) {
                    continue;
                }

                if (req.type == "pickup" && req.resourceType == RESOURCE_ENERGY && req.amount < creep.store.getFreeCapacity()) {
                    continue;
                }

                if (req.type == "pickup" || req.type == "output") {

                    // if(creep.store.getFreeCapacity()==0||creep.pos.getRangeTo(Game.getObjectById(req.id))>1){
                    //     continue;
                    // }

                    if (creep.store.getUsedCapacity()) {
                        continue;
                    }

                    //跳过无法完成的输出
                    if (storage&&storage.store.getFreeCapacity() == 0) {
                        continue;
                    }
                }

                //输入
                if (req.type == "input") {

                    //捡取和输出优先
                    if (tarReq && tarReq.type != "input") {
                        continue;
                    }

                    //跳过无法完成的输入
                    if (storage? storage.store.getUsedCapacity(req.resourceType) == 0:creep.store.getUsedCapacity(req.resourceType)==0) {
                        continue;
                    }
                }

                //避免饥饿
                if (tarReq && tarReq.reserve == 0 && req.reserve) {
                    continue;
                }




                //距离最近优先
                let d = creep.pos.getRangeTo(Game.getObjectById(req.id));
                if (dis > d) {
                    dis = d;
                    tarid = id;
                    tarReq = req;
                }
            }
            if (tarid) {
                let tarAmount = creep.store.getCapacity();
                if (tarReq.type == "input" && creep.store.getUsedCapacity()) {
                    tarAmount = creep.store.getUsedCapacity();
                }
                this.takeReq(creep, tarid, tarAmount);
            }
        }

        //没有分配到任务，去存储资源
        if (!creep.memory.reqId) {
            if (creep.store.getUsedCapacity()) {
                if (creep.transfer(storage, creep.memory.resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            }
            return;
        }

        //执行任务
        var req = roomReqs[creep.memory.reqId];
        if (!req) {
            creep.memory.reqId = null;
            return;
        }

        var target = Game.getObjectById(req.id);

        creep.room.visual.line(creep.pos, target.pos, {
            color: 'red',
            lineStyle: 'dashed'
        });


        if (req.type == "input") {

            //有资源
            if (creep.store.getUsedCapacity()) {
                //去输入
                if (creep.transfer(target, creep.memory.resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                    return;
                }
                this.finishReq(creep.name);
                return;
            }

            //没有资源，去取资源

            if (storage.store.getUsedCapacity(creep.memory.resourceType) == 0) {
                this.cancelReq(creep.name);
                return;
            }

            if (creep.withdraw(storage, creep.memory.resourceType) == ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
                return;
            }
            //取到资源，暂不做标记

            return;
        }


        if (req.type == "output") {
            //还没取到资源
            if (creep.store.getUsedCapacity() == 0) {
                //去取资源
                if (creep.withdraw(target, creep.memory.resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                    return;
                }

                //完成取资源
                this.finishReq(creep.name);
                return;

            }
            //取到了资源，等待配送任务（容错，正常不会执行）
            creep.memory.reqId = null;
            return;
        }

        if (req.type == "pickup") {

            //还没取到资源
            if (creep.store.getUsedCapacity() == 0) {
                //去取资源
                if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                    return;
                }
                //完成取资源
                this.finishReq(creep.name);
                return;

            }
            //取到了资源，等待配送任务（容错，正常不会执行）
            creep.memory.reqId = null;
            return;
        }

        return;

        //以下为废弃代码


        //有任务
        if (creep.memory.reqId != null && creep.memory.reqId != undefined && roomReqs[creep.memory.reqId]) {
            // console.log("123")
            var req = roomReqs[creep.memory.reqId];
            var target = Game.getObjectById(req.id);

            // console.log(creep.memory.reqId);
            if (req.type == "input") {

                //有资源
                if (creep.store.getUsedCapacity()) {
                    //去输入
                    if (creep.transfer(target, creep.memory.resourceType) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {
                            visualizePathStyle: {
                                stroke: '#ffffff'
                            }
                        });
                        return;
                    }

                    //完成运输
                    this.finishReq(creep.name);
                    // req.reserve -= creep.memory.reserve;
                    // req.amount -= creep.memory.reserve;
                    // creep.memory.reqId = null;
                    return;
                }

                //没有资源，去取资源
                if (creep.withdraw(storage, creep.memory.resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                    return;
                } else {
                    this.cancelReq(creep.name);
                    let tarReqid = null;
                    let tarDis = 999999;
                    for (let id in roomReqs) {
                        let req = roomReqs[id];
                        if (req.type != "input" || req.amount <= req.reserve || req.resourceType != creep.memory.resourceType) {
                            continue;
                        }

                        let dis = creep.pos.getRangeTo(Game.getObjectById(req.id));
                        // console.log(dis)
                        if (dis == Infinity) {
                            dis = 50;
                        }
                        if (tarDis > dis) {
                            tarReqid = id;
                            tarDis = dis;
                        }
                    }



                    //接单，去input
                    if (tarReqid) {

                        this.takeReq(creep, tarReqid, creep.store.getCapacity());

                        // creep.memory.reqId = tarReqid;
                        // creep.memory.reserve = creep.store.getUsedCapacity();
                        // roomReqs[creep.memory.reqId].reserve += creep.memory.reserve;
                        return;
                    }
                }
                //取到资源，暂不做标记

                return;
            }

            if (req.type == "output") {

                // console.log("123")

                //还没取到资源
                if (creep.store.getUsedCapacity() == 0) {

                    // console.log(target)
                    // creep.memory.resourceType=RESOURCE_ENERGY
                    //去取资源
                    if (creep.withdraw(target, creep.memory.resourceType) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {
                            visualizePathStyle: {
                                stroke: '#ffaa00'
                            }
                        });
                        return;
                    }

                    //完成取资源
                    this.finishReq(creep.name);
                    // req.reserve -= creep.memory.reserve;
                    // req.amount -= creep.memory.reserve;
                    // creep.memory.reqId = null;
                    return;

                }
                //取到了资源，等待配送任务（容错，正常不会执行）
                creep.memory.reqId = null;
            }

            if (req.type == "pickup") {

                //还没取到资源
                if (creep.store.getUsedCapacity() == 0) {

                    //去取资源
                    if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {
                            visualizePathStyle: {
                                stroke: '#ffaa00'
                            }
                        });
                        return;
                    }

                    //完成取资源
                    this.finishReq(creep.name);
                    return;

                }
                //取到了资源，等待配送任务（容错，正常不会执行）
                creep.memory.reqId = null;

                return;
            }

        }

        //没有任务：1.原本没有；2.完成input，有剩余；3.完成output

        //有剩余，情况2，3；
        // creep.drop();
        if (creep.store.getUsedCapacity()) {
            let tarReqid = null;
            let tarDis = 999999;
            for (let id in roomReqs) {
                let req = roomReqs[id];
                if (req.type != "input" || req.amount <= req.reserve || req.resourceType != creep.memory.resourceType) {
                    continue;
                }

                let dis = creep.pos.getRangeTo(Game.getObjectById(req.id));
                // console.log(dis)
                if (dis == Infinity) {
                    dis = 50;
                }
                if (tarDis > dis) {
                    tarReqid = id;
                    tarDis = dis;
                }
            }


            //
            //接单，去input
            if (tarReqid) {

                this.takeReq(creep, tarReqid, creep.store.getCapacity());

                // creep.memory.reqId = tarReqid;
                // creep.memory.reserve = creep.store.getUsedCapacity();
                // roomReqs[creep.memory.reqId].reserve += creep.memory.reserve;
                return;
            }

            //没有接到input，去存入storage
            if (creep.transfer(storage, creep.memory.resourceType) == ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
            }
            return;
        }

        //情况1，空闲，主动接单
        for (let id in roomReqs) {
            let req = roomReqs[id];
            if (req.type == "input" && (!storage || storage.store.getUsedCapacity(req.resourceType) == 0)) {
                continue;
            }
            if (req.amount > req.reserve) {
                // console.log(req)

                this.takeReq(creep, id, creep.store.getCapacity());

                // creep.memory.reqId = id;
                // creep.memory.resourceType = req.resourceType;
                // creep.memory.reserve = creep.store.getCapacity();
                // let s = roomReqs[creep.memory.reqId].reserve;

                // req.reserve += creep.memory.reserve;
                return;
            }
        }

    }
}

module.exports = carry;