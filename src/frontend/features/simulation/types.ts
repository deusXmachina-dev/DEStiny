export interface SimulationEntityState {
    id: string;
    type: string;
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
    entityType: string;
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

