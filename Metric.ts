export type MetricMemory = {
    record: string[];
}

type RecordType = "count" | "gauge";

type MetricRecord = {
    type: RecordType;
    sum: number;
    count: number;
    value: number;
}


export class Metric {
    private static memory: MetricMemory;
    private static curRecordMap: { [key: string]: MetricRecord } = {};

    public static init(memory: MetricMemory) {
        this.memory = memory;
        this.curRecordMap = {}
    }

    public static fresh() {
        //清理旧数据
        if (this.memory.record.length > 30) {
            this.memory.record = this.memory.record.slice(this.memory.record.length - 30);
        }
        let value = JSON.stringify(this.curRecordMap);
        value = `${Game.time}=${value}`;
        this.memory.record.push(value);
    }

    public static recordCount(count: number, ...kvTags: string[]) {
        let record = this.getRecord("count", ...kvTags);
        record.sum += count;
        record.count++;
    }

    public static recordGauge(value: number, ...kvTags: string[]) {
        let record = this.getRecord("gauge", ...kvTags);
        record.value = value;
    }

    private static getRecord(type: RecordType, ...kvTags: string[]): MetricRecord {
        let key = kvTags.join(",");
        if (!this.curRecordMap[key]) {
            this.curRecordMap[key] = {
                type: type,
                sum: 0,
                count: 0,
                value: 0
            }
        }
        return this.curRecordMap[key];
    }
}