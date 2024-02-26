import { Entities } from 'src/shared/types/sqm';

const getUnitFromGroupEntity = (entities: Entities) => {
  const unitsKeys = Object.keys(entities);
  const units = [];

  unitsKeys.forEach((key, index) => {
    if (!index) return;
    if (entities[key].dataType !== 'Object') return;

    units.push({
      id: entities[key].id,
      side: entities[key].side,
      rank: entities[key].Attributes.rank,
      type: entities[key].type,
      description: entities[key].Attributes.description,
      isPlayable: Boolean(entities[key].Attributes.isPlayable),
      inventory: entities[key].Attributes.Inventory,
      position: {
        coordinates: {
          x: entities[key].PositionInfo.position[0],
          y: entities[key].PositionInfo.position[1],
          z: entities[key].PositionInfo.position[2],
        },
        angles: entities[key].PositionInfo.angles,
      },
    });
  });

  return units;
};

const getGroupsFromEntity = (entities: Entities) => {
  const entitiesKeys = Object.keys(entities);
  const groups = [];

  entitiesKeys.forEach((key, index) => {
    if (!index) return;

    switch (entities[key].dataType) {
      case 'Group':
        groups.push({
          id: entities[key].id,
          side: entities[key].side,
          units: getUnitFromGroupEntity(entities[key].Entities),
        });
    }
  });

  return groups;
};

export { getGroupsFromEntity, getUnitFromGroupEntity };
