import {
  encodeToHexData,
  getBaseFieldType,
  getInputTypeHelper,
  getNumberOfBits,
  isArray,
  parseBooleanValue,
  parseInputValue,
  parseIntValue,
  parseStringToArray,
  SoliditySyntaxError,
} from './utils'

// Helper to generate expected padded decimal string for integer values
// This is what parseIntValue should return: decimal string, zero-padded for positive numbers
const padDecimal = (decimalStr: string, bits: number): string => {
  const isNegative = decimalStr.startsWith('-')
  if (isNegative) return decimalStr // Negative numbers are not padded
  return decimalStr.padStart(Math.ceil(bits / 4), '0')
}

// Helper to convert hex string (with or without 0x prefix, positive or negative) to decimal and pad
const hexToDecimalPadded = (hex: string, bits: number): string => {
  const isNegative = hex.startsWith('-')
  const absHex = isNegative ? hex.slice(1) : hex
  const cleanHex = absHex.startsWith('0x') ? absHex : '0x' + absHex
  const decimal = BigInt(cleanHex).toString(10)
  return isNegative ? '-' + decimal : padDecimal(decimal, bits)
}

describe('util functions', () => {
  describe('parseInputValue', () => {
    describe('integer values', () => {
      describe('int values', () => {
        it('parse a valid positive int to string', () => {
          const parsedValue = parseInputValue('int', '1')

          // 256-bit int padded to 64 chars
          expect(parsedValue).toEqual(padDecimal('1', 256))
        })

        it('parse a valid negative int to string', () => {
          const parsedValue = parseInputValue('int', '-1')

          // Negative numbers are not padded
          expect(parsedValue).toEqual('-1')
        })

        it('parse a valid long number to string', () => {
          const parsedValue = parseInputValue('int', '6426191757410075707')

          expect(parsedValue).toEqual(padDecimal('6426191757410075707', 256))
        })

        it('parse a valid negative long number to string', () => {
          const parsedValue = parseInputValue('int', '-6426191757410075707')

          expect(parsedValue).toEqual('-6426191757410075707')
        })

        it('parse a valid hexadecimal value to string', () => {
          const parsedValue = parseInputValue('int', 'aaaaffff')

          // Hex without 0x prefix is converted to decimal
          expect(parsedValue).toEqual(hexToDecimalPadded('aaaaffff', 256))
        })
      })

      describe('uint values', () => {
        it('parse a valid positive uint to string', () => {
          const parsedValue = parseInputValue('uint', '1')

          expect(parsedValue).toEqual(padDecimal('1', 256))
        })

        it('parse a negative uint to string', () => {
          const parsedValue = parseInputValue('uint', '-1')

          // Note: parseIntValue allows negatives (validation happens elsewhere)
          expect(parsedValue).toEqual('-1')
        })

        it('parse a valid long number to string', () => {
          const parsedValue = parseInputValue('uint', '6426191757410075707')

          expect(parsedValue).toEqual(padDecimal('6426191757410075707', 256))
        })

        it('parse a negative long number to string', () => {
          const parsedValue = parseInputValue('uint', '-6426191757410075707')

          expect(parsedValue).toEqual('-6426191757410075707')
        })

        it('parse a valid hexadecimal value to string', () => {
          const parsedValue = parseInputValue('uint', '0xaaaaffff')

          expect(parsedValue).toEqual(hexToDecimalPadded('0xaaaaffff', 256))
        })
      })

      describe('uintX and intX values', () => {
        it('parse a valid positive fixed size uint and int values to BN', () => {
          // uint256
          expect(parseInputValue('uint256', '1')).toEqual(padDecimal('1', 256))

          // int256
          expect(parseInputValue('int256', '1')).toEqual(padDecimal('1', 256))

          // uint8
          expect(parseInputValue('uint8', '1')).toEqual(padDecimal('1', 8))

          // int8
          expect(parseInputValue('int8', '1')).toEqual(padDecimal('1', 8))

          // uint64
          expect(parseInputValue('uint64', '1')).toEqual(padDecimal('1', 64))

          // int64
          expect(parseInputValue('int64', '1')).toEqual(padDecimal('1', 64))

          // uint120
          expect(parseInputValue('uint120', '1')).toEqual(padDecimal('1', 120))

          // int120
          expect(parseInputValue('int120', '1')).toEqual(padDecimal('1', 120))
        })
      })
    })

    describe('boolean values', () => {
      it('parse a valid "true" string to boolean', () => {
        const parsedValue = parseInputValue('bool', 'true')

        expect(parsedValue).toBe(true)
      })

      it('parse a valid "True" string to boolean', () => {
        const parsedValue = parseInputValue('bool', 'True')

        expect(parsedValue).toBe(true)
      })

      it('parse a valid "TRUE" string to boolean', () => {
        const parsedValue = parseInputValue('bool', 'TRUE')

        expect(parsedValue).toBe(true)
      })

      it('parse a valid "1" string to boolean', () => {
        const parsedValue = parseInputValue('bool', '1')

        expect(parsedValue).toBe(true)
      })

      it('parse a valid "false" string to boolean', () => {
        const parsedValue = parseInputValue('bool', 'false')

        expect(parsedValue).toBe(false)
      })

      it('parse a valid "False" string to boolean', () => {
        const parsedValue = parseInputValue('bool', 'False')

        expect(parsedValue).toBe(false)
      })

      it('parse a valid "FALSE" string to boolean', () => {
        const parsedValue = parseInputValue('bool', 'FALSE')

        expect(parsedValue).toBe(false)
      })

      it('parse a valid "0" string to boolean', () => {
        const parsedValue = parseInputValue('bool', '0')

        expect(parsedValue).toBe(false)
      })

      it('parse an invalid boolean "invalid_bool_value" string to boolean', () => {
        expect(() => parseInputValue('bool', 'invalid_bool_value')).toThrow(SoliditySyntaxError)
      })
    })

    describe('address values', () => {
      it('valid address', () => {
        const parsedValue = parseInputValue('address', '0x680cde08860141F9D223cE4E620B10Cd6741037E')

        expect(parsedValue).toBe('0x680cde08860141F9D223cE4E620B10Cd6741037E')
      })

      it('invalid address', () => {
        const parsedValue = parseInputValue('address', 'INVALID_ADDRESS')

        expect(parsedValue).toBe('INVALID_ADDRESS')
      })
    })

    describe('bytes values', () => {
      it('for valid bytes', () => {
        const parsedValue = parseInputValue('bytes', '0x00000111111')

        expect(parsedValue).toBe('0x00000111111')
      })

      it('invalid bytes', () => {
        const parsedValue = parseInputValue('bytes', 'INVALID_BYTES')

        expect(parsedValue).toBe('INVALID_BYTES')
      })
    })

    describe('string values', () => {
      it('parse valid string', () => {
        const parsedValue = parseInputValue('string', 'Hello World!')

        expect(parsedValue).toBe('Hello World!')
      })

      it('parse valid empty string', () => {
        const parsedValue = parseInputValue('string', '')

        expect(parsedValue).toBe('')
      })

      it('parse special chars as valid', () => {
        const parsedValue = parseInputValue('string', "'special chars like % &/()$%,.ñ'")

        expect(parsedValue).toBe("'special chars like % &/()$%,.ñ'")
      })
    })

    describe('bool[] & bool[size] values', () => {
      it('parse a valid truthy values to variable-length array of booleans', () => {
        const parsedValue = parseInputValue('bool[]', '[true, "true", "True", "TRUE", 1]')

        expect(parsedValue).toEqual([true, true, true, true, true])
      })

      it('parse a valid truthy values to fixed-length array of booleans', () => {
        const parsedValue = parseInputValue('bool[5]', '[true, "true", "True", "TRUE", 1]')

        expect(parsedValue).toEqual([true, true, true, true, true])
      })

      it('parse a valid falsy values to variable-length array of booleans', () => {
        const parsedValue = parseInputValue('bool[]', '[false, "false", "False", "FALSE", 0]')

        expect(parsedValue).toEqual([false, false, false, false, false])
      })

      it('parse a valid falsy values to fixed-length array of booleans', () => {
        const parsedValue = parseInputValue('bool[5]', '[false, "false", "False", "FALSE", 0]')

        expect(parsedValue).toEqual([false, false, false, false, false])
      })

      it('parse empty array', () => {
        const parsedValue = parseInputValue('bool[]', '[]')

        expect(parsedValue).toEqual([])
      })

      it('throws an error for invalid array value', () => {
        expect(() => parseInputValue('bool[]', 'INVALID ARRAY')).toThrow(SoliditySyntaxError)
      })

      it('throws an error for an array of invalid values', () => {
        expect(() => parseInputValue('bool[]', '[invalid_bool_value]')).toThrow(SoliditySyntaxError)
      })

      it('throws an error for an array of invalid strings', () => {
        expect(() => parseInputValue('bool[]', '["invalid_bool_value"]')).toThrow(SoliditySyntaxError)
      })
    })

    describe('int[], uint, int[size] & uint[size] values', () => {
      describe(' int[] & int[size]', () => {
        it('parse an array of numbers to array of strings', () => {
          expect(parseInputValue('int[]', '[1]')).toEqual([padDecimal('1', 256)])
          expect(parseInputValue('int[2]', '[1, 1]')).toEqual([padDecimal('1', 256), padDecimal('1', 256)])

          expect(parseInputValue('int64[]', '[1]')).toEqual([padDecimal('1', 64)])
          expect(parseInputValue('int64[2]', '[1, 1]')).toEqual([padDecimal('1', 64), padDecimal('1', 64)])
        })

        it('parse an array of numbers as strings to array of strings', () => {
          expect(parseInputValue('int[]', '["1"]')).toEqual([padDecimal('1', 256)])
          expect(parseInputValue('int[2]', '["1", "1"]')).toEqual([padDecimal('1', 256), padDecimal('1', 256)])

          expect(parseInputValue('int64[]', '["1"]')).toEqual([padDecimal('1', 64)])
          expect(parseInputValue('int64[2]', '["1", "1"]')).toEqual([padDecimal('1', 64), padDecimal('1', 64)])
        })

        it('parse an array of long numbers to array of strings', () => {
          expect(parseInputValue('int[]', '[6426191757410075707]')).toEqual([padDecimal('6426191757410075707', 256)])
          expect(parseInputValue('int[1]', '[6426191757410075707]')).toEqual([padDecimal('6426191757410075707', 256)])

          expect(parseInputValue('int120[]', '[6426191757410075707]')).toEqual([padDecimal('6426191757410075707', 120)])
          expect(parseInputValue('int120[1]', '[6426191757410075707]')).toEqual([
            padDecimal('6426191757410075707', 120),
          ])
        })

        it('parse an array of long numbers as strings to array of strings', () => {
          expect(parseInputValue('int[]', '["6426191757410075707"]')).toEqual([padDecimal('6426191757410075707', 256)])
          expect(parseInputValue('int[1]', '["6426191757410075707"]')).toEqual([padDecimal('6426191757410075707', 256)])

          expect(parseInputValue('int120[]', '["6426191757410075707"]')).toEqual([
            padDecimal('6426191757410075707', 120),
          ])
          expect(parseInputValue('int120[1]', '["6426191757410075707"]')).toEqual([
            padDecimal('6426191757410075707', 120),
          ])
        })

        it('parse an empty array as valid value', () => {
          expect(parseInputValue('int[]', '[]')).toEqual([])
          expect(parseInputValue('int[2]', '[]')).toEqual([])

          expect(parseInputValue('int120[]', '[]')).toEqual([])
          expect(parseInputValue('int120[2]', '[]')).toEqual([])
        })

        it('parse an invalid array throws a SoliditySyntaxError', () => {
          expect(() => parseInputValue('int[]', 'invalid_array')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('int[]', '6426191757410075707')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('int[3]', 'invalid_array')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('int[3]', '6426191757410075707')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('int120[]', 'invalid_array')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('int120[]', '6426191757410075707')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('int120[3]', 'invalid_array')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('int120[3]', '6426191757410075707')).toThrow(SoliditySyntaxError)
        })

        it('parse an array with invalid values throws a Error', () => {
          expect(() => parseInputValue('int[]', '[invalid_array_value]')).toThrow(Error)
          expect(() => parseInputValue('int[2]', '[invalid_array_value]')).toThrow(Error)
          expect(() => parseInputValue('int120[]', '[invalid_array_value]')).toThrow(Error)
          expect(() => parseInputValue('int120[2]', '[invalid_array_value]')).toThrow(Error)
        })

        it('parse valid negative numbers', () => {
          expect(parseInputValue('int[]', '[-1]')).toEqual([padDecimal('-1', 256)])
          expect(parseInputValue('int[2]', '[-1,  -2]')).toEqual([padDecimal('-1', 256), padDecimal('-2', 256)])
          expect(parseInputValue('int120[]', '[-1]')).toEqual([padDecimal('-1', 120)])
          expect(parseInputValue('int120[2]', '[-1,  -2]')).toEqual([padDecimal('-1', 120), padDecimal('-2', 120)])

          // negative numbers as strings
          expect(parseInputValue('int[]', '["-1"]')).toEqual([padDecimal('-1', 256)])
          expect(parseInputValue('int[2]', '["-1",  "-1"]')).toEqual([padDecimal('-1', 256), padDecimal('-1', 256)])
          expect(parseInputValue('int[2]', '["-1", -1]')).toEqual([padDecimal('-1', 256), padDecimal('-1', 256)])
          expect(parseInputValue('int120[]', '["-1"]')).toEqual([padDecimal('-1', 120)])
          expect(parseInputValue('int120[2]', '["-1",  "-1"]')).toEqual([padDecimal('-1', 120), padDecimal('-1', 120)])
          expect(parseInputValue('int120[2]', '["-1", -1]')).toEqual([padDecimal('-1', 120), padDecimal('-1', 120)])

          // long negative numbers
          expect(parseInputValue('int[]', '[-6426191757410075707]')).toEqual([padDecimal('-6426191757410075707', 256)])
          expect(parseInputValue('int[2]', '[-6426191757410075707,  -6426191757410075707]')).toEqual([
            padDecimal('-6426191757410075707', 256),
            padDecimal('-6426191757410075707', 256),
          ])
          expect(parseInputValue('int120[]', '[-6426191757410075707]')).toEqual([
            padDecimal('-6426191757410075707', 120),
          ])
          expect(parseInputValue('int120[2]', '[-6426191757410075707,  -6426191757410075707]')).toEqual([
            padDecimal('-6426191757410075707', 120),
            padDecimal('-6426191757410075707', 120),
          ])

          // negative numbers as strings
          expect(parseInputValue('int[]', '["-6426191757410075707"]')).toEqual([
            padDecimal('-6426191757410075707', 256),
          ])
          expect(parseInputValue('int[2]', '["-6426191757410075707",  "-6426191757410075707"]')).toEqual([
            padDecimal('-6426191757410075707', 256),
            padDecimal('-6426191757410075707', 256),
          ])
          expect(parseInputValue('int[2]', '["-6426191757410075707", -6426191757410075707]')).toEqual([
            padDecimal('-6426191757410075707', 256),
            padDecimal('-6426191757410075707', 256),
          ])
          expect(parseInputValue('int120[]', '["-6426191757410075707"]')).toEqual([
            padDecimal('-6426191757410075707', 120),
          ])
          expect(parseInputValue('int120[2]', '["-6426191757410075707",  "-6426191757410075707"]')).toEqual([
            padDecimal('-6426191757410075707', 120),
            padDecimal('-6426191757410075707', 120),
          ])
          expect(parseInputValue('int120[2]', '["-6426191757410075707", -6426191757410075707]')).toEqual([
            padDecimal('-6426191757410075707', 120),
            padDecimal('-6426191757410075707', 120),
          ])
        })
      })

      describe('uint[] & uint[size]', () => {
        it('parse an array of numbers to array of strings', () => {
          expect(parseInputValue('uint[]', '[1]')).toEqual([padDecimal('1', 256)])
          expect(parseInputValue('uint[2]', '[1]')).toEqual([padDecimal('1', 256)])

          expect(parseInputValue('uint120[]', '[1]')).toEqual([padDecimal('1', 120)])
          expect(parseInputValue('uint120[2]', '[1]')).toEqual([padDecimal('1', 120)])
        })

        it('parse an array of numbers as strings to array of strings', () => {
          expect(parseInputValue('uint[]', '["1"]')).toEqual([padDecimal('1', 256)])
          expect(parseInputValue('uint[2]', '["1"]')).toEqual([padDecimal('1', 256)])

          expect(parseInputValue('uint120[]', '["1"]')).toEqual([padDecimal('1', 120)])
          expect(parseInputValue('uint120[2]', '["1"]')).toEqual([padDecimal('1', 120)])
        })

        it('parse an array of long numbers to array of strings', () => {
          expect(parseInputValue('uint[]', '[6426191757410075707]')).toEqual([padDecimal('6426191757410075707', 256)])
          expect(parseInputValue('uint[4]', '[6426191757410075707]')).toEqual([padDecimal('6426191757410075707', 256)])

          expect(parseInputValue('uint120[]', '[6426191757410075707]')).toEqual([
            padDecimal('6426191757410075707', 120),
          ])
          expect(parseInputValue('uint120[4]', '[6426191757410075707]')).toEqual([
            padDecimal('6426191757410075707', 120),
          ])
        })

        it('parse an array of long numbers as strings to array of strings', () => {
          expect(parseInputValue('uint[]', '["6426191757410075707"]')).toEqual([padDecimal('6426191757410075707', 256)])
          expect(parseInputValue('uint[3]', '["6426191757410075707"]')).toEqual([
            padDecimal('6426191757410075707', 256),
          ])

          expect(parseInputValue('uint120[]', '["6426191757410075707"]')).toEqual([
            padDecimal('6426191757410075707', 120),
          ])
          expect(parseInputValue('uint120[3]', '["6426191757410075707"]')).toEqual([
            padDecimal('6426191757410075707', 120),
          ])
        })

        it('parse an empty array as valid value', () => {
          expect(parseInputValue('uint[]', '[]')).toEqual([])
          expect(parseInputValue('uint[2]', '[]')).toEqual([])

          expect(parseInputValue('uint120[]', '[]')).toEqual([])
          expect(parseInputValue('uint120[2]', '[]')).toEqual([])
        })

        it('parse an invalid array throws a SoliditySyntaxError', () => {
          expect(() => parseInputValue('uint[]', 'invalid_array_value')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('uint[]', '6426191757410075707')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('uint[3]', 'invalid_array_value')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('uint[3]', '6426191757410075707')).toThrow(SoliditySyntaxError)

          expect(() => parseInputValue('uint120[]', 'invalid_array_value')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('uint120[]', '6426191757410075707')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('uint120[3]', 'invalid_array_value')).toThrow(SoliditySyntaxError)
          expect(() => parseInputValue('uint120[3]', '6426191757410075707')).toThrow(SoliditySyntaxError)
        })

        it('parse an array with invalid values throws an Error', () => {
          expect(() => parseInputValue('uint[]', '[invalid_array_value]')).toThrow(Error)
          expect(() => parseInputValue('uint[2]', '[invalid_array_value]')).toThrow(Error)
          expect(() => parseInputValue('uint120[]', '[invalid_array_value]')).toThrow(Error)
          expect(() => parseInputValue('uint120[2]', '[invalid_array_value]')).toThrow(Error)
        })
      })
    })

    describe('string[] values', () => {
      it('parse an array of strings to array of strings', () => {
        expect(parseInputValue('string[]', '["Hello World!"]')).toEqual(['Hello World!'])
        expect(parseInputValue('string[1]', '["Hello World!"]')).toEqual(['Hello World!'])
      })

      it('parse an array of numbers to array of numbers', () => {
        expect(parseInputValue('string[]', '[1234]')).toEqual([1234])
        expect(parseInputValue('string[1]', '[1234]')).toEqual([1234])
      })

      it('thorws an error for a invalid array of strings', () => {
        expect(() => parseInputValue('string[]', '[INVALID_STRING]')).toThrow(SyntaxError)
        expect(() => parseInputValue('string[1]', '[INVALID_STRING]')).toThrow(SyntaxError)
      })
    })

    describe('address[] & address[size] values', () => {
      it('parse an array of addresses(string) to array of strings', () => {
        expect(parseInputValue('address[]', '["0x680cde08860141F9D223cE4E620B10Cd6741037E"]')).toEqual([
          '0x680cde08860141F9D223cE4E620B10Cd6741037E',
        ])
        expect(parseInputValue('address[1]', '["0x680cde08860141F9D223cE4E620B10Cd6741037E"]')).toEqual([
          '0x680cde08860141F9D223cE4E620B10Cd6741037E',
        ])
      })

      it('parse an array of addresses to array of strings', () => {
        expect(parseInputValue('address[]', '[0x680cde08860141F9D223cE4E620B10Cd6741037E]')).toEqual([
          '0x680cde08860141F9D223cE4E620B10Cd6741037E',
        ])
        expect(parseInputValue('address[1]', '[0x680cde08860141F9D223cE4E620B10Cd6741037E]')).toEqual([
          '0x680cde08860141F9D223cE4E620B10Cd6741037E',
        ])
      })
    })

    describe('bytes[] & bytes[size] values', () => {
      it('parse an array of bytes (string) to array of strings', () => {
        expect(parseInputValue('bytes[]', '["0x000111AAFF"]')).toEqual(['0x000111AAFF'])
        expect(parseInputValue('bytes[1]', '["0x000111AAFF"]')).toEqual(['0x000111AAFF'])
      })

      it('parse an array of bytes to array of strings', () => {
        expect(parseInputValue('bytes[]', '[0x000111AAFF]')).toEqual(['0x000111AAFF'])
        expect(parseInputValue('bytes[1]', '[0x000111AAFF]')).toEqual(['0x000111AAFF'])
      })
    })

    describe('tuple values', () => {
      it('tuples values are parsed as JSON', () => {
        const tupleFieldType = getInputTypeHelper({
          components: [
            {
              internalType: 'uint128',
              name: 'allocated',
              type: 'uint128',
            },
            {
              internalType: 'uint128',
              name: 'loss',
              type: 'uint128',
            },
          ],
          internalType: 'struct AllocatorLimits',
          name: 'limits',
          type: 'tuple',
        })

        // tupleFieldType is tuple(uint128,uint128)
        expect(parseInputValue(tupleFieldType, '["1","1"]')).toEqual(['1', '1'])
        expect(parseInputValue(tupleFieldType, '[1,1]')).toEqual([1, 1])
      })

      it('parses a tuple with nested tuples', () => {
        const tupleWithNestedTuplesFieldType = getInputTypeHelper({
          name: 's',
          type: 'tuple',
          internalType: 'tuple',
          components: [
            {
              name: 'a',
              internalType: 'uint256',
              type: 'uint256',
            },
            {
              name: 'b',
              internalType: 'uint256[]',
              type: 'uint256[]',
            },
            {
              name: 'c',
              type: 'tuple[]',
              internalType: 'tuple[]',
              components: [
                {
                  name: 'x',
                  internalType: 'uint256',
                  type: 'uint256',
                },
                {
                  name: 'y',
                  internalType: 'uint256',
                  type: 'uint256',
                },
                {
                  name: 'z',
                  internalType: 'tuple',
                  type: 'tuple',
                  components: [
                    {
                      name: 'a',
                      internalType: 'uint256',
                      type: 'uint256',
                    },
                    {
                      name: 'b',
                      internalType: 'uint256',
                      type: 'uint256',
                    },
                  ],
                },
              ],
            },
          ],
        })

        // tuple(uint256,uint256[],tuple(uint256,uint256,tuple(uint256,uint256))[])

        expect(parseInputValue(tupleWithNestedTuplesFieldType, '[1,[2,3],[[3,3,[5,5]],[4,4,[6,6]]]]')).toEqual([
          1,
          [2, 3],
          [
            [3, 3, [5, 5]],
            [4, 4, [6, 6]],
          ],
        ])
      })

      it.skip('tuples with long int values are parsed to valid BN values', () => {
        const tupleFieldType = getInputTypeHelper({
          components: [
            {
              internalType: 'uint128',
              name: 'allocated',
              type: 'uint128',
            },
            {
              internalType: 'uint128',
              name: 'loss',
              type: 'uint128',
            },
          ],
          internalType: 'struct AllocatorLimits',
          name: 'limits',
          type: 'tuple',
        })

        // tupleFieldType is tuple(uint128,uint128)
        expect(parseInputValue(tupleFieldType, '["6426191757410075707","6426191757410075707"]')).toEqual([
          '6426191757410075707',
          '6426191757410075707',
        ])
        // FIX: fix the issue with long numbers in tuples
        expect(parseInputValue(tupleFieldType, '[6426191757410075707,6426191757410075707]')).toEqual([
          '6426191757410075707',
          '6426191757410075707',
        ])
      })

      it.skip('parses a tuple with nested tuples with long int values', () => {
        const tupleWithNestedTuplesFieldType = getInputTypeHelper({
          name: 's',
          type: 'tuple',
          internalType: 'tuple',
          components: [
            {
              name: 'a',
              internalType: 'uint256',
              type: 'uint256',
            },
            {
              name: 'b',
              internalType: 'uint256[]',
              type: 'uint256[]',
            },
            {
              name: 'c',
              type: 'tuple[]',
              internalType: 'tuple[]',
              components: [
                {
                  name: 'x',
                  internalType: 'uint256',
                  type: 'uint256',
                },
                {
                  name: 'y',
                  internalType: 'uint256',
                  type: 'uint256',
                },
                {
                  name: 'z',
                  internalType: 'tuple',
                  type: 'tuple',
                  components: [
                    {
                      name: 'a',
                      internalType: 'uint256',
                      type: 'uint256',
                    },
                    {
                      name: 'b',
                      internalType: 'uint256',
                      type: 'uint256',
                    },
                  ],
                },
              ],
            },
          ],
        })

        // tuple(uint256,uint256[],tuple(uint256,uint256,tuple(uint256,uint256))[])
        // FIX: fix the issue with long numbers in tuples
        expect(
          parseInputValue(
            tupleWithNestedTuplesFieldType,
            '[6426191757410075707,[6426191757410075707,6426191757410075707],[[6426191757410075707,6426191757410075707,[6426191757410075707,6426191757410075707]],[6426191757410075707,6426191757410075707,[6426191757410075707,6426191757410075707]]]]',
          ),
        ).toEqual([
          '6426191757410075707',
          ['6426191757410075707', '6426191757410075707'],
          [
            ['6426191757410075707', '6426191757410075707', ['6426191757410075707', '6426191757410075707']],
            ['6426191757410075707', '6426191757410075707', ['6426191757410075707', '6426191757410075707']],
          ],
        ])
      })
    })

    describe('tuple[] values', () => {
      it('parse a valid tuple[] value', () => {
        const tupleArrayFieldType = getInputTypeHelper({
          components: [
            {
              internalType: 'address payable',
              name: 'signer',
              type: 'address',
            },
            {
              internalType: 'address',
              name: 'sender',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: 'minGasPrice',
              type: 'uint256',
            },
          ],
          internalType: 'struct IMetaTransactionsFeature.MetaTransactionData[]',
          name: 'mtxs',
          type: 'tuple[]',
        })

        // tuple(address,address,uint256)[]
        const parsedValue = parseInputValue(
          tupleArrayFieldType,
          '[["0x57CB13cbef735FbDD65f5f2866638c546464E45F", "0x57CB13cbef735FbDD65f5f2866638c546464E45F", 1], ["0x57CB13cbef735FbDD65f5f2866638c546464E45F", "0x57CB13cbef735FbDD65f5f2866638c546464E45F", 1]]',
        )

        expect(parsedValue).toEqual([
          ['0x57CB13cbef735FbDD65f5f2866638c546464E45F', '0x57CB13cbef735FbDD65f5f2866638c546464E45F', 1],
          ['0x57CB13cbef735FbDD65f5f2866638c546464E45F', '0x57CB13cbef735FbDD65f5f2866638c546464E45F', 1],
        ])
      })
    })

    describe('int[][], int[size][], int[][size] & int[size][size] values', () => {
      it('parse a matrix of int[][] to array of strings', () => {
        expect(parseInputValue('int[][]', '[  ["1", -2], [3],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 256), padDecimal('-2', 256)],
          [padDecimal('3', 256)],
          [padDecimal('-4', 256), padDecimal('5', 256)],
        ])
      })

      it('parse a matrix of int[size][] to array of strings', () => {
        expect(parseInputValue('int[2][]', '[  ["1", -2], [3, "2"],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 256), padDecimal('-2', 256)],
          [padDecimal('3', 256), padDecimal('2', 256)],
          [padDecimal('-4', 256), padDecimal('5', 256)],
        ])
      })

      it('parse a matrix of int[][size] to array of strings', () => {
        expect(parseInputValue('int[][3]', '[  ["1", -2], [3],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 256), padDecimal('-2', 256)],
          [padDecimal('3', 256)],
          [padDecimal('-4', 256), padDecimal('5', 256)],
        ])
      })

      it('parse a matrix of int[size][size] to array of strings', () => {
        expect(parseInputValue('int[2][3]', '[  ["1", -2], [3, "2"],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 256), padDecimal('-2', 256)],
          [padDecimal('3', 256), padDecimal('2', 256)],
          [padDecimal('-4', 256), padDecimal('5', 256)],
        ])
      })

      it('parse a matrix of int[][] with hex values', () => {
        expect(parseInputValue('int[][]', '[  ["0xFF", -0xFF],[3, "0x123"],  [ -aaa, 5 ]  ]')).toEqual([
          [hexToDecimalPadded('0xFF', 256), hexToDecimalPadded('-0xFF', 256)],
          [padDecimal('3', 256), hexToDecimalPadded('0x123', 256)],
          [hexToDecimalPadded('-aaa', 256), padDecimal('5', 256)],
        ])
      })

      it('parse a matrix of int[][] with long negative values', () => {
        expect(
          parseInputValue(
            'int[][]',
            '[  ["6426191757410075707", -6426191757410075707],[6426191757410075707, "-6426191757410075707"]  ]',
          ),
        ).toEqual([
          [padDecimal('6426191757410075707', 256), padDecimal('-6426191757410075707', 256)],
          [padDecimal('6426191757410075707', 256), padDecimal('-6426191757410075707', 256)],
        ])
      })
    })

    describe('uint[][], uint[size][], uint[][size] & uint[size][size] values', () => {
      it('parse a matrix of uint[][] to array of strings', () => {
        expect(parseInputValue('uint[][]', '[  ["1", 2], [3],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 256), padDecimal('2', 256)],
          [padDecimal('3', 256)],
          [padDecimal('4', 256), padDecimal('5', 256)],
        ])
      })

      it('parse a matrix of uint[size][] to array of strings', () => {
        expect(parseInputValue('uint[2][]', '[  ["1", 2], [3, "2"],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 256), padDecimal('2', 256)],
          [padDecimal('3', 256), padDecimal('2', 256)],
          [padDecimal('4', 256), padDecimal('5', 256)],
        ])
      })

      it('parse a matrix of uint[][size] to array of strings', () => {
        expect(parseInputValue('uint[][3]', '[  ["1", 2], [3],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 256), padDecimal('2', 256)],
          [padDecimal('3', 256)],
          [padDecimal('4', 256), padDecimal('5', 256)],
        ])
      })

      it('parse a matrix of uint[size][size] to array of strings', () => {
        expect(parseInputValue('uint[2][3]', '[  ["1", 2], [3, "2"],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 256), padDecimal('2', 256)],
          [padDecimal('3', 256), padDecimal('2', 256)],
          [padDecimal('4', 256), padDecimal('5', 256)],
        ])
      })

      it('parse a matrix of uint[][] with hex values', () => {
        expect(parseInputValue('uint[][]', '[  ["0xFF", 0xFF],[3, "0x123"],  [ aaa, 5 ]  ]')).toEqual([
          [hexToDecimalPadded('0xFF', 256), hexToDecimalPadded('0xFF', 256)],
          [padDecimal('3', 256), hexToDecimalPadded('0x123', 256)],
          [hexToDecimalPadded('aaa', 256), padDecimal('5', 256)],
        ])
      })

      it('parse a matrix of uint[][] with long negative values', () => {
        expect(
          parseInputValue(
            'uint[][]',
            '[  ["6426191757410075707", 6426191757410075707],[6426191757410075707, "6426191757410075707"]  ]',
          ),
        ).toEqual([
          [padDecimal('6426191757410075707', 256), padDecimal('6426191757410075707', 256)],
          [padDecimal('6426191757410075707', 256), padDecimal('6426191757410075707', 256)],
        ])
      })
    })

    describe('int128[][], int128[size][], int128[][size] & int128[size][size] values', () => {
      it('parse a matrix of int128[][] to array of strings', () => {
        expect(parseInputValue('int128[][]', '[  ["1", -2], [3],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 128), padDecimal('-2', 128)],
          [padDecimal('3', 128)],
          [padDecimal('-4', 128), padDecimal('5', 128)],
        ])
      })

      it('parse a matrix of int128[size][] to array of strings', () => {
        expect(parseInputValue('int128[2][]', '[  ["1", -2], [3, "2"],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 128), padDecimal('-2', 128)],
          [padDecimal('3', 128), padDecimal('2', 128)],
          [padDecimal('-4', 128), padDecimal('5', 128)],
        ])
      })

      it('parse a matrix of int128[][size] to array of strings', () => {
        expect(parseInputValue('int128[][3]', '[  ["1", -2], [3],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 128), padDecimal('-2', 128)],
          [padDecimal('3', 128)],
          [padDecimal('-4', 128), padDecimal('5', 128)],
        ])
      })

      it('parse a matrix of int128[size][size] to array of strings', () => {
        expect(parseInputValue('int128[2][3]', '[  ["1", -2], [3, "2"],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 128), padDecimal('-2', 128)],
          [padDecimal('3', 128), padDecimal('2', 128)],
          [padDecimal('-4', 128), padDecimal('5', 128)],
        ])
      })

      it('parse a matrix of int128[][] with hex values', () => {
        expect(parseInputValue('int128[][]', '[  ["0xFF", -0xFF],[3, "0x123"],  [ -aaa, 5 ]  ]')).toEqual([
          [hexToDecimalPadded('0xFF', 128), hexToDecimalPadded('-0xFF', 128)],
          [padDecimal('3', 128), hexToDecimalPadded('0x123', 128)],
          [hexToDecimalPadded('-aaa', 128), padDecimal('5', 128)],
        ])
      })

      it('parse a matrix of int128[][] with long negative values', () => {
        expect(
          parseInputValue(
            'int128[][]',
            '[  ["6426191757410075707", -6426191757410075707],[6426191757410075707, "-6426191757410075707"]  ]',
          ),
        ).toEqual([
          [padDecimal('6426191757410075707', 128), padDecimal('-6426191757410075707', 128)],
          [padDecimal('6426191757410075707', 128), padDecimal('-6426191757410075707', 128)],
        ])
      })
    })

    describe('uint128[][], uint128[size][], uint128[][size] & uint128[size][size] values', () => {
      it('parse a matrix of uint128[][] to array of strings', () => {
        expect(parseInputValue('uint128[][]', '[  ["1", 2], [3],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 128), padDecimal('2', 128)],
          [padDecimal('3', 128)],
          [padDecimal('4', 128), padDecimal('5', 128)],
        ])
      })

      it('parse a matrix of uint128[size][] to array of strings', () => {
        expect(parseInputValue('uint128[2][]', '[  ["1", 2], [3, "2"],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 128), padDecimal('2', 128)],
          [padDecimal('3', 128), padDecimal('2', 128)],
          [padDecimal('4', 128), padDecimal('5', 128)],
        ])
      })

      it('parse a matrix of uint128[][size] to array of strings', () => {
        expect(parseInputValue('uint128[][3]', '[  ["1", 2], [3],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 128), padDecimal('2', 128)],
          [padDecimal('3', 128)],
          [padDecimal('4', 128), padDecimal('5', 128)],
        ])
      })

      it('parse a matrix of uint128[size][size] to array of strings', () => {
        expect(parseInputValue('uint128[2][3]', '[  ["1", 2], [3, "2"],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 128), padDecimal('2', 128)],
          [padDecimal('3', 128), padDecimal('2', 128)],
          [padDecimal('4', 128), padDecimal('5', 128)],
        ])
      })

      it('parse a matrix of uint128[][] with hex values', () => {
        expect(parseInputValue('uint128[][]', '[  ["0xFF", 0xFF],[3, "0x123"],  [ aaa, 5 ]  ]')).toEqual([
          [hexToDecimalPadded('0xFF', 128), hexToDecimalPadded('0xFF', 128)],
          [padDecimal('3', 128), hexToDecimalPadded('0x123', 128)],
          [hexToDecimalPadded('aaa', 128), padDecimal('5', 128)],
        ])
      })

      it('parse a matrix of uint128[][] with long negative values', () => {
        expect(
          parseInputValue(
            'uint128[][]',
            '[  ["6426191757410075707", 6426191757410075707],[6426191757410075707, "6426191757410075707"]  ]',
          ),
        ).toEqual([
          [padDecimal('6426191757410075707', 128), padDecimal('6426191757410075707', 128)],
          [padDecimal('6426191757410075707', 128), padDecimal('6426191757410075707', 128)],
        ])
      })
    })

    describe('int8[][], int8[size][], int8[][size] & int8[size][size] values', () => {
      it('parse a matrix of int8[][] to array of strings', () => {
        expect(parseInputValue('int8[][]', '[  ["1", -2], [3],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 8), padDecimal('-2', 8)],
          [padDecimal('3', 8)],
          [padDecimal('-4', 8), padDecimal('5', 8)],
        ])
      })

      it('parse a matrix of int8[size][] to array of strings', () => {
        expect(parseInputValue('int8[2][]', '[  ["1", -2], [3, "2"],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 8), padDecimal('-2', 8)],
          [padDecimal('3', 8), padDecimal('2', 8)],
          [padDecimal('-4', 8), padDecimal('5', 8)],
        ])
      })

      it('parse a matrix of int8[][size] to array of strings', () => {
        expect(parseInputValue('int8[][3]', '[  ["1", -2], [3],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 8), padDecimal('-2', 8)],
          [padDecimal('3', 8)],
          [padDecimal('-4', 8), padDecimal('5', 8)],
        ])
      })

      it('parse a matrix of int8[size][size] to array of strings', () => {
        expect(parseInputValue('int8[2][3]', '[  ["1", -2], [3, "2"],  [ -4, 5 ]  ]')).toEqual([
          [padDecimal('1', 8), padDecimal('-2', 8)],
          [padDecimal('3', 8), padDecimal('2', 8)],
          [padDecimal('-4', 8), padDecimal('5', 8)],
        ])
      })

      it('parse a matrix of int8[][] with hex values', () => {
        expect(parseInputValue('int8[][]', '[  ["0xF", 0xFF],[3, "0x123"],  [ aaa, 5 ]  ]')).toEqual([
          [hexToDecimalPadded('0xF', 8), hexToDecimalPadded('0xFF', 8)],
          [padDecimal('3', 8), hexToDecimalPadded('0x123', 8)],
          [hexToDecimalPadded('aaa', 8), padDecimal('5', 8)],
        ])
      })
    })

    describe('uint8[][], uint8[size][], uint8[][size] & uint8[size][size] values', () => {
      it('parse a matrix of uint8[][] to array of strings', () => {
        expect(parseInputValue('uint8[][]', '[  ["1", 2], [3],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 8), padDecimal('2', 8)],
          [padDecimal('3', 8)],
          [padDecimal('4', 8), padDecimal('5', 8)],
        ])
      })

      it('parse a matrix of uint8[size][] to array of strings', () => {
        expect(parseInputValue('uint8[2][]', '[  ["1", 2], [3, "2"],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 8), padDecimal('2', 8)],
          [padDecimal('3', 8), padDecimal('2', 8)],
          [padDecimal('4', 8), padDecimal('5', 8)],
        ])
      })

      it('parse a matrix of uint8[][size] to array of strings', () => {
        expect(parseInputValue('uint8[][3]', '[  ["1", 2], [3],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 8), padDecimal('2', 8)],
          [padDecimal('3', 8)],
          [padDecimal('4', 8), padDecimal('5', 8)],
        ])
      })

      it('parse a matrix of uint8[size][size] to array of strings', () => {
        expect(parseInputValue('uint8[2][3]', '[  ["1", 2], [3, "2"],  [ 4, 5 ]  ]')).toEqual([
          [padDecimal('1', 8), padDecimal('2', 8)],
          [padDecimal('3', 8), padDecimal('2', 8)],
          [padDecimal('4', 8), padDecimal('5', 8)],
        ])
      })
    })

    describe('bool[][], bool[size][], bool[][size] & bool[size][size] values', () => {
      it('parse a matrix of bool[][] to array of booleans', () => {
        expect(
          parseInputValue(
            'bool[][]',
            '[  ["true", true], [false],  [ "FALSE" ], [0, 1, "0", "1"], [TRUE], ["True", "False"], [True, TRUE, FALSE]  ]',
          ),
        ).toEqual([
          [true, true],
          [false],
          [false],
          [false, true, false, true],
          [true],
          [true, false],
          [true, true, false],
        ])
      })
    })

    describe('address[][], address[size][], address[][size] & address[size][size] values', () => {
      it('parse a matrix of address[][] to array of strings', () => {
        expect(
          parseInputValue(
            'address[][]',
            '[  [0x680cde08860141F9D223cE4E620B10Cd6741037E], ["0x680cde08860141F9D223cE4E620B10Cd6741037E"]  ]',
          ),
        ).toEqual([['0x680cde08860141F9D223cE4E620B10Cd6741037E'], ['0x680cde08860141F9D223cE4E620B10Cd6741037E']])
      })
    })

    describe('bytes[][], bytes[size][], bytes[][size] & bytes[size][size] values', () => {
      it('parse a matrix of bytes[][] to array of strings', () => {
        expect(parseInputValue('bytes[][]', '[  [0xFFFF], ["0xFFFF"]  ]')).toEqual([['0xFFFF'], ['0xFFFF']])
      })
    })

    describe('string[][], string[size][], string[][size] & string[size][size] values', () => {
      it('parse a matrix of string[][] to array of strings', () => {
        expect(parseInputValue('string[][]', '[  ["Hi!", "Hello world!" ], ["Hello world!"]  ]')).toEqual([
          ['Hi!', 'Hello world!'],
          ['Hello world!'],
        ])
      })
    })
    describe('multidimensional arrays', () => {
      it('parse a matrix of int8[][][] to array of strings', () => {
        expect(parseInputValue('int8[][][]', '[ [ [1,2,3,4], [5,6]  ], [[]],  [[7], [8]]  ]')).toEqual([
          [
            [padDecimal('1', 8), padDecimal('2', 8), padDecimal('3', 8), padDecimal('4', 8)],
            [padDecimal('5', 8), padDecimal('6', 8)],
          ],
          [[]],
          [[padDecimal('7', 8)], [padDecimal('8', 8)]],
        ])
      })

      it('parse a matrix of bool[2][3][2] to array of strings', () => {
        expect(
          parseInputValue(
            'bool[2][3][2]',
            '[ [ [TRUE, true], [1,0], [false, true]  ],  [["TRUE", "FALSE"], ["1", "0"], ["True", "false"]], [["TRUE", "FALSE"], [0, 1], ["True", "false"]]  ]',
          ),
        ).toEqual([
          [
            [true, true],
            [true, false],
            [false, true],
          ],
          [
            [true, false],
            [true, false],
            [true, false],
          ],
          [
            [true, false],
            [false, true],
            [true, false],
          ],
        ])
      })

      it('parse a matrix of string[2][3][2][] to array of strings', () => {
        expect(
          parseInputValue(
            'string[2][3][2][]',
            '[[   [["Hi!", "Hi!"], ["Hi!", "Hi!"], ["Hi!", "Hi!"]], [["Hi!", "Hi!"], ["Hi!", "Hi!"], ["Hi!", "Hi!"]]  ] ]',
          ),
        ).toEqual([
          [
            [
              ['Hi!', 'Hi!'],
              ['Hi!', 'Hi!'],
              ['Hi!', 'Hi!'],
            ],
            [
              ['Hi!', 'Hi!'],
              ['Hi!', 'Hi!'],
              ['Hi!', 'Hi!'],
            ],
          ],
        ])
      })
    })
  })

  describe('parseStringToArray', () => {
    it('parse valid string of ints to an array of strings', () => {
      const arrayAsString = '[0, 1,  2  ,  3,4  , " 5 ", -6 , "-7"]'
      const arrayPased = parseStringToArray(arrayAsString)
      expect(arrayPased).toEqual(['0', '1', '2', '3', '4', '"5"', '-6', '"-7"'])
    })

    it('parse valid string of long ints to an array of strings', () => {
      const arrayAsString = '[6426191757410075707, -6426191757410075707, "6426191757410075707", "-6426191757410075707"]'
      const arrayPased = parseStringToArray(arrayAsString)
      expect(arrayPased).toEqual([
        '6426191757410075707',
        '-6426191757410075707',
        '"6426191757410075707"',
        '"-6426191757410075707"',
      ])
    })

    it('parse a valid of nested array of ints to an array of strings', () => {
      const nestedArrayAsString = '[1, 2, [3,4], [  [5,6, [], 7]  ],  8, [9]]'
      const arrayPased = parseStringToArray(nestedArrayAsString)
      expect(arrayPased).toEqual(['1', '2', '[3,4]', '[[5,6,[],7]]', '8', '[9]'])
    })
  })

  describe('parseBooleanValue', () => {
    it('parse a valid truthy boolean values as true', () => {
      expect(parseBooleanValue('true')).toBe(true)
      expect(parseBooleanValue('True')).toBe(true)
      expect(parseBooleanValue('TRUE')).toBe(true)
      expect(parseBooleanValue('1')).toBe(true)
      expect(parseBooleanValue(1)).toBe(true)
      expect(parseBooleanValue(true)).toBe(true)
    })

    it('parse a valid falsy boolean values as false', () => {
      expect(parseBooleanValue('false')).toBe(false)
      expect(parseBooleanValue('False')).toBe(false)
      expect(parseBooleanValue('FALSE')).toBe(false)
      expect(parseBooleanValue('0')).toBe(false)
      expect(parseBooleanValue(0)).toBe(false)
      expect(parseBooleanValue(false)).toBe(false)
    })

    it('another value throws an error', () => {
      expect(() => parseBooleanValue('another value')).toThrow(SoliditySyntaxError)
    })
  })

  describe('getNumberOfBits', () => {
    it('returns the number of bits', () => {
      expect(getNumberOfBits('uint')).toBe(256)
      expect(getNumberOfBits('uint256')).toBe(256)
      expect(getNumberOfBits('int')).toBe(256)
      expect(getNumberOfBits('int256')).toBe(256)

      expect(getNumberOfBits('uint128')).toBe(128)
      expect(getNumberOfBits('int128')).toBe(128)

      expect(getNumberOfBits('int8')).toBe(8)
      expect(getNumberOfBits('uint8')).toBe(8)

      expect(getNumberOfBits('int256[]')).toBe(256)
      expect(getNumberOfBits('uint256[]')).toBe(256)
      expect(getNumberOfBits('int128[]')).toBe(128)
      expect(getNumberOfBits('uint128[]')).toBe(128)
      expect(getNumberOfBits('uint8[]')).toBe(8)
      expect(getNumberOfBits('int8[]')).toBe(8)

      expect(getNumberOfBits('int256[][]')).toBe(256)
      expect(getNumberOfBits('uint256[][]')).toBe(256)
      expect(getNumberOfBits('int128[][]')).toBe(128)
      expect(getNumberOfBits('uint128[][]')).toBe(128)
      expect(getNumberOfBits('uint8[][]')).toBe(8)
      expect(getNumberOfBits('int8[][]')).toBe(8)

      expect(getNumberOfBits('int256[2]')).toBe(256)
      expect(getNumberOfBits('uint256[3]')).toBe(256)
      expect(getNumberOfBits('int128[4]')).toBe(128)
      expect(getNumberOfBits('uint128[5]')).toBe(128)
      expect(getNumberOfBits('uint8[6]')).toBe(8)
      expect(getNumberOfBits('int8[2]')).toBe(8)

      expect(getNumberOfBits('int256[1][2]')).toBe(256)
      expect(getNumberOfBits('uint256[1][2]')).toBe(256)
      expect(getNumberOfBits('int128[3][4]')).toBe(128)
      expect(getNumberOfBits('uint128[6][5]')).toBe(128)
      expect(getNumberOfBits('uint8[3][4]')).toBe(8)
      expect(getNumberOfBits('int8[5][4]')).toBe(8)

      expect(getNumberOfBits('int256[][1][][][2]')).toBe(256)
      expect(getNumberOfBits('uint256[][1][][][2]')).toBe(256)
      expect(getNumberOfBits('int128[][1][][][1][][2]')).toBe(128)
      expect(getNumberOfBits('uint128[][1][][][2]')).toBe(128)
      expect(getNumberOfBits('uint8[][1][33][][2]')).toBe(8)
      expect(getNumberOfBits('int8[][1][][][2][][]')).toBe(8)
    })

    describe('parseIntValue', () => {
      it('returns the integer parsed to string', () => {
        expect(parseIntValue('2', 'int')).toEqual(padDecimal('2', 256))
        expect(parseIntValue('2', 'int128')).toEqual(padDecimal('2', 128))
        expect(parseIntValue('-2', 'int8')).toEqual(padDecimal('-2', 8))

        expect(parseIntValue('2', 'uint')).toEqual(padDecimal('2', 256))
        expect(parseIntValue('2', 'uint128')).toEqual(padDecimal('2', 128))
        expect(parseIntValue('2', 'uint8')).toEqual(padDecimal('2', 8))
      })

      it('throws an error for empty strings', () => {
        expect(() => parseIntValue('', 'int8')).toThrow(SoliditySyntaxError)
        expect(() => parseIntValue('""', 'int8')).toThrow(SoliditySyntaxError)
        expect(() => parseIntValue('"', 'int8')).toThrow(SoliditySyntaxError)
        expect(() => parseIntValue('    ', 'int8')).toThrow(SoliditySyntaxError)
      })
    })

    describe('getBaseFieldType', () => {
      it('returns the base field type of an Array, Matrix or Multidimensional array', () => {
        expect(getBaseFieldType('int128')).toBe('int128')
        expect(getBaseFieldType('int128[]')).toBe('int128')
        expect(getBaseFieldType('int128[2]')).toBe('int128')
        expect(getBaseFieldType('int128[][]')).toBe('int128')
        expect(getBaseFieldType('int128[][1]')).toBe('int128')
        expect(getBaseFieldType('int128[2][]')).toBe('int128')
        expect(getBaseFieldType('int128[3][4]')).toBe('int128')
        expect(getBaseFieldType('int128[3][4][][]')).toBe('int128')
        expect(getBaseFieldType('int128[][][][]')).toBe('int128')
        expect(getBaseFieldType('int128[2][1][3][44]')).toBe('int128')
        expect(getBaseFieldType('int128[2][][1][3][][44][][]')).toBe('int128')

        expect(getBaseFieldType('uint')).toBe('uint')
        expect(getBaseFieldType('uint[]')).toBe('uint')
        expect(getBaseFieldType('uint[2]')).toBe('uint')
        expect(getBaseFieldType('uint[][]')).toBe('uint')
        expect(getBaseFieldType('uint[][1]')).toBe('uint')
        expect(getBaseFieldType('uint[2][]')).toBe('uint')
        expect(getBaseFieldType('uint128[3][4]')).toBe('uint128')
        expect(getBaseFieldType('uint[3][4][][]')).toBe('uint')
        expect(getBaseFieldType('uint[][][][]')).toBe('uint')
        expect(getBaseFieldType('uint[2][1][3][44]')).toBe('uint')
        expect(getBaseFieldType('uint[2][][1][3][][44][][]')).toBe('uint')

        expect(getBaseFieldType('bool')).toBe('bool')
        expect(getBaseFieldType('bool[]')).toBe('bool')
        expect(getBaseFieldType('bool[2]')).toBe('bool')
        expect(getBaseFieldType('bool[][]')).toBe('bool')
        expect(getBaseFieldType('bool[][1]')).toBe('bool')
        expect(getBaseFieldType('bool[2][]')).toBe('bool')
        expect(getBaseFieldType('bool[3][4]')).toBe('bool')
        expect(getBaseFieldType('bool[3][4][][]')).toBe('bool')
        expect(getBaseFieldType('bool[][][][]')).toBe('bool')
        expect(getBaseFieldType('bool[2][1][3][44]')).toBe('bool')
        expect(getBaseFieldType('bool[2][][1][3][][44][][]')).toBe('bool')

        expect(getBaseFieldType('address')).toBe('address')
        expect(getBaseFieldType('address[]')).toBe('address')
        expect(getBaseFieldType('address[2]')).toBe('address')
        expect(getBaseFieldType('address[][]')).toBe('address')
        expect(getBaseFieldType('address[][1]')).toBe('address')
        expect(getBaseFieldType('address[2][]')).toBe('address')
        expect(getBaseFieldType('address[3][4]')).toBe('address')
        expect(getBaseFieldType('address[3][4][][]')).toBe('address')
        expect(getBaseFieldType('address[][][][]')).toBe('address')
        expect(getBaseFieldType('address[2][1][3][44]')).toBe('address')
        expect(getBaseFieldType('address[2][][1][3][][44][][]')).toBe('address')

        expect(getBaseFieldType('bytes')).toBe('bytes')
        expect(getBaseFieldType('bytes[]')).toBe('bytes')
        expect(getBaseFieldType('bytes[2]')).toBe('bytes')
        expect(getBaseFieldType('bytes[][]')).toBe('bytes')
        expect(getBaseFieldType('bytes[][1]')).toBe('bytes')
        expect(getBaseFieldType('bytes[2][]')).toBe('bytes')
        expect(getBaseFieldType('bytes[3][4]')).toBe('bytes')
        expect(getBaseFieldType('bytes[3][4][][]')).toBe('bytes')
        expect(getBaseFieldType('bytes[][][][]')).toBe('bytes')
        expect(getBaseFieldType('bytes[2][1][3][44]')).toBe('bytes')
        expect(getBaseFieldType('bytes[2][][1][3][][44][][]')).toBe('bytes')

        expect(getBaseFieldType('string')).toBe('string')
        expect(getBaseFieldType('string[]')).toBe('string')
        expect(getBaseFieldType('string[2]')).toBe('string')
        expect(getBaseFieldType('string[][]')).toBe('string')
        expect(getBaseFieldType('string[][1]')).toBe('string')
        expect(getBaseFieldType('string[2][]')).toBe('string')
        expect(getBaseFieldType('string[3][4]')).toBe('string')
        expect(getBaseFieldType('string[3][4][][]')).toBe('string')
        expect(getBaseFieldType('string[][][][]')).toBe('string')
        expect(getBaseFieldType('string[2][1][3][44]')).toBe('string')
        expect(getBaseFieldType('string[2][][1][3][][44][][]')).toBe('string')
      })

      it('throws an error for invalid types', () => {
        expect(() => getBaseFieldType('INVALID_VALUE')).toThrow(SoliditySyntaxError)
      })
    })

    describe('custom isArray function', () => {
      it('returns true if a given string is a valid array', () => {
        expect(isArray('[]')).toBe(true)
        expect(isArray('   []')).toBe(true)
        expect(isArray('[]    ')).toBe(true)
        expect(isArray('    []    ')).toBe(true)
        expect(isArray('    ["hello"]    ')).toBe(true)
        expect(isArray('    [  "hello"  ]    ')).toBe(true)
        expect(isArray('    [ true  ]    ')).toBe(true)
        expect(isArray('    [ 23  ]    ')).toBe(true)

        expect(isArray('  "hello"   ')).toBe(false)
        expect(isArray('false')).toBe(false)
      })
    })
  })

  // TODO: ADD MORE ENCODE DATA TESTS
  // TODO: ADD example from https://docs.soliditylang.org/en/v0.8.11/abi-spec.html#examples
  describe('encodeToHexData', () => {
    describe('array of integers', () => {
      it('test int128[] encoding with a negative long number', () => {
        const contractMethod = {
          inputs: [{ internalType: 'int128[]', name: 'test128', type: 'int128[]' }],
          name: 'testMethod',
          payable: false,
        }

        const contractFieldsValues = {
          test128: '[-6426191757410075707]',
        }

        const encondedValue = encodeToHexData(contractMethod, contractFieldsValues)

        expect(encondedValue).toEqual(
          '0x7da27bb000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001ffffffffffffffffffffffffffffffffffffffffffffffffa6d194a4e1077bc5',
        )
      })
    })

    describe('array of booleans', () => {
      it('bool[] encoding', () => {
        const contractMethod = {
          inputs: [{ internalType: 'bool[]', name: 'arrayOfBooleans', type: 'bool[]' }],
          name: 'arrayOfBooleansTestMethod',
          payable: false,
        }

        const contractFieldsValues = {
          arrayOfBooleans: '[true, false, 1, 0 , "1", "0", "True", "False", "TRUE", "FALSE", "false", true]',
        }

        const encondedValue = encodeToHexData(contractMethod, contractFieldsValues)

        expect(encondedValue).toEqual(
          '0xcff4aff20000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
        )
      })
    })
  })
})
