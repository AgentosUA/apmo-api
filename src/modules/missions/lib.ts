import { Entities } from 'src/shared/types/sqm';
import { generateRandomString } from 'src/shared/utils/string';

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
      inventory: entities[key].Attributes.Inventory ?? null,
      position: {
        coordinates: {
          x: entities[key].PositionInfo.position[0],
          z: entities[key].PositionInfo.position[1],
          y: entities[key].PositionInfo.position[2],
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
    if (!index || !entities[key].dataType) return;

    if (entities[key].dataType === 'Group') {
      groups.push({
        id: entities[key].id,
        side: entities[key].side,
        units: getUnitFromGroupEntity(entities[key].Entities),
      });
    }
  });

  return groups;
};

const getMarkersFromEntity = (entities: Entities) => {
  const entitiesKeys = Object.keys(entities);
  const markers = [];

  entitiesKeys.forEach((key, index) => {
    if (!index) return;

    switch (entities[key].dataType) {
      case 'Marker':
        markers.push({
          id: entities[key]?.id,
          markerType: entities[key]?.markerType,
          type: entities[key]?.type,
          colorName: entities[key]?.colorName,
          fillName: entities[key]?.fillName,
          width: entities[key]?.a,
          height: entities[key]?.b,
          position: {
            angle: entities[key]?.angle ?? 0,
            coordinates: entities[key]?.position ?? [0, 0, 0],
          },
        });
        break;
      default:
        break;
    }
  });

  return markers;
};

const getDiaryContent = (diaryContent: string) => {
  const diary: { id: string; name: string; value: string }[] = [];

  const regex =
    /player createDiaryRecord\s*\["diary",\s*\["([^"]+)",\s*"([^"]+)"\]\];/g;

  let match: null | string[];

  while ((match = regex.exec(diaryContent)) !== null) {
    const name = match[1];
    const value = match[2];

    diary.push({ id: generateRandomString(), name, value });
  }

  return diary;
};

export {
  getMarkersFromEntity,
  getGroupsFromEntity,
  getUnitFromGroupEntity,
  getDiaryContent,
};
