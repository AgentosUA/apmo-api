import { Injectable } from '@nestjs/common';

import * as fs from 'fs';

import { parse as parseSQMtoJSON } from 'arma-class-parser';
import { Entities } from 'src/shared/types/sqm';
import { getDiaryContent, getGroupsFromEntity } from './lib';

@Injectable()
export class MissionService {
  async parseMission() {
    // `${__dirname}/../public/missions/wog_160_target_spotted_1.chernarus.pbo`,
    // TODO: run terminal command to convert pbo to mission folder
    const sqmFilePath = 'public/mission.sqm';
    const briefingPath = 'public/briefing.sqf';

    const missionFile = fs.readFileSync(sqmFilePath, 'utf-8');

    const data = await parseSQMtoJSON(missionFile);

    const intel = data.Mission.Intel;
    const entities = data.Mission.Entities as Entities;
    let diary = [];

    if (fs.existsSync(briefingPath)) {
      const briefingFile = fs.readFileSync(briefingPath, 'utf-8');
      diary = getDiaryContent(briefingFile);
    }

    const groups = getGroupsFromEntity(entities);

    return {
      fileName: data.sourceName,
      missionNamme: intel.briefingName,
      author: data.ScenarioData.author,
      preview: {
        text: data.ScenarioData.overviewText,
        image: data.ScenarioData.overViewPicture,
      },
      dlcs: data.dlcs,
      briefing: {
        diary,
        intel: {
          overviewText: intel.overviewText,
          year: intel.year,
          month: intel.month,
          day: intel.day,
          hour: intel.hour,
          minute: intel.minute,
          // fog?
        },
      },
      groups,
      vehicles: entities.Vehicles,
      fullObject: data,
    };
  }
}
