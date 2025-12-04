import { Metric } from "@features/metrics";

import { SimulationMotionSegment } from "@features/simulation";


export interface SimulationRecording {
    duration: number;
    segments_by_entity: {
        [entity_id: string]: SimulationMotionSegment[];
    };
    metrics?: Metric[];
}

