import { Metric } from "@features/metrics";
import { SimulationEntityType } from "@features/visualization";


export interface SimulationRecording {
    duration: number;
    segments_by_entity: {
        [entity_id: string]: SimulationMotionSegment[];
    };
    metrics?: Metric[];
}

export interface SimulationMotionSegment {
    entityId: string;
    entityType: SimulationEntityType;
    parentId: string | null;
    startTime: number;
    endTime: number | null;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    startAngle: number;
    endAngle: number;
}
