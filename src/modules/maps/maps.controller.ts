import { Controller, Get, Param, Res } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';

@Controller('/maps')
export class MapsController {
  constructor() {}

  @Get('*')
  async getProfile(@Param() params, @Res() res: Response) {
    try {
      const response = await axios.get(
        `${process.env.MAPS_URL}/${params['0']}`,
        {
          responseType: 'arraybuffer',
        },
      );

      res.setHeader('Content-Type', 'image/png');

      return res.send(response.data);
    } catch (error) {
      return res.status(404).send('Not found');
    }
  }
}
