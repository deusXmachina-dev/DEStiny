export interface SimulationComponent {
    id: string;
    type: string;
    x: number;
    y: number;
    angle: number;
    children: SimulationComponent[];
}

export interface SimulationSnapshot {
    time: number;
    components: SimulationComponent[];
}

export interface SimulationEntityState {
    id: string;
    type: string;
    x: number;
    y: number;
    angle: number;
}
