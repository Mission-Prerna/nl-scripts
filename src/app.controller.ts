import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/process-nipun')
  async processNipun() {
    return this.appService.processNipunTask();
  }

  @Get('/process-visits')
  async processModuleResultForVisitWiseStudentResult() {
    return this.appService.processModuleResultForVisitWiseStudentResult();
  }
  @Get('/process-competency-mapping')
  async processCompetencyMapping() {
    return this.appService.processCompetencyMapping();
  }

  @Get('/process-compliance-data')
  async processComplianceData() {
    return this.appService.processComplianceData();
  }
}
