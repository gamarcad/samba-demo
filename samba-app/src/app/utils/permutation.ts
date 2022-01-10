export namespace permutation {
  export interface Permutation {
    permutation: number[]
  }


  /**
   * Creates and returns a new permutation, initialized with RC4 algorithm.
   *
   * @param permutationLength
   * @param seed The seed used to create a new permutation
   *
   */
  export function CreatePermutationFromSeed(permutationLength: number, seed: number): Permutation {
    // initialize the initial list
    let permutation = []
    for (let index = 0; index < permutationLength; index++) {
      permutation[index] = index
    }

    // shuffle the list following the RC4 initialization key
    let j = 0
    for (let index = 0; index < permutationLength; index++) {
      j = (j + permutation[index] + seed) % permutationLength
      let tmp: number = permutation[j]
      permutation[j] = permutation[index]
      permutation[index] = tmp
    }


    // log permutation
    return {
      permutation: permutation
    }
  }

  /**
   * Returns a new list containing items of the given list, permuted with the given permutation.
   *
   * Example:
   *      Let p a permutation = [2, 0, 1], which means:
   *      - Item at position 0 in the entry list is put at position 2
   *      - Item at position 1 in the entry list is put at position 0
   *      - Item at position 2 in the entry list is put at position 1
   *
   * @param permutation
   * @param list
   */
  export function PermuteList(permutation: Permutation, list: any[]): any[] {
    // ensure that permutation and the list to permutate have the same length
    if (permutation.permutation.length != list.length) {
      throw new PermutationSizeError(permutation.permutation.length, list.length);
    }

    // permutes the element in another list
    let permutedList = new Array(list.length);
    for (let index = 0; index < permutation.permutation.length; index++) {
      let permutedIndex = permutation.permutation[index]
      permutedList[permutedIndex] = list[index]
    }

    return permutedList
  }

  /**
   * Returns a new list containing items of the given permuted list, reversed with the given permutation.
   *
   * Example:
   *      Let p a permutation = [2, 0, 1], which means:
   *      - Item at position 0 in the entry list is put at position 1
   *      - Item at position 1 in the entry list is put at position 2
   *      - Item at position 2 in the entry list is put at position 0
   *
   *
   *
   * @param permutation
   * @param permutedList
   */
  export function ReverseList(permutation: Permutation, permutedList: any[]): any[] {
    // ensure that permutation and the list to permutate have the same length
    if (permutation.permutation.length != permutedList.length) {
      throw new PermutationSizeError(permutation.permutation.length, permutedList.length);
    }

    // permutes the element in another list
    let list = new Array(permutedList.length);
    for (let index = 0; index < permutation.permutation.length; index++) {
      let permutedIndex = permutation.permutation[index]
      list[index] = permutedList[permutedIndex]
    }

    return list;
  }


  export class PermutationSizeError extends Error {
    constructor(expectedSize: number, gotSize: number) {
      super("Permutation cannot be applied: Expected list of size " + expectedSize + " but got list of size " + gotSize);
    }
  }
}
