import {Polyline, PolylineOptions} from 'leaflet';

export type LPolyline = Polyline & {options: PolylineOptions & { picket_id: number, road_num: string, comment: string }}
