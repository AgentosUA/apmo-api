import { Injectable } from '@nestjs/common';

import * as fs from 'fs';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class AppService {
  async getHello() {
    // TODO: run terminal command to convert mission.sqm to mission.xml
    // const sqmFilePath = 'public/mission.sqm';

    const xmlFilePath = 'public/mission.xml';
    // const outputJSONPath = `${__dirname}/../public/missions/mission.json`;

    // Read the SQM file
    const sqmData = `<Mission>${fs.readFileSync(xmlFilePath, 'utf-8').toString().replaceAll('&', 'and')}</Mission>`;

    // Parse the INI-formatted data to JavaScript object
    const data = await parseStringPromise(sqmData);

    // fs.writeFileSync(outputJSONPath, parsedData, 'utf-8');

    return data;
  }
}
