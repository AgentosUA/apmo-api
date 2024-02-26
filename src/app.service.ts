import { Injectable } from '@nestjs/common';

import * as fs from 'fs';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class AppService {
  async getHello() {
    // TODO: run terminal command to convert mission.pbo to mission folder
    // TODO: run terminal command to convert mission.sqm to mission.xml
    // const sqmFilePath = 'public/mission.sqm';

    const xmlFilePath = 'public/mission.xml';
    // const outputJSONPath = `${__dirname}/../public/missions/mission.json`;

    const sqmData = `<Mission>${fs.readFileSync(xmlFilePath, 'utf-8').toString().replaceAll('&', 'and')}</Mission>`;
    const data = await parseStringPromise(sqmData);

    // fs.writeFileSync(outputJSONPath, parsedData, 'utf-8');

    const intel = data.Mission.Mission[0].Intel[0];
    const entities = data.Mission.Mission[0].Entities[0];

    return {
      fileName: data.Mission.sourceName[0],
      missionNamme: intel.briefingName[0],
      author: data.Mission.ScenarioData[0].author[0],
      preview: {
        text: data.Mission.ScenarioData[0].overviewText[0],
        image: data.Mission.ScenarioData[0].overViewPicture[0],
      },
      briefing: {
        intel: {
          overviewText: intel.overviewText[0],
          year: intel.year[0],
          month: intel.month[0],
          day: intel.day[0],
          hour: intel.hour[0],
          minute: intel.minute[0],
          // fog?
        },
      },
      entities: {
        count: Number(entities.items[0]),
        data: [],
      },
    };

    // return data;
  }
}
