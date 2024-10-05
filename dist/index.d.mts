import { Constraint, Submission } from '@conform-to/dom';
import { GenericSchema, GenericSchemaAsync, Config, BaseIssue, InferOutput } from 'valibot';

declare function getValibotConstraint<T extends GenericSchema | GenericSchemaAsync>(schema: T): Record<string, Constraint>;

declare function parseWithValibot<Schema extends GenericSchema>(payload: FormData | URLSearchParams, config: {
    schema: Schema | ((intent: string) => Schema);
    info?: Pick<Config<BaseIssue<unknown>>, "abortEarly" | "abortPipeEarly" | "lang">;
}): Submission<InferOutput<Schema>>;
declare function parseWithValibot<Schema extends GenericSchemaAsync>(payload: FormData | URLSearchParams, config: {
    schema: Schema | ((intent: string) => Schema);
    info?: Pick<Config<BaseIssue<unknown>>, "abortEarly" | "abortPipeEarly" | "lang">;
}): Promise<Submission<InferOutput<Schema>>>;

export { getValibotConstraint, parseWithValibot };
