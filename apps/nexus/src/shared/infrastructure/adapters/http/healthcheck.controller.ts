import { Controller, Get } from '@nestjs/common';
import { Public } from '../../decorators';

@Controller('healthcheck')
export class HealthcheckController {
  @Public()
  @Get()
  healthcheck() {
    return {
      status: 'ok',
    };
  }
}
