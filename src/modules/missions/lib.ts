import { Entities } from 'src/shared/types/sqm';
import { assignCallsigns } from './callsigns';
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
      // mission.sqm omits default values: rank PRIVATE, empty description, zero rotation.
      rank: entities[key].Attributes.rank ?? 'PRIVATE',
      type: entities[key].type,
      description: entities[key].Attributes.description ?? '',
      isPlayable: Boolean(entities[key].Attributes.isPlayable),
      inventory: entities[key].Attributes.Inventory ?? null,
      position: {
        coordinates: {
          x: entities[key].PositionInfo.position[0],
          z: entities[key].PositionInfo.position[1],
          y: entities[key].PositionInfo.position[2],
        },
        angles: entities[key].PositionInfo.angles ?? [0, 0, 0],
      },
    });
  });

  return units;
};

type MissionGroup = {
  id: number;
  side: Entities[0]['side'];
  units: ReturnType<typeof getUnitFromGroupEntity>;
};

const collectGroups = (entities: Entities): MissionGroup[] => {
  const entitiesKeys = Object.keys(entities);
  const groups: MissionGroup[] = [];

  entitiesKeys.forEach((key, index) => {
    if (!index || !entities[key].dataType) return;

    if (entities[key].dataType === 'Group') {
      groups.push({
        id: entities[key].id,
        side: entities[key].side,
        units: getUnitFromGroupEntity(entities[key].Entities),
      });
      return;
    }

    // Eden layers (and other containers) can hold groups too.
    if (entities[key].Entities) {
      groups.push(...collectGroups(entities[key].Entities));
    }
  });

  return groups;
};

/** Groups with lobby callsigns (`@Alpha X-Y` overrides respected). */
const getGroupsFromEntity = (entities: Entities) =>
  assignCallsigns(collectGroups(entities));

const getVehicleType = (entity: Entities[0]) => {
  if (entity?.Attributes?.pylons) return 'air';
  if (entity?.type?.toLowerCase().includes('ammo')) return 'crate';
  if (
    entity?.type?.toLowerCase().includes('crate') &&
    !entity?.type?.toLowerCase().includes('crater')
  )
    return 'crate';
  if (entity?.type?.toLowerCase().includes('static')) return 'static';
  if (entity?.type?.toLowerCase().includes('tripod')) return 'static';

  if (
    entity?.Attributes?.fuel ||
    entity?.Attributes?.lock ||
    entity?.type?.toLowerCase()?.includes('fuel') ||
    entity?.Attributes?.init?.toLowerCase().includes('veh') ||
    entity?.CustomAttributes?.Attribute0?.property === 'VehicleCustomization'
  )
    return 'land';

  return 'unknown';
};

const getVehicles = (entities: Entities) => {
  const entitiesKeys = Object.keys(entities);
  const vehicles = [];

  entitiesKeys.forEach((key, index) => {
    if (
      !index ||
      !entities[key].dataType ||
      entities[key]?.CustomAttributes?.Attribute0?.property === 'speaker' ||
      entities[key]?.Attributes?.isPlayable
    )
      return;

    if (entities[key].Entities) {
      vehicles.push(...getVehicles(entities[key].Entities));
    }

    if (entities[key].dataType === 'Object') {
      vehicles.push({
        id: entities[key].id,
        type: getVehicleType(entities[key]),
        description: entities[key].type,
        position: {
          coordinates: {
            x: entities?.[key]?.PositionInfo?.position?.[0] ?? 0,
            z: entities?.[key]?.PositionInfo?.position?.[1] ?? 0,
            y: entities?.[key]?.PositionInfo?.position?.[2] ?? 0,
          },
          angles: entities?.[key]?.PositionInfo?.angles ?? [0, 0, 0],
        },
      });
    }
  });

  return vehicles;
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
          // Omitted in mission.sqm when 1.
          width: entities[key]?.a ?? 1,
          height: entities[key]?.b ?? 1,
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

/**
 * Briefing (`briefing.sqf`) with the Arma syntax normalized: forward slashes,
 * `<img image=…>` → `<img src=…>`, unified "diary" subject and quotes.
 */
const normalizeBriefing = (briefing: string) =>
  briefing
    .replaceAll(/\\/g, '/')
    .replaceAll('image=', 'src=')
    .replaceAll("'diary'", '"diary"')
    .replaceAll("'Diary'", '"diary"')
    .replaceAll('"Diary"', '"diary"')
    .replaceAll('""', "'");

/** Paths of all `<img src>` in a normalized briefing. */
const getBriefingImagePaths = (briefing: string) => extractImagePaths(briefing);

/**
 * Diary records of a normalized briefing. `<img src>` paths are replaced with
 * the URLs from `imageUrls`; images without a URL are removed.
 */
const getDiaryContent = (
  briefing: string,
  imageUrls: ReadonlyMap<string, string> = new Map(),
) => {
  const diaryContent = briefing.replace(
    /<img[^>]*?\ssrc=(['"])([^'"]+)\1[^>]*>/g,
    (tag: string, quote: string, path: string) => {
      const url = imageUrls.get(path);

      return url
        ? tag.replace(`${quote}${path}${quote}`, `${quote}${url}${quote}`)
        : '';
    },
  );

  const diary: { id: string; name: string; value: string }[] = [];

  const regex =
    /player createDiaryRecord\s*\[\s*"diary"\s*,\s*\[\s*"([^"]+)"\s*,\s*"([\s\S]*?)"(?:\s*,\s*"[^"]*")*\s*\]\s*\];/g;

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
  getVehicles,
  normalizeBriefing,
  getBriefingImagePaths,
  getDiaryContent,
};
