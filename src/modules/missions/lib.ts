import { Entities } from 'src/shared/types/sqm';
import { fileToBase64 } from 'src/shared/utils/file';
import {
  extractImagePaths,
  generateRandomString,
} from 'src/shared/utils/string';

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
            coordinates: {
              x: entities[key]?.position?.[0] ?? 0,
              z: entities[key]?.position?.[1] ?? 0,
              y: entities[key]?.position?.[2] ?? 0,
            },
          },
        });
        break;
      default:
        break;
    }
  });

  return markers;
};

const replacePathsWithBase64 = (
  htmlText: string,
  imagePaths: string[] = [],
) => {
  imagePaths.forEach((path) => {
    const base64Data = fileToBase64(path);

    if (base64Data) {
      htmlText = htmlText.replaceAll(path, base64Data);
    }
  });

  return htmlText;
};

const getDiaryContent = (missionPath: string, diaryContent: string) => {
  diaryContent = diaryContent
    .replaceAll(/\\/g, '/')
    .replaceAll('image=', 'src=');

  diaryContent = diaryContent.replaceAll('.JPG', '.jpg');
  diaryContent = diaryContent.replaceAll('.PNG', '.png');
  diaryContent = diaryContent.replaceAll('.JPEG', '.jpeg');
  diaryContent = diaryContent.replaceAll('.PAA', '.paa');

  const imagePaths = extractImagePaths(diaryContent);
  imagePaths.forEach((path, index) => {
    const filePath = `${missionPath}/${path}`;

    imagePaths[index] = filePath;
    diaryContent = diaryContent.replaceAll(path, filePath);
  });

  diaryContent = replacePathsWithBase64(diaryContent, imagePaths);

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
