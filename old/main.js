//@ts-check
var carry = require("../carry")
var upgrade = require("../upgrade")
var harvest = require("../harvest")
var attack = require("./attack")
var remoteHarvest = require("./remoteHarvest")
var remoteCarry = require("./remoteCarry")
var dispatch = require("./dispatch")
var invade = require("./invade")
var special = require("./special")
var build = require("./build")
var facility = require("../facility")
var group = require("./group")
// var xcreep=require("./creep")

const spawn = require("../spawn");


const profiler = require('./screeps-profiler');

// This line monkey patches the global prototypes.
profiler.enable();

module.exports.loop = function () {
    console.log("tick start!")
    profiler.wrap(function () {
        main();
        // Game.getObjectById("5f8d3250f7e995656938a170").send("OH",1000,"W2N16")
    });
    // main();
}

function main() {


    try {           
        group.run([Game.creeps["c0"],Game.creeps["c1"]]);
        // Game.spawns["Spawn6"].spawnCreep([MOVE],"Special-Cxx"+Game.time);
    } catch (error) {
        console.log(error)
    }




    // Game.getObjectById("5f8d3250f7e995656938a170").send("OH",1000,"W2N16")
    if (Game.cpu.bucket > 9000) {
        Game.cpu.generatePixel();
    }

    try {
        if (Game.time % 100 == 0) {
            facility.refresh();
        }
        facility.visual();
        // facility.runLab();
        dispatch.initReqs();
        // if (Game.time % 10 == 0) {
        //     dispatch.roomDispatch();
        //     dispatch.buy();
        // }


        /**
         * @type StructureObserver
         */
        let oberver = Game.getObjectById("5f7d6487174162bbb16f46ae");
        oberver.observeRoom("W5N20");

    } catch (error) {
        console.log("12" + error);
    }



    let fac = Memory.facility;


    for (let roomName in fac) {
        let roomFac = fac[roomName];

        // if (roomName != "W7N16") {
        //     /**
        //      * @type StructureTerminal
        //      */
        //     let terminal = Game.getObjectById(roomFac.terminalId);
        //     if (terminal && terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 15000) {
        //         terminal.send(RESOURCE_ENERGY, 10000, "W7N16");
        //     }
        // }


        let centerLink = Game.getObjectById(roomFac.centerLinkId);
        let upgradeLink = null;
        if (roomFac.upgrade) {
            upgradeLink = Game.getObjectById(roomFac.upgrade.linkId);
        }
        if (centerLink && upgradeLink && centerLink.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            centerLink.transferEnergy(upgradeLink);
        }
    }



    // new RoomVisual('W3N15').text("<table><th>Target💥</th></table>", 5, 5, {color: 'green', font: 0.8}); 


    // Game.market.createOrder({
    //     type: ORDER_BUY,
    //     resourceType: PIXEL,
    //     price: 620,
    //     totalAmount: 500,
    //     roomName: "W3N15"   
    // });


    if (0) {
        // console.log(infra.W25S11.terminal.cooldown)
        var orders = Game.market.getAllOrders({
            type: ORDER_BUY,
            resourceType: RESOURCE_ENERGY
        });
        var dealIndex = -1;
        var maxPrice = 0;
        var maxIndex = -1;
        for (let index in orders) {
            let order = orders[index];
            // console.log((order.price*1000)/(1000+Game.market.calcTransactionCost(1000, 'W25S11', order.roomName)));
            var realPrice = (order.price * 1000) / (1000 + Game.market.calcTransactionCost(1000, 'W3N15', order.roomName));
            if (maxPrice < realPrice) {
                maxPrice = realPrice;
                maxIndex = index;
            }
        }
        console.log(maxPrice.toFixed(4));

        if (Memory.lastPrice != maxPrice) {
            Memory.lastPrice = maxPrice;
            console.log(maxPrice.toFixed(4));
        }

        let dealPrice = 0.2;
        var storage = Game.getObjectById("5f50de8dbd95e2f91bf16ca4");
        if (storage.store.getFreeCapacity() < 50000) {
            dealPrice = 0.12;
        }

        if (maxPrice > dealPrice) {

            for (let roomName in fac) {
                let roomFac = fac[roomName];
                if (roomFac.terminalId) {
                    /**
                     * @type StructureTerminal
                     */
                    let terminal = Game.getObjectById(roomFac.terminalId);
                    if (terminal && terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 20000) {
                        console.log("[deal]:" + roomName + " " + Game.market.deal(orders[maxIndex].id, 10000, roomName));
                    }
                }
            }
            console.log(JSON.stringify(orders[maxIndex], null, "\t"));
        }
        if (Memory.maxPrice == undefined || Memory.maxPrice < realPrice) {
            Memory.maxPrice = realPrice;
        }
    }




    try {



        var sourceLink = Game.getObjectById("5f52743fec448e69c2bc19e6");
        var upgradeLink = Game.getObjectById("5f6846a59b3005dcb256e128");
        var upgradeCont = Game.getObjectById("5f6d4c59b3ee3a3f78723ee1");
        var centerLink = Game.getObjectById("5f575020c55d042c4b78aef4");
        var leftLink = Game.getObjectById("5f61d7a3f795e6c9432a8e87");
        var leftLinkU = Game.getObjectById("5f7d1538f1269111316998f5");

        var leftLinkIds = [
            "5f61d7a3f795e6c9432a8e87",
            "5f7d1538f1269111316998f5",
            "5f7d19169b5f8b3f9a9a3336"
        ];
        for (let i in leftLinkIds) {
            let link = Game.getObjectById(leftLinkIds[i]);
            if (!link) {
                continue;
            }
            if (link.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                if (upgradeLink.store.getUsedCapacity(RESOURCE_ENERGY) < 25) {
                    link.transferEnergy(upgradeLink);
                } else if (centerLink.store.getUsedCapacity(RESOURCE_ENERGY) < 25) {
                    link.transferEnergy(centerLink);
                }
            }
        }



        if (sourceLink.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            if (upgradeLink.store.getUsedCapacity(RESOURCE_ENERGY) < 20) {
                sourceLink.transferEnergy(upgradeLink);
            } else {
                sourceLink.transferEnergy(centerLink);
            }
        }
        // if (leftLink.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        //     if (upgradeLink.store.getUsedCapacity(RESOURCE_ENERGY) < 400) {
        //         leftLink.transferEnergy(upgradeLink);
        //     } else {
        //         leftLink.transferEnergy(centerLink);
        //     }
        // }

        if (centerLink.store.getFreeCapacity(RESOURCE_ENERGY) == 0 &&
            upgradeLink.store.getUsedCapacity(RESOURCE_ENERGY) == 0 &&
            upgradeCont.store.getUsedCapacity(RESOURCE_ENERGY) < 500) {
            centerLink.transferEnergy(upgradeLink);
        }

        // var sourceLink1 = Game.getObjectById("5f71ff102b43b1d77070cf7b");
        // var leftLink1 = Game.getObjectById("5f71f8edc089314e41267de9");
        // if (sourceLink1.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        //     sourceLink1.transferEnergy(leftLink1);

        // }


        var sourceLink2 = Game.getObjectById("5f7c0893e99f95f88c6ee992");
        var upgradeLink2 = Game.getObjectById("5f7c18468591b317c1e2b422");
        if (sourceLink2.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            sourceLink2.transferEnergy(upgradeLink2);

        }
    } catch (error) {
        console.log(error);
    }



    if (Game.time % 500 == 0) {
        delete Memory["carryReqs"];
        console.log("[delete]: carryreq ")
    }


    try {
        //清理creep内存，重置资源预约
        for (var name in Memory.creeps) {
            if (!Game.creeps[name]) {

                // delete Memory.creeps[name];
                console.log('[clear memory]:', name);

                if (Memory.creeps[name].reqId) {
                    // carry.cancelReq(name);
                    Memory.carryReqs[Memory.creeps[name].workRoom][Memory.creeps[name].reqId].reserve -= Memory.creeps[name].reserve;
                }
                delete Memory.creeps[name];
            }
        }
    } catch (e) {
        console.log(e)
    }


    facility.runTower();

    build.spawnCreeps();
    remoteCarry.spawnCreeps();
    special.spawnCreeps();

    upgrade.spawnCreeps();
    harvest.spawnCreeps();
    carry.spawnCreeps();
    dispatch.spawnCreeps();
    invade.spawnCreeps();

    carry.initReq();

    spawn.spwanCreep();

    remoteHarvest.spawnCreeps();

    // attack.spawnCreeps();




    // var enemys=Game.rooms["W4N15"].find(FIND_HOSTILE_CREEPS);

    // remoteHarvest.spawnCreeps();


    // remoteHarvest.spawnCreeps();
    // attack.spawnCreeps();

    // try {
    //     if (Memory.attackTime) {
    //         if (Game.time - Memory.attackTime > 1320) {
    //             Memory.attackTime = 0;
    //         }
    //     } else {
    //         if (Game.rooms["W4N15"]) {
    //             var enemys = Game.rooms["W4N15"].find(FIND_HOSTILE_CREEPS);
    //             if (enemys.length > 5) {
    //                 Memory.attackTime = Game.time;
    //             }
    //         }

    //         remoteHarvest.spawnCreeps();
    //         attack.spawnCreeps();


    //     }

    // } catch (error) {
    //     console.log(error)
    //     Memory.attackTime = Game.time;
    // }








    for (var name in Game.creeps) {

        try {
            var creep = Game.creeps[name];
            if (name.indexOf("Carrier-") == 0) {
                carry.run(creep);

            } else if (name.indexOf("Builder-") == 0) {
                build.run(creep);
            } else if (name.indexOf("Harvester-") == 0) {
                harvest.run(creep)
            } else if (name.indexOf("Upgrader-") == 0) {
                upgrade.run(creep);
            } else if (name.indexOf("Attacker-") == 0) {
                attack.run(creep);
            } else if (name.indexOf("RemoteHarvester-") == 0) {
                remoteHarvest.run(creep);
            } else if (name.indexOf("RemoteCarrier-") == 0) {
                remoteCarry.run(creep);
            } else if (name.indexOf("Dispatcher-") == 0) {
                dispatch.run(creep);
            } else if (name.indexOf("Invader-") == 0 || name.indexOf("Invade-") == 0) {
                invade.run(creep);
            } else if (name.indexOf("Special-") == 0) {
                special.run(creep);
                // carry.run(creep)
            }
        } catch (error) {
            console.log("#ERROR:" + creep.name + error);

        }

    }




    return;



}