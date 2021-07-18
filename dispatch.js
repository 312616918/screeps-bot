//@ts-check

var spawn = require("./spawn")
var carry = require("./carry")
var tran=require("./transaction")

/**
 * dispatch 优先级:
 * 数值越小,优先级越高
 * 
 * link-input:3
 * link-output:2
 * terminal-input:5
 */

/**
 * @type RoomResAmount
 */
let resAmount = {
    "W3N15": {
        terminal: {
            "energy": {

                tMaxAmount: 200000,
                tMinAmount: 100000,

                sMinAmount: 400000
            },
            "X": {

                tMaxAmount: 100000,
                tMinAmount: 40000,

                sMinAmount: 100000
            },
            "H": {
                tMaxAmount: 20000,
                tMinAmount: 10000
            },
            "O": {
                tMaxAmount: 20000,
                tMinAmount: 10000
            },


            "XKH2O": {

                tMaxAmount: 4000,
                tMinAmount: 2000,

                sMinAmount: 2000
            },
            "XKHO2": {

                tMaxAmount: 4000,
                tMinAmount: 2000,

                sMinAmount: 2000
            }
        },
        minAmount: {
            "KH": 20000,
            "KO": 20000,
            "OH": 20000
        }

    },
    "W2N16": {
        terminal: {
            "energy": {
                tMaxAmount: 100000,
                tMinAmount: 20000,

                sMinAmount: 500000
            },
            "K": {
                tMaxAmount: 20000,
                tMinAmount: 10000
            },
            "KH": {
                tMaxAmount: 20000,
                tMinAmount: 10000
            },
            "KO": {
                tMaxAmount: 20000,
                tMinAmount: 10000
            }
        },
        minAmount: {
            "O": 20000,
            "H": 20000
        }

    },
    "W2N18": {
        terminal: {
            "energy": {
                tMaxAmount: 100000,
                tMinAmount: 20000,

                sMinAmount: 500000
            },
            "H": {
                tMaxAmount: 20000,
                tMinAmount: 10000
            },
            "OH": {
                tMaxAmount: 20000,
                tMinAmount: 10000
            }
        },
        minAmount: {
            "O": 20000
        }

    },
    "W3N19": {
        terminal: {
            "energy": {
                tMaxAmount: 100000,
                tMinAmount: 20000,

                sMinAmount: 500000
            },
            "O": {
                tMaxAmount: 20000,
                tMinAmount: 10000
            },
            "OH": {
                tMaxAmount: 20000,
                tMinAmount: 10000
            }
        },
        minAmount: {
            "H": 20000
        }

    },
    "W7N16": {
        terminal: {
            "energy": {

                tMaxAmount: 100000,
                tMinAmount: 50000,

                sMinAmount: 500000
            }
        },
        minAmount: {
            "O": 20000
        }
    }
}

/**
 * @type SupplyConfig
 */
let supplyConfig = {
    "W3N15": {
        supply: {
            "X": 250000,
            "energy": 20000,
            "XKH2O": 40000,
            "XKHO2": 20000

        },
        demand: {
            "KH2O": 20000,
            "UHO2": 20000,
            "OH":20000,
            "K":20000,
            "H":10000

        }
    },
    "W2N15": {
        supply: {
            "energy": 200000,
            // "O":20000,
            "XUHO2": 20000,
            "OH":20000,

            "XKH2O":20000
            
        },
        demand: {
            "X": 20000,
            "U": 20000,
            "O":20000,
            "K":20000,

            "H": 20000
        }
    },
    "W2N16": {
        supply: {
            "energy": 20000,
            "XKH2O": 20000,
            "XKHO2": 20000,
            // "KH2O": 11000,
            "K":100000,

            "O": 20000 //临时
        },
        demand: {
            "X": 20000,
            "OH": 20000,
            "H": 20000,
            "KH2O": 11000,
            "energy":300000,

            "KH": 20000
        }
    },
    "W2N18": {
        supply: {
            "energy": 200000,
            "OH": 20000,

            "XKH2O":20000
        },
        demand: {
            "O": 20000,
            "H": 20000,

            "K":20000,
            "X":20000
        }
    },
    "W3N19": {
        supply: {
            "energy": 200000,
            "O": 20000,
            "OH": 20000,

            "XUHO2": 20000,
            "XKH2O":20000
        },
        demand: {
            "U": 20000,
            "X": 20000,
            "K":20000,

            "O":20000,
            "H":20000
        }
    },
    "W7N16": {
        supply: {
            "U": 20000,
            "energy": 200000,
            "XUHO2": 20000
        },
        demand: {
            "energy":300000,

            "X": 20000,
            "OH":20000
        }
    }
}


