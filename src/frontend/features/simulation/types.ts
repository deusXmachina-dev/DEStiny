export type SimulationEntityType = "agv" | "robot" | "box" | "palette" | "human" | "counter" | "grid_node";

export interface SimulationEntityState {
    entityId: string;
    entityType: SimulationEntityType;
    x: number;
    y: number;
    angle: number;
    children: SimulationEntityState[];
}

export interface SimulationRecording {
    duration: number;
    segments_by_entity: {
        [entity_id: string]: SimulationMotionSegment[];
    };
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

