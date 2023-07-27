import {RoomName} from "./globalConfig";
import {FacilityMemory} from "./facility";

type LinkTask = {
    targetId: string;
    amount: number;
    ddl: number;
}

type LinkMemory = {
    [linkId: string]: LinkTask;
}


export class Link {
    protected readonly roomName: RoomName;
    private fac: FacilityMemory;
    private memory: LinkMemory;


    constructor(roomName: RoomName, m: LinkMemory, fac: FacilityMemory) {
        this.roomName = roomName;
        this.memory = m;
        this.fac = fac;
    }


    public run(): void {
        let sourceFac = this.fac.sources;
        let sourceLinks: StructureLink[] = [];
        for (let sourceId in sourceFac) {
            let sourceConfig = sourceFac[sourceId];
            let link = Game.getObjectById<StructureLink>(sourceConfig.linkId);
            if (!link) {
                continue;
            }
            sourceLinks.push(link);
        }
        let upgradeLink = Game.getObjectById<StructureLink>(this.fac.upgrade.linkId);
        let centerLink = Game.getObjectById<StructureLink>(this.fac.centerLinkId);
        if (upgradeLink && sourceLinks.length != 0) {
            sourceLinks.forEach(link => {
                if (link.store.getFreeCapacity("energy") == 0
                    && upgradeLink.store.getUsedCapacity("energy") <= 24) {
                    link.transferEnergy(upgradeLink);
                    return;
                }
                if (centerLink && centerLink.store.getUsedCapacity("energy") <= 24) {
                    link.transferEnergy(centerLink);
                }
            })
        }
    }

    public addTask(linkId: string): void {

    }

}