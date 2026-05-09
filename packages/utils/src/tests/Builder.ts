export interface IBuilder<T> {
  with(override: Partial<T>): IBuilder<T>

  build(): T
}

export class Builder<T> implements IBuilder<T> {
  private constructor(private target: Partial<T>) {}

  /**
   * Returns a new {@link Builder} with the property {@link key} set to {@link value}.
   *
   * @param override - the override value to apply
   */
  with(override: Partial<T>): IBuilder<T> {
    const target: Partial<T> = { ...this.target, ...override }
    return new Builder<T>(target)
  }

  /**
   * Returns an instance of T with the values that were set so far
   */
  build(): T {
    return this.target as T
  }

  public static new<T>(): IBuilder<T> {
    return new Builder<T>({})
  }
}
