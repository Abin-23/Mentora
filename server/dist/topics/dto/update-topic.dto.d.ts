import { CreateTopicDto } from './create-topic.dto';
import { CourseStatus } from '@prisma/client';
declare const UpdateTopicDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateTopicDto>>;
export declare class UpdateTopicDto extends UpdateTopicDto_base {
    status?: CourseStatus;
}
export {};
