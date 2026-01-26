import {
  isAddressFieldType,
  isArrayFieldType,
  isArrayOfStringsFieldType,
  isBooleanFieldType,
  isBytesFieldType,
  isFixedFieldType,
  isFunctionFieldType,
  isIntFieldType,
  isMatrixFieldType,
  isMatrixOfStringsFieldType,
  isMultiDimensionalArrayFieldType,
  isMultiDimensionalArrayOfStringsFieldType,
  isStringFieldType,
  isTupleFieldType,
} from './fields'

describe('solidity field types', () => {
  describe('Integer field types', () => {
    it('int<M> field type', () => {
      // valid int field type values
      expect(isIntFieldType('int')).toBe(true)
      expect(isIntFieldType('int8')).toBe(true)
      expect(isIntFieldType('int16')).toBe(true)
      expect(isIntFieldType('int24')).toBe(true)
      expect(isIntFieldType('int32')).toBe(true)
      expect(isIntFieldType('int40')).toBe(true)
      expect(isIntFieldType('int48')).toBe(true)
      expect(isIntFieldType('int56')).toBe(true)
      expect(isIntFieldType('int64')).toBe(true)
      expect(isIntFieldType('int72')).toBe(true)
      expect(isIntFieldType('int80')).toBe(true)
      expect(isIntFieldType('int88')).toBe(true)
      expect(isIntFieldType('int96')).toBe(true)
      expect(isIntFieldType('int104')).toBe(true)
      expect(isIntFieldType('int112')).toBe(true)
      expect(isIntFieldType('int120')).toBe(true)
      expect(isIntFieldType('int128')).toBe(true)
      expect(isIntFieldType('int136')).toBe(true)
      expect(isIntFieldType('int144')).toBe(true)
      expect(isIntFieldType('int152')).toBe(true)
      expect(isIntFieldType('int160')).toBe(true)
      expect(isIntFieldType('int168')).toBe(true)
      expect(isIntFieldType('int176')).toBe(true)
      expect(isIntFieldType('int184')).toBe(true)
      expect(isIntFieldType('int192')).toBe(true)
      expect(isIntFieldType('int200')).toBe(true)
      expect(isIntFieldType('int208')).toBe(true)
      expect(isIntFieldType('int216')).toBe(true)
      expect(isIntFieldType('int224')).toBe(true)
      expect(isIntFieldType('int232')).toBe(true)
      expect(isIntFieldType('int240')).toBe(true)
      expect(isIntFieldType('int248')).toBe(true)
      expect(isIntFieldType('int256')).toBe(true)

      // invalid int field type values
      expect(isIntFieldType('int242')).toBe(false)
      expect(isIntFieldType('23int24')).toBe(false)
      expect(isIntFieldType('inta24')).toBe(false)
      expect(isIntFieldType('int12')).toBe(false)
      expect(isIntFieldType('INT')).toBe(false)
      expect(isIntFieldType('int[]')).toBe(false)
      expect(isIntFieldType('int256[]')).toBe(false)
      expect(isIntFieldType('Int')).toBe(false)
      expect(isIntFieldType('int264')).toBe(false)
    })

    it('uint<M> field type', () => {
      // valid uint field type values
      expect(isIntFieldType('uint')).toBe(true)
      expect(isIntFieldType('uint8')).toBe(true)
      expect(isIntFieldType('uint16')).toBe(true)
      expect(isIntFieldType('uint24')).toBe(true)
      expect(isIntFieldType('uint32')).toBe(true)
      expect(isIntFieldType('uint40')).toBe(true)
      expect(isIntFieldType('uint48')).toBe(true)
      expect(isIntFieldType('uint56')).toBe(true)
      expect(isIntFieldType('uint64')).toBe(true)
      expect(isIntFieldType('uint72')).toBe(true)
      expect(isIntFieldType('uint80')).toBe(true)
      expect(isIntFieldType('uint88')).toBe(true)
      expect(isIntFieldType('uint96')).toBe(true)
      expect(isIntFieldType('uint104')).toBe(true)
      expect(isIntFieldType('uint112')).toBe(true)
      expect(isIntFieldType('uint120')).toBe(true)
      expect(isIntFieldType('uint128')).toBe(true)
      expect(isIntFieldType('uint136')).toBe(true)
      expect(isIntFieldType('uint144')).toBe(true)
      expect(isIntFieldType('uint152')).toBe(true)
      expect(isIntFieldType('uint160')).toBe(true)
      expect(isIntFieldType('uint168')).toBe(true)
      expect(isIntFieldType('uint176')).toBe(true)
      expect(isIntFieldType('uint184')).toBe(true)
      expect(isIntFieldType('uint192')).toBe(true)
      expect(isIntFieldType('uint200')).toBe(true)
      expect(isIntFieldType('uint208')).toBe(true)
      expect(isIntFieldType('uint216')).toBe(true)
      expect(isIntFieldType('uint224')).toBe(true)
      expect(isIntFieldType('uint232')).toBe(true)
      expect(isIntFieldType('uint240')).toBe(true)
      expect(isIntFieldType('uint248')).toBe(true)
      expect(isIntFieldType('uint256')).toBe(true)

      // invalid uint field type values
      expect(isIntFieldType('uint242')).toBe(false)
      expect(isIntFieldType('UINT')).toBe(false)
      expect(isIntFieldType('U_INT')).toBe(false)
      expect(isIntFieldType('23uint24')).toBe(false)
      expect(isIntFieldType('uint[]')).toBe(false)
      expect(isIntFieldType('uint256[]')).toBe(false)
      expect(isIntFieldType('u3inta24')).toBe(false)
      expect(isIntFieldType('uint12')).toBe(false)
      expect(isIntFieldType('uint264')).toBe(false)
    })
  })

  describe('Address field type', () => {
    it('address field type', () => {
      // valid address field type values
      expect(isAddressFieldType('address')).toBe(true)

      // invalid address field type values
      expect(isAddressFieldType('Address')).toBe(false)
      expect(isAddressFieldType('sdaddresss')).toBe(false)
      expect(isAddressFieldType('address[]')).toBe(false)
      expect(isAddressFieldType('int')).toBe(false)
    })
  })

  describe('Boolean field type', () => {
    it('bool field type', () => {
      // valid Bool field type values
      expect(isBooleanFieldType('bool')).toBe(true)

      // invalid Bool field type values
      expect(isBooleanFieldType('Bool')).toBe(false)
      expect(isBooleanFieldType('sdBools')).toBe(false)
      expect(isBooleanFieldType('bool[]')).toBe(false)
      expect(isBooleanFieldType('int')).toBe(false)
    })
  })

  describe('Bytes field type', () => {
    it('bytes field type', () => {
      // valid Bytes field type values
      expect(isBytesFieldType('bytes')).toBe(true)
      expect(isBytesFieldType('bytes1')).toBe(true)
      expect(isBytesFieldType('bytes2')).toBe(true)
      expect(isBytesFieldType('bytes3')).toBe(true)
      expect(isBytesFieldType('bytes4')).toBe(true)
      expect(isBytesFieldType('bytes5')).toBe(true)
      expect(isBytesFieldType('bytes6')).toBe(true)
      expect(isBytesFieldType('bytes7')).toBe(true)
      expect(isBytesFieldType('bytes8')).toBe(true)
      expect(isBytesFieldType('bytes9')).toBe(true)
      expect(isBytesFieldType('bytes10')).toBe(true)
      expect(isBytesFieldType('bytes11')).toBe(true)
      expect(isBytesFieldType('bytes12')).toBe(true)
      expect(isBytesFieldType('bytes13')).toBe(true)
      expect(isBytesFieldType('bytes14')).toBe(true)
      expect(isBytesFieldType('bytes15')).toBe(true)
      expect(isBytesFieldType('bytes16')).toBe(true)
      expect(isBytesFieldType('bytes17')).toBe(true)
      expect(isBytesFieldType('bytes18')).toBe(true)
      expect(isBytesFieldType('bytes19')).toBe(true)
      expect(isBytesFieldType('bytes20')).toBe(true)
      expect(isBytesFieldType('bytes21')).toBe(true)
      expect(isBytesFieldType('bytes22')).toBe(true)
      expect(isBytesFieldType('bytes23')).toBe(true)
      expect(isBytesFieldType('bytes24')).toBe(true)
      expect(isBytesFieldType('bytes25')).toBe(true)
      expect(isBytesFieldType('bytes26')).toBe(true)
      expect(isBytesFieldType('bytes27')).toBe(true)
      expect(isBytesFieldType('bytes28')).toBe(true)
      expect(isBytesFieldType('bytes29')).toBe(true)
      expect(isBytesFieldType('bytes30')).toBe(true)
      expect(isBytesFieldType('bytes31')).toBe(true)
      expect(isBytesFieldType('bytes32')).toBe(true)

      // invalid Bytes field type values
      expect(isBytesFieldType('Bytes')).toBe(false)
      expect(isBytesFieldType('bytes0')).toBe(false)
      expect(isBytesFieldType('bytes33')).toBe(false)
      expect(isBytesFieldType('bytes2333')).toBe(false)
      expect(isBytesFieldType('ubytes')).toBe(false)
      expect(isBytesFieldType('bytes[]')).toBe(false)
      expect(isBytesFieldType('int')).toBe(false)
    })

    describe('String field type', () => {
      it('string field type', () => {
        // valid String field type values
        expect(isStringFieldType('string')).toBe(true)

        // invalid String field type values
        expect(isStringFieldType('String')).toBe(false)
        expect(isStringFieldType('STRING')).toBe(false)
        expect(isStringFieldType('string[]')).toBe(false)
        expect(isStringFieldType('int')).toBe(false)
      })
    })

    describe('Function field type', () => {
      it('function field type', () => {
        // valid function field type values
        expect(isFunctionFieldType('function')).toBe(true)

        // invalid function field type values
        expect(isFunctionFieldType('Function')).toBe(false)
        expect(isFunctionFieldType('FUNCTION')).toBe(false)
        expect(isFunctionFieldType('function[]')).toBe(false)
        expect(isFunctionFieldType('int')).toBe(false)
      })
    })

    describe('Fixed field type', () => {
      it('ufixed<M>x<N> or fixed<M>x<N> field type', () => {
        // valid fixed and ufixed field type values
        expect(isFixedFieldType('ufixed')).toBe(true)
        expect(isFixedFieldType('fixed')).toBe(true)
        expect(isFixedFieldType('ufixed256x80')).toBe(true)
        expect(isFixedFieldType('fixed256x80')).toBe(true)
        expect(isFixedFieldType('ufixed56x20')).toBe(true)
        expect(isFixedFieldType('fixed56x20')).toBe(true)

        // invalid fixed and ufixed field type values
        expect(isFixedFieldType('fixed256x81')).toBe(false)
        expect(isFixedFieldType('ufixed256x81')).toBe(false)
        expect(isFixedFieldType('fixed257x80')).toBe(false)
        expect(isFixedFieldType('ufixed257x80')).toBe(false)
        expect(isFixedFieldType('fixed256x0')).toBe(false)
        expect(isFixedFieldType('ufixed256x0')).toBe(false)
        expect(isFixedFieldType('fixed256')).toBe(false)
        expect(isFixedFieldType('ufixed256')).toBe(false)
      })
    })

    describe('Array field type', () => {
      it('variable-length Array <type>[]', () => {
        // valid variable-length array field type values
        expect(isArrayFieldType('int[]')).toBe(true)
        expect(isArrayFieldType('uint[]')).toBe(true)
        expect(isArrayFieldType('fixed[]')).toBe(true)
        expect(isArrayFieldType('ufixed[]')).toBe(true)
        expect(isArrayFieldType('address[]')).toBe(true)
        expect(isArrayFieldType('string[]')).toBe(true)
        expect(isArrayFieldType('byte[]')).toBe(true)

        // invalid variable-length array field type values
        expect(isArrayFieldType('int[][2]')).toBe(false)
        expect(isArrayFieldType('int[][]')).toBe(false)
        expect(isArrayFieldType('int[2][]')).toBe(false)
        expect(isArrayFieldType('int[2][2]')).toBe(false)
        expect(isArrayFieldType('int[2][2][]')).toBe(false)
        expect(isArrayFieldType('int[2][2][2]')).toBe(false)
        expect(isArrayFieldType('int[2][2][2][]')).toBe(false)
        expect(isArrayFieldType('int[][][][]')).toBe(false)
      })

      it('fixed-length Array <type>[]', () => {
        // valid fixed-length array field type values
        expect(isArrayFieldType('int[3]')).toBe(true)
        expect(isArrayFieldType('uint[3]')).toBe(true)
        expect(isArrayFieldType('fixed[4]')).toBe(true)
        expect(isArrayFieldType('ufixed[5]')).toBe(true)
        expect(isArrayFieldType('address[6]')).toBe(true)
        expect(isArrayFieldType('string[2]')).toBe(true)
        expect(isArrayFieldType('byte[4]')).toBe(true)

        // invalid fixed-length array field type values
        expect(isArrayFieldType('int[size]')).toBe(false)
        expect(isArrayFieldType('int[-3]')).toBe(false)
        expect(isArrayFieldType('int[][2]')).toBe(false)
        expect(isArrayFieldType('int[][]')).toBe(false)
        expect(isArrayFieldType('int[2][]')).toBe(false)
        expect(isArrayFieldType('int[2][2]')).toBe(false)
        expect(isArrayFieldType('int[2][2][]')).toBe(false)
        expect(isArrayFieldType('int[2][2][2]')).toBe(false)
        expect(isArrayFieldType('int[2][2][2][]')).toBe(false)
        expect(isArrayFieldType('int[][][][]')).toBe(false)
        expect(isArrayFieldType('int')).toBe(false)
      })
    })

    describe('Matrix field type', () => {
      it('matrix <type>[][] <type>[size][] <type>[][size] <type>[size][size]', () => {
        // valid matrix field type values
        expect(isMatrixFieldType('int[][]')).toBe(true)
        expect(isMatrixFieldType('int[][2]')).toBe(true)
        expect(isMatrixFieldType('int[3][]')).toBe(true)
        expect(isMatrixFieldType('int[4][3]')).toBe(true)

        // invalid matrix field type values
        expect(isMatrixFieldType('int[-1][-2]')).toBe(false)
        expect(isMatrixFieldType('int[-1][2]')).toBe(false)
        expect(isMatrixFieldType('int[][-2]')).toBe(false)
        expect(isMatrixFieldType('int[][][]')).toBe(false)
        expect(isMatrixFieldType('int[2][][2]')).toBe(false)
        expect(isMatrixFieldType('int[][][2]')).toBe(false)
        expect(isMatrixFieldType('int[][][2]')).toBe(false)
        expect(isMatrixFieldType('int[]')).toBe(false)
        expect(isMatrixFieldType('int')).toBe(false)
        expect(isMatrixFieldType('int[2]')).toBe(false)
      })
    })

    describe('MultiDimensional Array field type', () => {
      it('multiDimensional array <type>[][][][]...,  <type>[size][][size][][]...,  <type>[size][size][size][size]...', () => {
        // valid multiDimensional array field type values
        expect(isMultiDimensionalArrayFieldType('int[][][]')).toBe(true)
        expect(isMultiDimensionalArrayFieldType('int[][][][]')).toBe(true)
        expect(isMultiDimensionalArrayFieldType('int[][2][]')).toBe(true)
        expect(isMultiDimensionalArrayFieldType('int[][2][][4]')).toBe(true)
        expect(isMultiDimensionalArrayFieldType('int[3][3][3]')).toBe(true)
        expect(isMultiDimensionalArrayFieldType('int[3][3][3][3]')).toBe(true)
        expect(isMultiDimensionalArrayFieldType('int[][][][][][][][][][][][][]')).toBe(true)
        expect(isMultiDimensionalArrayFieldType('int[3][3][][][][][][3][3][][][][]')).toBe(true)
        expect(isMultiDimensionalArrayFieldType('int[3][3][3][3][3][3][3][3][3]')).toBe(true)

        // invalid  multiDimensional array field type values
        expect(isMultiDimensionalArrayFieldType('int[-1][-2]')).toBe(false)
        expect(isMultiDimensionalArrayFieldType('int[][]')).toBe(false)
        expect(isMultiDimensionalArrayFieldType('int[3][-3][3]')).toBe(false)
        expect(isMultiDimensionalArrayFieldType('int[3-][3][3]')).toBe(false)
        expect(isMultiDimensionalArrayFieldType('int[]')).toBe(false)
        expect(isMultiDimensionalArrayFieldType('int')).toBe(false)
        expect(isMultiDimensionalArrayFieldType('int[][3][][3][][[[[[[[]][][][][]')).toBe(false)
        expect(isMultiDimensionalArrayFieldType('int[3][3][][][][][[[[]]]4[[[]][][][]')).toBe(false)
        expect(isMultiDimensionalArrayFieldType('int[3][][][3][3][][[[[]]][[[]][][][]')).toBe(false)
        expect(isMultiDimensionalArrayFieldType('int]]][[]')).toBe(false)
        expect(isMultiDimensionalArrayFieldType('int][][]]]][][][]')).toBe(false)
      })
    })

    describe('isArrayOfStringsFieldType', () => {
      it('returns true if its an array of strings field type', () => {
        expect(isArrayOfStringsFieldType('string')).toBe(false)
        expect(isArrayOfStringsFieldType('string[]')).toBe(true)
        expect(isArrayOfStringsFieldType('string[2]')).toBe(true)
        expect(isArrayOfStringsFieldType('bytes[2]')).toBe(false)
        expect(isArrayOfStringsFieldType('string[][]')).toBe(false)
        expect(isArrayOfStringsFieldType('string[][3]')).toBe(false)
        expect(isArrayOfStringsFieldType('string[2][]')).toBe(false)
        expect(isArrayOfStringsFieldType('string[3][2]')).toBe(false)
        expect(isArrayOfStringsFieldType('string[][][]')).toBe(false)
        expect(isArrayOfStringsFieldType('string[][1][]')).toBe(false)
        expect(isArrayOfStringsFieldType('string[2][1][2]')).toBe(false)
        expect(isArrayOfStringsFieldType('string[][][][][][][]')).toBe(false)
        expect(isArrayOfStringsFieldType('string[1][][][2][][][][3][2][2][]')).toBe(false)
        expect(isArrayOfStringsFieldType('string[1][2][1][2][3][2][2]')).toBe(false)
      })
    })

    describe('isMatrixOfStringsFieldType', () => {
      it('returns true if its a matrix of strings field type', () => {
        expect(isMatrixOfStringsFieldType('string')).toBe(false)
        expect(isMatrixOfStringsFieldType('string[]')).toBe(false)
        expect(isMatrixOfStringsFieldType('string[2]')).toBe(false)
        expect(isMatrixOfStringsFieldType('string[][]')).toBe(true)
        expect(isMatrixOfStringsFieldType('string[][3]')).toBe(true)
        expect(isMatrixOfStringsFieldType('string[2][]')).toBe(true)
        expect(isMatrixOfStringsFieldType('string[3][2]')).toBe(true)
        expect(isMatrixOfStringsFieldType('int[3][2]')).toBe(false)
        expect(isMatrixOfStringsFieldType('string[][][]')).toBe(false)
        expect(isMatrixOfStringsFieldType('string[][1][]')).toBe(false)
        expect(isMatrixOfStringsFieldType('string[2][1][2]')).toBe(false)
        expect(isMatrixOfStringsFieldType('string[][][][][][][]')).toBe(false)
        expect(isMatrixOfStringsFieldType('string[1][][][2][][][][3][2][2][]')).toBe(false)
        expect(isMatrixOfStringsFieldType('string[1][2][1][2][3][2][2]')).toBe(false)
      })
    })

    describe('isMultiDimensionalArrayOfStringsFieldType', () => {
      it('returns true if its a multidimensional array of strings field type', () => {
        expect(isMultiDimensionalArrayOfStringsFieldType('string')).toBe(false)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[]')).toBe(false)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[2]')).toBe(false)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[][]')).toBe(false)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[][3]')).toBe(false)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[2][]')).toBe(false)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[3][2]')).toBe(false)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[][][]')).toBe(true)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[][1][]')).toBe(true)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[2][1][2]')).toBe(true)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[][][][][][][]')).toBe(true)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[1][][][2][]')).toBe(true)
        expect(isMultiDimensionalArrayOfStringsFieldType('string[1][2][1][2][3][2][2]')).toBe(true)
        expect(isMultiDimensionalArrayOfStringsFieldType('int[1][2][1][2][3][2][2]')).toBe(false)
      })
    })

    describe('Tuple field type', () => {
      it('tuple', () => {
        // valid tuple field type values
        expect(isTupleFieldType('tuple')).toBe(true)
        expect(isTupleFieldType('tuple[]')).toBe(true)
        expect(isTupleFieldType('tuple(uint256)')).toBe(true)
        expect(isTupleFieldType('tuple(uint256)[]')).toBe(true)
        expect(isTupleFieldType('tuple(uint256,uint256[],tuple(uint256,uint256,tuple(uint256,uint256))[])')).toBe(true)
      })
    })
  })
})
