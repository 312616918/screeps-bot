import {RoomFacility} from "./RoomFacility";
import {GLOBAL_NUMBER_CONFIG, RoomName} from "./Config";
import {CarryGroupV2} from "./CarryGroupV2";
import {logError, logInfo} from "./Util";
import * as _ from "lodash";



export class MarkerController {
    protected carry: CarryGroupV2;
    private roomFacility: RoomFacility;
    private roomName: RoomName;

    constructor(carry: CarryGroupV2, roomFacility: RoomFacility) {
        this.carry = carry;
        this.roomFacility = roomFacility;
        this.roomName = roomFacility.roomName;
    }


    public run() {
        // 100周期验证一次
        if (Game.time % 50 != 0) {
            return;
        }
        // // 试点
        // if (this.roomName != RoomName.E8N9 && this.roomName != RoomName.E9N9) {
        //     return;
        // }
        try {
            // 同时有terminal和storage
            let terminal = this.roomFacility.getTerminal();
            let storage = this.roomFacility.getStorage();
            if (!terminal || !storage) {
                return;
            }

            //验证元素矿数量
            let mineralType = this.roomFacility.getRoomMineralType();
            this.checkTransToTerminal(mineralType);
            this.checkTerminalSale(mineralType);

            //主房间处理power
            if (this.roomName == RoomName.E9N9) {
                this.checkTransToTerminal(RESOURCE_POWER);
                this.checkTerminalSale(RESOURCE_POWER);
            }

        } catch (e) {
            logError(`run market error: ${this.roomName} ${e.stack}`);
        }
    }

    private checkTerminalSale(mineralType: ResourceConstant) {
        if(!mineralType){
            return;
        }
        let terminal = this.roomFacility.getTerminal();
        //判断是否应该售卖
        let mineralAmount = terminal.store.getUsedCapacity(mineralType);
        if (mineralAmount <= GLOBAL_NUMBER_CONFIG.mineralSellAmount) {
            return;
        }

        //售卖
        //判断是否已有订单
        let orderList = Game.market.getAllOrders({
            type: ORDER_SELL,
            resourceType: mineralType,
            roomName: this.roomName
        })
        //已有
        if (orderList && orderList.length > 0) {
            let order = orderList[0];
            // 不足batch的一半，追加
            if (order.remainingAmount >= GLOBAL_NUMBER_CONFIG.mineralSellBatch / 2) {
                return;
            }
            Game.market.extendOrder(order.id, GLOBAL_NUMBER_CONFIG.mineralSellBatch / 2);
            return;
        }

        //没有，创建
        let price = this.getPrice(mineralType);
        if (price <= 0) {
            return;
        }
        price = Math.ceil(price)
        logInfo(`create order: ${this.roomName} ${mineralType} ${price} ${GLOBAL_NUMBER_CONFIG.mineralSellBatch}`);
        Game.market.createOrder({
            type: ORDER_SELL,
            resourceType: mineralType,
            price: price,
            totalAmount: GLOBAL_NUMBER_CONFIG.mineralSellBatch,
            roomName: this.roomName
        })
    }

    private checkTransToTerminal(mineralType: ResourceConstant) {

        let terminal = this.roomFacility.getTerminal();
        let storage = this.roomFacility.getStorage();
        let amount = storage.store.getUsedCapacity(mineralType);
        if (amount <= GLOBAL_NUMBER_CONFIG.mineralMaxAmount) {
            return;
        }

        //尝试转移到terminal
        if (terminal.store.getFreeCapacity() < GLOBAL_NUMBER_CONFIG.terminalReservedAmount) {
            return;
        }
        this.carry.addCarryReq(terminal, "input", mineralType, GLOBAL_NUMBER_CONFIG.mineralSellBatch, 0);
    }

    private getPrice(resourcesType: ResourceConstant): number {
        let buyOrderList = Game.market.getAllOrders({
            type: ORDER_BUY,
            resourceType: resourcesType
        })
        //排序，取top1最高
        buyOrderList.sort((a, b) => {
            return b.price - a.price
        });
        let buyPrice = 0;
        //删除低于10
        buyOrderList = buyOrderList.filter(o => o.price > 10);
        if (buyOrderList.length > 0) {
            buyPrice = buyOrderList[0].price
        }

        let sellOrderList = Game.market.getAllOrders({
            type: ORDER_SELL,
            resourceType: resourcesType
        })
        //排序，取最低3个的平均值，低于10的是异常值
        sellOrderList.sort((a, b) => {
            return a.price - b.price
        })
        let sellPrice = 0;
        //删除低于10
        sellOrderList = sellOrderList.filter(o => o.price > 10);
        if (sellOrderList.length > 0) {
            sellOrderList = sellOrderList.slice(0, 3)
            sellPrice = _.sum(sellOrderList.map(o => o.price)) / sellOrderList.length
        }
        return Math.max(buyPrice, sellPrice)
    }
}

type SaleItem = {
    resourceType: ResourceConstant;
    terminalMaxAmount: number;
    ignore?:boolean;
}

const SALE_CONFIG:{
    [name in RoomName]?:SaleItem[];
} = {
    [RoomName.E9N9]: [{
        resourceType: RESOURCE_POWER,
        terminalMaxAmount: 100_000
    }],
    [RoomName.E11N11]: [{
        resourceType: RESOURCE_ZYNTHIUM_BAR,
        terminalMaxAmount: 100_000
    }]
}