var dispatch = {

    spawnCreeps: function () {

        let fac = Memory.facility;

        let plan = {
            W3N15: {
                body: [
                    CARRY, CARRY, CARRY, CARRY,
                    MOVE
                ]
            },
            W2N15: {
                body: [
                    CARRY, CARRY, CARRY, CARRY,
                    MOVE
                ]
            },
            W2N16: {
                body: [
                    CARRY, CARRY, CARRY, CARRY,
                    MOVE
                ]
            },
            W2N18: {
                body: [
                    CARRY, CARRY, CARRY, CARRY,
                    MOVE
                ]
            },
            W3N19: {
                body: [
                    CARRY, CARRY, CARRY, CARRY,
                    MOVE
                ]
            },
            W7N16: {
                body: [
                    CARRY, CARRY, CARRY, CARRY,
                    MOVE
                ]
            }
        }

        for (let roomName in plan) {
            let p = plan[roomName];

            /**
             * @type SpawnTemplate
             */
            let template = {
                name: "Dispatcher-" + roomName,
                body: p.body,
                memory: {
                    workRoom: roomName
                },
                spawnNames: fac[roomName].spawnNames,
                priority: 2
            }
            spawn.reserveCreep(template);
        }


    },

    /**
     * @private
     * @param {Structure} structure 
     * @param {reqType} type 
     * @param {ResourceConstant} resourceType 
     * @param {number} amount 
     * @param {number} priority
     */
    addReq: function (structure, type, resourceType, amount, priority) {
        let roomReqs = Memory.dispatchReqs[structure.pos.roomName];
        let key = structure.id + type + resourceType;
        roomReqs[key] = {
            id: structure.id,
            type: type,
            resourceType: resourceType,
            amount: amount,
            priority: priority
        }
    },

    initReqs: function () {

        let fac = Memory.facility;

        if (Memory.dispatchReqs == undefined) {
            Memory.dispatchReqs = {};
        }

        let reqs = Memory.dispatchReqs;
        for (let roomName in fac) {
            let roomFac = fac[roomName];

            if (reqs[roomName] == undefined) {
                reqs[roomName] = {}
            }

            let roomReqs = reqs[roomName];
            /**
             * @type StructureStorage
             */
            let storage = Game.getObjectById(roomFac.storageId);
            /**
             * @type StructureTerminal
             */
            let terminal = Game.getObjectById(roomFac.terminalId);
            /**
             * @type StructureLink
             */
            let centerLink = Game.getObjectById(roomFac.centerLinkId);

            /**
             * @type StructureContainer
             */
            let upgradeCont = null;
            /**
             * @type StructureLink
             */
            let upgradeLink = null;

            if (roomFac.upgrade) {
                upgradeCont = Game.getObjectById(roomFac.upgrade.containerId);
                upgradeLink = Game.getObjectById(roomFac.upgrade.linkId);
            }

            if (centerLink) {
                if (upgradeLink && upgradeLink.store.getUsedCapacity(RESOURCE_ENERGY) <= 400) {
                    // let outputkey = centerLink.id + "output" + RESOURCE_ENERGY;
                    // if (roomReqs[outputkey]) {
                    //     roomReqs[outputkey].amount = 0;
                    // }


                    let key = centerLink.id + "input" + RESOURCE_ENERGY;
                    roomReqs[key] = {
                        id: centerLink.id,
                        type: "input",
                        resourceType: RESOURCE_ENERGY,
                        amount: centerLink.store.getFreeCapacity(RESOURCE_ENERGY),
                        priority: 2
                    }
                } else {
                    // let inputkey = centerLink.id + "input" + RESOURCE_ENERGY;
                    // if (roomReqs[inputkey]) {
                    //     roomReqs[inputkey].amount = 0;
                    // }

                    if (centerLink) {
                        let key = centerLink.id + "output" + RESOURCE_ENERGY;
                        roomReqs[key] = {
                            id: centerLink.id,
                            type: "output",
                            resourceType: RESOURCE_ENERGY,
                            amount: centerLink.store.getUsedCapacity(RESOURCE_ENERGY),
                            priority: 3
                        }
                    }
                }
            }


            /**
             * @type RoomName
             * 
             */
            //@ts-ignore
            let rName = roomName;

            let config = supplyConfig[rName];
            if (terminal && config) {
                /**
                 * 搬运逻辑
                 * 1. 供应：确保本房间富余2k，搬运多余资源直到上限（防止循环供应取出）
                 * 2. 取出：storage中资源不足，才考虑搬运
                 */


                // console.log(roomName);

                /**
                 * @type ResourceConstant
                 */
                let type = null;
                //供应
                //@ts-ignore
                for (type in config.supply) {
                    // console.log(roomName+"  "+type);

                    if (type == "energy" && storage.store.getUsedCapacity(type) < 300000) {
                        continue;
                    }

                    //在满足自身需要的前提下
                    if (terminal.store.getUsedCapacity(type) < config.supply[type] &&
                        (!config.demand[type] || storage.store.getUsedCapacity(type) > config.demand[type] + 2000)) {
                        // console.log(roomName+"  "+type);
                        this.addReq(terminal, "input", type, 200, 5);
                    }
                }
                //取出
                //@ts-ignore
                for (type in config.demand) {
                    if (terminal.store.getUsedCapacity(type) && storage.store.getUsedCapacity(type) < config.demand[type]) {
                        this.addReq(terminal, "output", type, 200, 5);
                    }
                }
                continue;
            }



            if (terminal && resAmount[rName]) {

                let rAmount = resAmount[rName].terminal;




                /**
                 * @type ResourceConstant
                 */
                let rType = null;

                // @ts-ignore
                for (rType in terminal.store) {
                    let rNode = rAmount[rType];
                    if (rNode == undefined) {
                        this.addReq(terminal, "output", rType, terminal.store.getUsedCapacity(rType), 2);
                    }
                }



                for (rType in rAmount) {
                    let rNode = rAmount[rType];
                    let tAmount = terminal.store.getUsedCapacity(rType);
                    let sAmount = storage.store.getUsedCapacity(rType);
                    if (tAmount > rNode.tMaxAmount) {
                        this.addReq(terminal, "output", rType, tAmount - rNode.tMaxAmount, 5);
                    }
                    if (tAmount < rNode.tMinAmount && (!rNode.sMinAmount || sAmount > rNode.sMinAmount)) {
                        this.addReq(terminal, "input", rType, rNode.tMinAmount - tAmount, 2)
                    }

                }


            }

        }


    },

    roomDispatch: function () {
        let fac = Memory.facility;

        /**
         * @type RoomName
         */
        let roomName = null;

        for (roomName in supplyConfig) {
            let roomFac = fac[roomName];
            let demand = supplyConfig[roomName].demand;
            /**
             * @type StructureStorage
             */
            let storage = Game.getObjectById(roomFac.storageId);
            /**
             * @type StructureTerminal
             */
            let terminal = Game.getObjectById(roomFac.terminalId);
            /**
             * @type ResourceConstant
             */
            let type = null;
            //@ts-ignore
            for (type in demand) {
                if (storage.store.getUsedCapacity(type) + terminal.store.getUsedCapacity(type) > demand[type]) {
                    continue;
                }

                console.log(roomName + " need " + type);

                /**
                 * @type RoomName 
                 */
                let rName = null;
                for (rName in supplyConfig) {
                    if (rName == roomName) {
                        continue;
                    }
                    if (!supplyConfig[rName].supply[type]) {
                        continue;
                    }
                    /**
                     * @type StructureTerminal
                     */
                    let rt = Game.getObjectById(fac[rName].terminalId);
                    if (rt.store.getUsedCapacity(type)) {
                        // Game.getObjectById("5f8d3250f7e995656938a170").send("OH",1000,"W2N16");
                        console.log(rName + "===>" + roomName + "  " + type + " " + rt.send(type, Math.min(1000, rt.store.getUsedCapacity(type)), roomName));
                        // return;
                        break;
                    }

                }
            }
        }


        return;

        // @ts-ignore
        for (roomName in fac) {

            if (!resAmount[roomName]) {
                continue;
            }

            let minNode = resAmount[roomName].minAmount;

            if (!minNode) {
                continue;
            }

            let roomFac = fac[roomName];
            /**
             * @type StructureStorage
             */
            let storage = Game.getObjectById(roomFac.storageId);
            /**
             * @type StructureTerminal
             */
            let terminal = Game.getObjectById(roomFac.terminalId);

            /**
             * @type ResourceConstant
             */
            let rType = null;
            for (rType in minNode) {
                let needAmount = minNode[rType] - storage.store.getUsedCapacity(rType) - terminal.store.getUsedCapacity(rType);
                if (needAmount <= 0) {
                    continue;
                }

                /**
                 * @type RoomName
                 */
                let rName = null;
                // @ts-ignore
                for (rName in fac) {
                    if (rName == roomName) {
                        continue;
                    }

                    if (resAmount[rName] && resAmount[rName].minAmount && resAmount[rName].minAmount[rType]) {
                        continue;
                    }

                    /**
                     * @type StructureTerminal
                     */
                    let t = Game.getObjectById(fac[rName].terminalId);
                    if (t && t.store.getUsedCapacity(rType)) {
                        console.log(rName + "===>" + roomName)
                        console.log(t.send(rType, Math.min(t.store.getUsedCapacity(rType), 10000), roomName));
                        break;
                    }
                }
            }


        }



        // let mainRoomName = "W3N15";
        // /**
        //  * @type StructureStorage
        //  */
        // let mainStorage = Game.getObjectById(fac[mainRoomName].storageId);
        // /**
        //  * @type StructureTerminal
        //  */
        // let mainTerminal = Game.getObjectById(fac[mainRoomName].terminalId);
        // for (let roomName in fac) {
        //     let roomFac = fac[roomName];
        //     /**
        //      * @type StructureTerminal
        //      */
        //     let terminal = Game.getObjectById(roomFac.terminalId);
        //     if (roomName == mainRoomName || !roomFac.mineral || !terminal) {
        //         continue;
        //     }



        //     let mineralType = roomFac.mineral.resourceType;

        //     let mianAmount = mainStorage.store.getUsedCapacity(mineralType) + mainTerminal.store.getUsedCapacity(mineralType);

        //     console.log(mineralType + "  " + mianAmount);
        //     if (mianAmount < 20000) {
        //         console.log(terminal.send(mineralType, 10000, mainRoomName))
        //         console.log(terminal.store.getUsedCapacity(mineralType))
        //     }

        // }
    },

    buy:function(){
        let fac = Memory.facility;

        /**
         * @type RoomName
         */
        let roomName = null;

        for (roomName in supplyConfig) {
            let roomFac = fac[roomName];
            let demand = supplyConfig[roomName].demand;
            /**
             * @type StructureStorage
             */
            let storage = Game.getObjectById(roomFac.storageId);
            /**
             * @type StructureTerminal
             */
            let terminal = Game.getObjectById(roomFac.terminalId);
            /**
             * @type ResourceConstant
             */
            let type = null;
            //@ts-ignore
            for (type in demand) {
                if(type!="O"&&type!="H"){
                    continue;
                }
                let exAmount=storage.store.getUsedCapacity(type) + terminal.store.getUsedCapacity(type) ;
                if (exAmount> 1000) {
                    continue;
                }

                console.log(roomName + " buy " + type);
                tran.buy(roomName,1000,type);
            }
        }
    },

    /**
     * 
     * @param {Creep} creep 
     */
    run: function (creep) {


        let fac = Memory.facility;
        let workPos = fac[creep.memory.workRoom].dispatch.workPos;

        let tarPos = new RoomPosition(workPos.x, workPos.y, workPos.roomName);
        if (creep.pos.getRangeTo(tarPos)) {
            creep.moveTo(tarPos);
            return;
        }

        /**
         * @type RoomName
         */
        //@ts-ignore
        let roomName = creep.memory.workRoom;


        let roomFac = fac[creep.memory.workRoom];
        let roomReqs = Memory.dispatchReqs[creep.memory.workRoom];
        /**
         * @type StructureStorage
         */
        let storage = Game.getObjectById(roomFac.storageId);

        /**
         * @type StructureTerminal
         */
        let terminal = Game.getObjectById(roomFac.terminalId);

        //起始状态：无任务，有可能有资源

        /**
         * @type RoomDispatchReq
         */
        let req = null;

        //有资源：分配input/送回storage
        if (creep.store.getUsedCapacity(creep.memory.resourceType)) {
            for (let key in roomReqs) {
                let r = roomReqs[key];
                if (r.amount > 0 && r.resourceType == creep.memory.resourceType && r.type == "input") {
                    if (!req || req.priority > r.priority) {
                        req = r;
                        break;
                    }

                }
            }
            if (req) {
                creep.transfer(Game.getObjectById(req.id), req.resourceType);
                req.amount -= creep.store.getCapacity();

                creep.room.visual.line(creep.pos, Game.getObjectById(req.id).pos, {
                    color: 'red',
                    lineStyle: 'dashed'
                });
                return;
            }
            creep.transfer(storage, creep.memory.resourceType);
            return;
        }

        //没有资源：寻找任务
        for (let key in roomReqs) {
            let r = roomReqs[key];
            if (r.amount <= 0) {
                continue;
            }

            //剔除无法完成的input
            if (r.type == "input" && resAmount[roomName]) {
                let rNode = resAmount[roomName].terminal[r.resourceType];
                let sAmount = storage.store.getUsedCapacity(r.resourceType);
                if (sAmount == 0 || (rNode && r.id == terminal.id && rNode.sMinAmount && sAmount < rNode.sMinAmount)) {
                    // console.log(creep.name+r.resourceType+" skip"+sAmount)
                    continue
                }
            }
            if (!req || req.priority > r.priority) {
                req = r;
            }
        }

        if (!req) {
            return;
        }

        creep.room.visual.line(creep.pos, Game.getObjectById(req.id).pos, {
            color: 'orange',
            lineStyle: 'dashed'
        });

        creep.memory.resourceType = req.resourceType;
        if (req.type == "input") {
            creep.withdraw(storage, req.resourceType);
            return;
        }
        if (req.type == "output") {
            if (Game.getObjectById(req.id).store.getUsedCapacity(req.resourceType) == 0) {
                req.amount = 0;
                return;
            }
            creep.withdraw(Game.getObjectById(req.id), req.resourceType);

        }

        return;

        Game.market.createOrder({
            type: ORDER_SELL,
            resourceType: RESOURCE_ENERGY,
            price: 0.25,
            totalAmount: 20000,
            roomName: "W3N15"
        });
        Game.market.createOrder({
            type: ORDER_SELL,
            resourceType: RESOURCE_CATALYST,
            price: 2,
            totalAmount: 20000,
            roomName: "W3N15"
        });

        Game.market.createOrder({
            type: ORDER_SELL,
            resourceType: RESOURCE_CATALYST,
            price: 1,
            totalAmount: 20000,
            roomName: "W3N15"
        });

        Game.market.createOrder({
            type: ORDER_SELL,
            resourceType: "XKH2O",
            price: 15,
            totalAmount: 20000,
            roomName: "W3N15"
        });

        Game.market.createOrder({
            type: ORDER_SELL,
            resourceType: "XKHO2",
            price: 6,
            totalAmount: 2000,
            roomName: "W3N15"
        });


        Game.market.extendOrder("5f885477083753341cd85f4a", 20000)


        // if (creep.store.getUsedCapacity()){
        //     if(terminal.store.getUsedCapacity(RESOURCE_ENERGY)<20000){
        //         creep.transfer(terminal, RESOURCE_ENERGY);
        //     }else{
        //         creep.transfer(storage, RESOURCE_ENERGY);
        //     }
        // }
        // if(link.store.getUsedCapacity(RESOURCE_ENERGY)){
        //     creep.withdraw(link,RESOURCE_ENERGY);
        // }

        /**
         

        



         */
    }
}

module.exports = dispatch;