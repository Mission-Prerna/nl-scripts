import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async processModuleResultForVisitWiseStudentResult() {
    const scriptConfig: any = await this.prisma
      .$queryRaw`select visit_wise_student_result_visit_id from script_config where id=1`;
    let lastInsertedId =
      scriptConfig[0].visit_wise_student_result_visit_id ?? 0;
    const result = await this.prisma.assessment_visit_results.findMany({
      where: {
        id: {
          gt: lastInsertedId,
        },
      },
      orderBy: {
        id: 'asc',
      },
      take: 1000,
    });
    const dataToInsert = [];
    result.forEach((assessmentVisitResult) => {
      JSON.parse(assessmentVisitResult.module_result).forEach(
        (module_result) => {
          dataToInsert.push({
            visit_id: assessmentVisitResult.id,
            competency: module_result.studentResults.competency,
            current_student_count:
              module_result.studentResults.currentStudentCount,
            start_time: new Date(
              module_result.studentResults.moduleResult.startTime,
            ),
            end_time: new Date(
              module_result.studentResults.moduleResult.endTime,
            ),
            achievement: module_result.studentResults.moduleResult.achievement,
            total_questions:
              module_result.studentResults.moduleResult.totalQuestions,
            success_criteria:
              module_result.studentResults.moduleResult.success_criteria,
            view_type: module_result.viewType,
          });
        },
      );
    });
    if (result.length > 0) {
      lastInsertedId = result[result.length - 1].id;
      await this.prisma.$transaction([
        this.prisma.visit_wise_student_result.createMany({
          data: dataToInsert,
        }),
        this.prisma
          .$queryRaw`update script_config  set visit_wise_student_result_visit_id=${lastInsertedId}`,
      ]);
    }
    return result.length;
  }

  async processContinuousModuleResultForVisitWiseStudentResult() {
    let totalDataProcessed = 0;
    let totalBatchCount = 0;
    while (true) {
      totalBatchCount += 1000;
      const noOfDataProcessed =
        await this.processModuleResultForVisitWiseStudentResult();
      totalDataProcessed += noOfDataProcessed;
      if (noOfDataProcessed == 0) {
        break;
      }
    }
    return `Picking ${totalBatchCount} records, Found and Records processed: ${totalDataProcessed}`;
  }

  async processNipunMonthWiseTask() {
    const scriptConfig: any = await this.prisma
      .$queryRaw`select month_wise_performance_last_process_id from script_config where id=1`;
    const performanceLastProcessId = parseInt(
      scriptConfig[0].month_wise_performance_last_process_id ?? 0,
    );
    const result = await this.prisma.assessment_visit_results.findMany({
      where: {
        AND: [
          {
            id: {
              gt: performanceLastProcessId,
            },
          },
        ],
        NOT: [
          {
            mentor_id: null,
          },
        ],
      },
      orderBy: {
        id: 'asc',
      },
      take: 1000,
    });
    for (const assessmentVisitResult of result) {
      await this.prisma.$transaction(async (tx) => {
        for (const module_result of JSON.parse(
          assessmentVisitResult.module_result,
        )) {
          const res = module_result.studentResults.moduleResult;
          let isNipun = false;

          if (module_result.viewType === 'odk') {
            if (
              res.totalQuestions > 0 &&
              (res.achievement * 100) / res.totalQuestions >= 75
            ) {
              isNipun = true;
            }
          } else {
            if (
              module_result.studentResults.grade == 1 &&
              res.achievement >= 45
            ) {
              isNipun = true;
            } else if (
              module_result.studentResults.grade == 2 &&
              res.achievement >= 60
            ) {
              isNipun = true;
            } else if (
              module_result.studentResults.grade == 3 &&
              res.achievement >= 75
            ) {
              isNipun = true;
            }
          }
          const monthNumber =
            new Date(
              module_result.studentResults.moduleResult.startTime,
            ).getMonth() + 1;
          const scriptPerformance =
            await tx.script_performance_month_wise_report.findFirst({
              where: {
                competency: module_result.studentResults.competency,
                grade: module_result.studentResults.grade,
                month: monthNumber,
                subject: module_result.studentResults.subject,
                school_udise: module_result.studentResults.schoolsData.udise,
              },
            });
          if (scriptPerformance) {
            await tx.script_performance_month_wise_report.update({
              where: { id: scriptPerformance.id },
              data: {
                student_accessed: scriptPerformance.student_accessed + 1,
                nipun_students:
                  scriptPerformance.nipun_students + (isNipun ? 1 : 0),
              },
            });
          } else {
            await tx.script_performance_month_wise_report.create({
              data: {
                district: module_result.studentResults.schoolsData.district,
                block: module_result.studentResults.schoolsData.block,
                competency: module_result.studentResults.competency,
                subject: module_result.studentResults.subject,
                month: monthNumber,
                grade: module_result.studentResults.grade,
                school_udise: module_result.studentResults.schoolsData.udise,
                student_accessed: 1,
                nipun_students: isNipun ? 1 : 0,
              },
            });
          }
        }
        await tx.$queryRaw`update script_config  set month_wise_performance_last_process_id=${assessmentVisitResult.id}`;
      });
    }
    return result.length;
  }

  async processNipunTask() {
    const scriptConfig: any = await this.prisma
      .$queryRaw`select performance_last_process_id from script_config where id=1`;
    const performanceLastProcessId =
      scriptConfig[0].performance_last_process_id ?? 0;
    console.log(performanceLastProcessId);
    const result = await this.prisma.assessment_visit_results.findMany({
      where: {
        AND: [
          {
            id: {
              gt: performanceLastProcessId,
            },
          },
        ],
        NOT: [
          {
            mentor_id: null,
          },
        ],
      },
      orderBy: {
        id: 'asc',
      },
      take: 1000,
    });
    for (const assessmentVisitResult of result) {
      await this.prisma.$transaction(async (tx) => {
        for (const module_result of JSON.parse(
          assessmentVisitResult.module_result,
        )) {
          const res = module_result.studentResults.moduleResult;
          let isNipun = false;

          if (module_result.viewType === 'odk') {
            if (
              res.totalQuestions > 0 &&
              (res.achievement * 100) / res.totalQuestions >= 75
            ) {
              isNipun = true;
            }
          } else {
            if (
              module_result.studentResults.grade == 1 &&
              res.achievement >= 45
            ) {
              isNipun = true;
            } else if (
              module_result.studentResults.grade == 2 &&
              res.achievement >= 60
            ) {
              isNipun = true;
            } else if (
              module_result.studentResults.grade == 3 &&
              res.achievement >= 75
            ) {
              isNipun = true;
            }
          }

          const scriptPerformance =
            await tx.script_performance_report.findFirst({
              where: {
                competency: module_result.studentResults.competency,
                grade: module_result.studentResults.grade,
                subject: module_result.studentResults.subject,
                school_udise: module_result.studentResults.schoolsData.udise,
              },
            });
          console.log(scriptPerformance);
          if (scriptPerformance) {
            await tx.script_performance_report.update({
              where: { id: scriptPerformance.id },
              data: {
                student_accessed: scriptPerformance.student_accessed + 1,
                nipun_students:
                  scriptPerformance.nipun_students + (isNipun ? 1 : 0),
              },
            });
          } else {
            await tx.script_performance_report.create({
              data: {
                district: module_result.studentResults.schoolsData.district,
                block: module_result.studentResults.schoolsData.block,
                competency: module_result.studentResults.competency,
                subject: module_result.studentResults.subject,
                grade: module_result.studentResults.grade,
                school_udise: module_result.studentResults.schoolsData.udise,
                student_accessed: 1,
                nipun_students: isNipun ? 1 : 0,
              },
            });
          }
        }
        await tx.$queryRaw`update script_config  set performance_last_process_id=${assessmentVisitResult.id}`;
      });
    }
    return result.length;
  }

  async processContinuousNipunTask() {
    let totalDataProcessed = 0;
    let totalBatchCount = 0;
    while (true) {
      totalBatchCount += 1000;
      const noOfDataProcessed = await this.processNipunTask();
      totalDataProcessed += noOfDataProcessed;
      if (noOfDataProcessed == 0) {
        break;
      }
    }
    return `Picking ${totalBatchCount} records, Found and Records processed: ${totalDataProcessed}`;
  }

  async processContinuousMonthWiseNipunTask() {
    let totalDataProcessed = 0;
    let totalBatchCount = 0;
    while (true) {
      totalBatchCount += 1000;
      const noOfDataProcessed = await this.processNipunMonthWiseTask();
      totalDataProcessed += noOfDataProcessed;
      if (noOfDataProcessed == 0) {
        break;
      }
    }
    return `Picking ${totalBatchCount} records, Found and Records processed: ${totalDataProcessed}`;
  }

  async processCompetencyMapping(batchSize) {
    const componentMappings: any = await this.prisma
      .$queryRaw`select * from competency_mapping`;
    const componentMappingIdMap: any = {};
    componentMappings.forEach((componentMapping) => {
      componentMappingIdMap[
        componentMapping.grade +
          '_' +
          componentMapping.subject +
          '_' +
          componentMapping.learning_outcome
      ] = componentMapping.id;
    });
    const scriptConfig: any = await this.prisma
      .$queryRaw`select perf_create_id from script_config where id=1`;
    const lastInsertedId = scriptConfig[0].perf_create_id ?? 0;
    const result = await this.prisma.assessment_visit_results.findMany({
      where: {
        id: {
          gt: lastInsertedId,
        },
      },
      orderBy: {
        id: 'asc',
      },
      take: batchSize,
    });
    for (const assessmentVisitResult of result) {
      let isCompetencyNotFound = false;
      const dataToUpdate = [];
      JSON.parse(assessmentVisitResult.module_result).forEach(
        (module_result) => {
          const compId =
            componentMappingIdMap[
              module_result.studentResults.grade +
                '_' +
                module_result.studentResults.subject +
                '_' +
                module_result.studentResults.competency
            ];
          if (!compId) {
            isCompetencyNotFound = true;
          } else {
            module_result.studentResults['competencyId'] = compId;
            dataToUpdate.push(module_result);
          }
        },
      );
      if (!isCompetencyNotFound) {
        assessmentVisitResult.module_result = JSON.stringify(dataToUpdate);
        await this.prisma.assessment_visit_results.update({
          where: { id: assessmentVisitResult.id },
          data: {
            module_result: assessmentVisitResult.module_result,
          },
        });
        await this.prisma
          .$queryRaw`update script_config  set perf_create_id=${assessmentVisitResult.id}`;
      }
    }

    return result.length;
  }

  async processContinuousCompetencyMapping() {
    const batchSize = 1000;
    let totalDataProcessed = 0;
    let totalBatchCount = 0;
    while (true) {
      totalBatchCount += batchSize;
      const noOfDataProcessed = await this.processCompetencyMapping(batchSize);
      totalDataProcessed += noOfDataProcessed;
      if (noOfDataProcessed == 0) {
        break;
      }
    }
    return `Picking ${totalBatchCount} records, Found and Records processed: ${totalDataProcessed}`;
  }

  async processComplianceData() {
    await this.prisma
      .$queryRaw`insert into assessment_visit_result_date_map (visit_id,school_udise, timestamp, mentor_id)
select id,cast(replace(cast(module_result::json->0->'studentResults'->'schoolsData'->'udise' as text),'"','') as bigint),to_timestamp(cast(cast(module_result::json->0->'studentResults'->'moduleResult'->'startTime' as text)  as bigint)/1000)  as timestamp, mentor_id from assessment_visit_results  where mentor_id is not null and  id not in (select visit_id from assessment_visit_result_date_map)`;
    return `Query executed`;
  }
}
