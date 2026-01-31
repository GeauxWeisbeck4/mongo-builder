/**
 * Type-safe update builder for MongoDB
 *
 * @example
 * ```ts
 * const update = updateBuilder<User>()
 *   .set('age', 30)
 *   .inc('loginCount', 1)
 *   .push('tags', 'active')
 *   .build();
 * ```
 */
export class UpdateBuilder<T extends Record<string, any>> {
  private update: Record<string, any> = {};

  /**
   * $set operator - set field values
   */
  set<K extends keyof T>(field: K, value: T[K]): this {
    if (!this.update.$set) {
      this.update.$set = {};
    }
    this.update.$set[field as string] = value;
    return this;
  }

  /**
   * Set multiple fields at once
   */
  setMany(fields: Partial<T>): this {
    if (!this.update.$set) {
      this.update.$set = {};
    }
    Object.assign(this.update.$set, fields);
    return this;
  }

  /**
   * $unset operator - remove fields
   */
  unset<K extends keyof T>(...fields: K[]): this {
    if (!this.update.$unset) {
      this.update.$unset = {};
    }
    for (const field of fields) {
      this.update.$unset[field as string] = "";
    }
    return this;
  }

  /**
   * $inc operator - increment numeric field
   */
  inc<K extends keyof T>(field: K, amount: number): this {
    if (!this.update.$inc) {
      this.update.$inc = {};
    }
    this.update.$inc[field as string] = amount;
    return this;
  }

  /**
   * $mul operator - multiply numeric field
   */
  mul<K extends keyof T>(field: K, multiplier: number): this {
    if (!this.update.$mul) {
      this.update.$mul = {};
    }
    this.update.$mul[field as string] = multiplier;
    return this;
  }

  /**
   * $min operator - update if value is less than current
   */
  min<K extends keyof T>(field: K, value: T[K]): this {
    if (!this.update.$min) {
      this.update.$min = {};
    }
    this.update.$min[field as string] = value;
    return this;
  }

  /**
   * $max operator - update if value is greater than current
   */
  max<K extends keyof T>(field: K, value: T[K]): this {
    if (!this.update.$max) {
      this.update.$max = {};
    }
    this.update.$max[field as string] = value;
    return this;
  }

  /**
   * $push operator - append to array
   */
  push<K extends keyof T>(
    field: K,
    value: any,
    modifiers?: PushModifiers,
  ): this {
    if (!this.update.$push) {
      this.update.$push = {};
    }
    this.update.$push[field as string] = modifiers
      ? { ...modifiers, $each: Array.isArray(value) ? value : [value] }
      : value;
    return this;
  }

  /**
   * $pull operator - remove from array
   */
  pull<K extends keyof T>(field: K, condition: any): this {
    if (!this.update.$pull) {
      this.update.$pull = {};
    }
    this.update.$pull[field as string] = condition;
    return this;
  }

  /**
   * $addToSet operator - add to array if not exists
   */
  addToSet<K extends keyof T>(field: K, value: any): this {
    if (!this.update.$addToSet) {
      this.update.$addToSet = {};
    }
    this.update.$addToSet[field as string] = value;
    return this;
  }

  /**
   * $pop operator - remove first or last array element
   */
  pop<K extends keyof T>(field: K, position: 1 | -1): this {
    if (!this.update.$pop) {
      this.update.$pop = {};
    }
    this.update.$pop[field as string] = position;
    return this;
  }

  /**
   * $rename operator - rename field
   */
  rename<K extends keyof T>(oldField: K, newField: string): this {
    if (!this.update.$rename) {
      this.update.$rename = {};
    }
    this.update.$rename[oldField as string] = newField;
    return this;
  }

  /**
   * $currentDate operator - set to current date
   */
  currentDate<K extends keyof T>(
    field: K,
    type: "date" | "timestamp" = "date",
  ): this {
    if (!this.update.$currentDate) {
      this.update.$currentDate = {};
    }
    this.update.$currentDate[field as string] =
      type === "timestamp" ? { $type: "timestamp" } : true;
    return this;
  }

  /**
   * Add a raw update operator
   */
  raw(operator: string, value: Record<string, any>): this {
    if (!this.update[operator]) {
      this.update[operator] = {};
    }
    Object.assign(this.update[operator], value);
    return this;
  }

  /**
   * Build and return the update document
   */
  build(): Record<string, any> {
    return this.update;
  }
}

export interface PushModifiers {
  $position?: number;
  $slice?: number;
  $sort?: 1 | -1 | Record<string, 1 | -1>;
}

/**
 * Helper to create a new update builder
 */
export function update<T extends Record<string, any>>(): UpdateBuilder<T> {
  return new UpdateBuilder<T>();
}
