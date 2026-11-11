import { Controller, Get, Param, Res } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';

@Controller('/maps')
export class MapsController {
  constructor() {}

  // Express 5 (Nest 11+): wildcards must be named; `path` is an array of segments
  @Get('*path')
  async getProfile(
    @Param('path') path: string[] | string,
    @Res() res: Response,
  ) {
    try {
      const response = await axios.get(
        `${process.env.MAPS_URL}/${Array.isArray(path) ? path.join('/') : path}`,
        {
          responseType: 'arraybuffer',
        },
      );

      res.setHeader('Content-Type', 'image/png');

      return res.send(response.data);
    } catch {
      return res.status(404).send('Not found');
    }
  }
}
