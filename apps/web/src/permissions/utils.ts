/**
 * Check if the contents of an array and a set are equal.
 * @param arr array to compare
 * @param set set to compare
 * @returns whether the contents of the array and the set are equal
 */
export const isArrayEqualSet = (arr: Array<unknown>, set: Set<unknown>) =>
  arr.length === set.size && arr.every((value) => set.has(value))
