/**
 * Type-safe aggregation pipeline builder for MongoDB
 *
 * @example
 * ```ts
 * const pipeline = aggregate<User>()
 *   .match({ age: { $gte: 18 } })
 *   .group('_id', { count: { $sum: 1 }, avgAge: { $avg: '$age' } })
 *   .sort({ count: -1 })
 *   .limit(10)
 *   .build();
 * ```
 */
export type AggregationStage = Record<string, any>;

export class AggregationBuilder<T extends Record<string, any>> {
  private pipeline: AggregationStage[] = [];

  /**
   * $match stage - filter documents
   */
  match(filter: Partial<Record<keyof T, any>>): this {
    this.pipeline.push({ $match: filter });
    return this;
  }

  /**
   * $group stage - group documents by a field
   */
  group<K extends keyof T>(
    id: K | null | Record<string, any>,
    accumulator: Record<string, any>,
  ): this {
    const groupId =
      id === null ? null : typeof id === "object" ? id : `$${string(id)}`;
    this.pipeline.push({
      $group: {
        _id: groupId,
        ...accumulator,
      },
    });
    return this;
  }

  /**
   * $project stage - reshape documents
   */
  project(projection: Partial<Record<keyof T, 0 | 1 | any>>): this {
    this.pipeline.push({ $project: projection });
    return this;
  }

  /**
   * $sort stage - sort documents
   */
  sort(sortSpec: Partial<Record<keyof T | string, 1 | -1>>): this {
    this.pipeline.push({ $sort: sortSpec });
    return this;
  }

  /**
   * $limit stage - limit number of documents
   */
  limit(num: number): this {
    this.pipeline.push({ $limit: num });
    return this;
  }

  /**
   * $skip stage - skip number of documents
   */
  skip(num: number): this {
    this.pipeline.push({ $skip: num });
    return this;
  }

  /**
   * $unwind stage - deconstruct array field
   */
  unwind<K extends keyof T>(
    field: K,
    options?: {
      preserveNullAndEmptyArrays?: boolean;
      includeArrayIndex?: string;
    },
  ): this {
    const unwindSpec = options
      ? { path: `$${String(field)}`, ...options }
      : `$${String(field)}`;
    this.pipeline.push({ $unwind: unwindSpec });
    return this;
  }

  /**
   * $lookup stage - left outer join
   */
  lookup(
    from: string,
    localField: keyof T | string,
    foreignField: string,
    as: string,
  ): this {
    this.pipeline.push({
      $lookup: {
        from,
        localField: String(localField),
        foreignField,
        as,
      },
    });
    return this;
  }

  /**
   * $addFields stage - add new fields
   */
  addFields(fields: Record<string, any>): this {
    this.pipeline.push({ $addFields: fields });
    return this;
  }

  /**
   * $count stage - count documents
   */
  count(field = "count"): this {
    this.pipeline.push({ $count: field });
    return this;
  }

  /**
   * $facet stage - process multiple pipelines
   */
  facet(facets: Record<string, AggregationStage[]>): this {
    this.pipeline.push({ $facet: facets });
    return this;
  }

  /**
   * $bucket stage - categorize documents into buckets
   */
  bucket<K extends keyof T>(
    groupBy: K | string,
    boundaries: any[],
    options?: { default?: any; output?: Record<string, any> },
  ): this {
    this.pipeline.push({
      $bucket: {
        groupBy:
          typeof groupBy === "string" && !groupBy.startsWith("$")
            ? `$${groupBy}`
            : groupBy,
        boundaries,
        ...options,
      },
    });
    return this;
  }

  /**
   * $replaceRoot stage - replace root document
   */
  replaceRoot(newRoot: string | Record<string, any>): this {
    this.pipeline.push({
      $replaceRoot: {
        newRoot: typeof newRoot === "string" ? `$${newRoot}` : newRoot,
      },
    });
    return this;
  }

  /**
   * Add a raw aggregation stage
   */
  raw(stage: AggregationStage): this {
    this.pipeline.push(stage);
    return this;
  }

  /**
   * Build and return the aggregation pipeline
   */
  build(): AggregationStage[] {
    return this.pipeline;
  }
}

/**
 * Helper to create a new aggregation builder
 */
export function aggregate<
  T extends Record<string, any>,
>(): AggregationBuilder<T> {
  return new AggregationBuilder<T>();
}

/**
 * Common aggregation operators for use in $group stage
 */
export const Accumulators = {
  sum: (expr: string | number) => ({
    $sum: typeof expr === "string" ? `$${expr}` : expr,
  }),
  avg: (field: string) => ({ $avg: `$${field}` }),
  min: (field: string) => ({ $min: `$${field}` }),
  max: (field: string) => ({ $max: `$${field}` }),
  first: (field: string) => ({ $first: `$${field}` }),
  last: (field: string) => ({ $last: `$${field}` }),
  push: (expr: string | Record<string, any>) => ({
    $push: typeof expr === "string" ? `$${expr}` : expr,
  }),
  addToSet: (field: string) => ({ $addToSet: `$${field}` }),
  count: () => ({ $sum: 1 }),
};
