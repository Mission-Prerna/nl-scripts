import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/process-nipun')
  async processNipun() {
    return this.appService.processContinuousNipunTask();
  }

  @Get('/process-visits')
  async processModuleResultForVisitWiseStudentResult() {
    return this.appService.processContinuousModuleResultForVisitWiseStudentResult();
  }
  @Get('/process-competency-mapping')
  async processCompetencyMapping() {
    return this.appService.processContinuousCompetencyMapping();
  }

  @Get('/process-compliance-data')
  async processComplianceData() {
    return this.appService.processComplianceData();
  }
}
