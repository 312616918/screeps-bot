import {Metric} from "./Metric";


export class TmpMemory {
    private static isEffect: boolean;

    public static metric() {
        if (this.isEffect) {
            return;
        }
        Metric.recordCount(1, "type", "global_mem_clean")
        this.isEffect = true;
    }
}