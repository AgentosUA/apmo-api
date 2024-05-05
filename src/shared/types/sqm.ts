/* REF: https://community.bistudio.com/wiki/Category:Data_Types */

type DataType =
  | 'Number'
  | 'Object'
  | 'Empty'
  | 'Side'
  | 'Group'
  | 'Marker'
  | 'String'
  | 'Code'
  | 'Config'
  | 'Control'
  | 'Display'
  | 'Location'
  | 'Script Handle'
  | 'Structured Text'
  | 'Diary Record'
  | 'Task'
  | 'Team Member'
  | 'Namespace'
  | 'Editor Object'
  | 'Eden ID'
  | 'Eden Entity'
  | 'NaN'
  | 'HashMap'
  | 'HashMapKey'
  | 'Layer';

type Side =
  | 'West'
  | 'East'
  | 'Independent'
  | 'Civilian'
  | 'Empty'
  | 'BLUFOR'
  | 'OPFOR'
  | 'Logic'
  | 'Unknown';

type Entities = Record<string, EntityItem> & { items: number };

type EntityItem = {
  dataType: DataType;
  Entities: Entities;
  PositionInfo: {
    position: [number, number, number];
    angles: [number, number, number];
  };
  side: Side;

  flags: number;
  Attributes: {
    rank?: string; // 'SERGEANT';
    init?: string; // 'call{[this, "USMC", "SL"] call compile preprocessFileLineNumbers "process_units.sqf";}';
    description: string;
    isPlayable: 1 | 0 | number;
    Inventory?: object;
    lock?: 'LOCKED' | 'UNLOCKED';
    pylons?: string;
    fuel?: number;
  };
  id: number;
  type: string;
  angle?: number;
  fillName?: string;
  colorName?: string;
  a?: number;
  b?: number;
  position?: number[];
  markerType?: string;
  atlOffset?: 0.00072097778;
  CustomAttributes?: {
    Attribute0: {
      property: string;
      expression: string;
      Value: {
        data: {
          singleType: string;
          value: string;
        };
      };
    };
    Attribute1: {
      property: string;
      expression: '_this setpitch _value;';
      Value: {
        data: {
          singleType: 'SCALAR';
          value: 0.98000002;
        };
      };
    };
    nAttributes: 2;
  };
};

export type { DataType, Side, Entities, EntityItem };
