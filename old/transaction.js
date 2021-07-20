//@ts-check

const config={
    energyBasePrice:0.2
}

module.exports = {
    /**
     * 
     * @param {RoomName} roomName 
     * @param {Number} amount 
     * @param {ResourceConstant} resourceType 
     */
    buy: function (roomName, amount, resourceType) {
        let fac = Memory.facility;
        /**
         * @type StructureTerminal
         */
        let terminal = Game.getObjectById(fac[roomName].terminalId);
        if (terminal.cooldown) {
            return;
        }
        var orders = Game.market.getAllOrders({
            type: ORDER_SELL,
            resourceType: resourceType
        });

        let minPrice=Number.MAX_VALUE;
        let minOrder=null;
        for (let index in orders) {
            let order = orders[index];
            var realPrice = (order.price * 1000+Game.market.calcTransactionCost(1000, roomName, order.roomName))/1000;
            if (realPrice < minPrice) {
                minPrice = realPrice;
                minOrder=order;
            }
        }
        console.log("[deal]:"+Game.market.deal(minOrder.id, amount, roomName));
    }
}



//出售资源
// if (infra.W25S11.terminal.cooldown == 0) {
//     // console.log(infra.W25S11.terminal.cooldown)
//     var orders = Game.market.getAllOrders({
//         type: ORDER_BUY,
//         resourceType: RESOURCE_ENERGY
//     });
//     var dealIndex = -1;
//     var maxPrice = 0;
//     var maxIndex = -1;
//     for (let index in orders) {
//         let order = orders[index];
//         // console.log((order.price*1000)/(1000+Game.market.calcTransactionCost(1000, 'W25S11', order.roomName)));
//         var realPrice = (order.price * 1000) / (1000 + Game.market.calcTransactionCost(1000, 'W25S11', order.roomName));
//         if (maxPrice < realPrice) {
//             maxPrice = realPrice;
//             maxIndex = index;
//         }
//     }
//     if (Memory.lastPrice != maxPrice) {
//         Memory.lastPrice = maxPrice;
//         // console.log(maxPrice.toFixed(4));
//     }

//     // if (realPrice > 0.18) {
//     //     console.log("[deal]:" + Game.market.deal(orders[maxIndex].id, 2000, "W25S11"));
//     //     console.log(JSON.stringify(orders[maxIndex], null, "\t"));
//     // }
//     if (Memory.maxPrice == undefined || Memory.maxPrice < realPrice) {
//         Memory.maxPrice = realPrice;
//     }


//     var orders = Game.market.getAllOrders({
//         type: ORDER_SELL,
//         resourceType: RESOURCE_ENERGY
//     });
//     var minPrice = 9999999;
//     var minIndex = -1;
//     for (let index in orders) {
//         let order = orders[index];
//         // console.log((order.price*1000)/(1000+Game.market.calcTransactionCost(1000, 'W25S11', order.roomName)));
//         var realPrice = (order.price * 1000) / (1000 - Game.market.calcTransactionCost(1000, 'W25S11', order.roomName));
//         if (minPrice > realPrice) {
//             minPrice = realPrice;
//             minIndex = index;
//         }
//     }

//     if (Memory.lastMinPrice != minPrice) {
//         Memory.lastMinPrice = minPrice;
//         // console.log("minPrice:" + minPrice.toFixed(4));
//     }

//     if (minPrice < 0.12) {
//         console.log("[deal]:" + Game.market.deal(orders[minIndex].id, 2000, "W25S11"));
//         console.log(JSON.stringify(orders[minIndex], null, "\t"));
//     }






//     // console.log(infra.W25S11.terminal.cooldown)
//     var orders = Game.market.getAllOrders({
//         type: ORDER_BUY,
//         resourceType: RESOURCE_ZYNTHIUM
//     });
//     var dealIndex = -1;
//     var maxPrice = 0;
//     var maxIndex = -1;
//     for (let index in orders) {
//         let order = orders[index];
//         // console.log((order.price*1000)/(1000+Game.market.calcTransactionCost(1000, 'W25S11', order.roomName)));
//         var realPrice = (order.price * 1000 - Game.market.calcTransactionCost(1000, 'W25S11', order.roomName) * 0.12) / 1000;
//         if (maxPrice < realPrice) {
//             maxPrice = realPrice;
//             maxIndex = index;
//         }
//     }
//     // if(Memory.lastPrice!=maxPrice){
//     //     Memory.lastPrice=maxPrice;
//     //     console.log(maxPrice.toFixed(4));
//     // }

//     // if(realPrice>0.18){
//     //     console.log("[deal]:"+Game.market.deal(orders[maxIndex], 5000, "W25S11"));
//     //     console.log(JSON.stringify(order,null,"\t"));
//     // }

//     // console.log("Z1:"+maxPrice);




//     var orders = Game.market.getAllOrders({
//         type: ORDER_SELL,
//         resourceType: RESOURCE_BATTERY
//     });
//     var dealIndex = -1;
//     var minPrice = 0;
//     var minIndex = -1;
//     for (let index in orders) {
//         let order = orders[index];
//         // console.log((order.price*1000)/(1000+Game.market.calcTransactionCost(1000, 'W25S11', order.roomName)));
//         var realPrice = (order.price * 1000 + Game.market.calcTransactionCost(1000, 'W25S11', order.roomName) * 0.12) / 1000;
//         if (minPrice < realPrice) {
//             minPrice = realPrice;
//             minIndex = index;
//         }
//     }
//     if (minPrice < 1) {
//         console.log("[deal]:" + Game.market.deal(orders[minIndex].id, 2000, "W25S11"));
//         console.log(JSON.stringify(orders[minIndex], null, "\t"));
//     }
//     // console.log("Z2:"+minPrice);




// }