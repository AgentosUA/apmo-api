/* REF: https://community.bistudio.com/wiki/Category:Data_Types */

type DataType =
  | 'Number'
  | 'Object'
  | 'Side'
  | 'Group'
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
  | 'HashMapKey';

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
  };
  id: number;
  type: 'wog_usmc_wd_Plco';
  atlOffset: 0.00072097778;
  CustomAttributes: {
    Attribute0: {
      property: 'speaker';
      expression: '_this setspeaker _value;';
      Value: {
        data: {
          singleType: 'STRING';
          value: 'Male06ENG';
        };
      };
    };
    Attribute1: {
      property: 'pitch';
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
