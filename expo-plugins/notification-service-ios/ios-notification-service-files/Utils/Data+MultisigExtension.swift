//
//  Copyright © 2018 Gnosis Ltd. All rights reserved.
//

import Foundation
import CryptoSwift

// MARK: - Hex String to Data conversion
public extension Data {

    static func value(of nibble: UInt8) -> UInt8? {
        guard let letter = String(bytes: [nibble], encoding: .ascii) else { return nil }
        return UInt8(letter, radix: 16)
    }

    // TODO: Duplicate code. Remove and use init(hex: String) instead, when
    // disambiguation with other implementations of Data.init?(hex:) has been achieved
    init(hexWC: String) {
        var data = Data()
        let string = hexWC.hasPrefix("0x") ? String(hexWC.dropFirst(2)) : hexWC

        // Convert the string to bytes for better performance
        guard
            let stringData = string.data(using: .ascii, allowLossyConversion: true)
        else {
            self =  data
            return
        }

        let stringBytes = Array(stringData)
        for idx in stride(from: 0, to: stringBytes.count, by: 2) {
            guard let high = Data.value(of: stringBytes[idx]) else {
                data.removeAll()
                break
            }
            if idx < stringBytes.count - 1, let low = Data.value(of: stringBytes[idx + 1]) {
                data.append((high << 4) | low)
            } else {
                data.append(high)
            }
        }
        self = data
    }

    /// Creates data from hex string, padding to even byte character count from the left with 0.
    /// For example, "0x1" will become "0x01".
    ///
    /// - Parameter ethHex: hex string.
    init(ethHex: String) {
        var value = ethHex
        while value.hasPrefix("0x") || value.hasPrefix("0X") { value = String(value.dropFirst(2)) }
        // if ethHex is not full byte, Data(hex:) adds nibble at the end, but we need it in the beginning
        let paddingToByte = value.count % 2 == 1 ? "0" : ""
        value = paddingToByte + value
        self.init(hexWC: value)
    }

    init?(exactlyHex hex: String) {
        var value = hex.lowercased()
        if value.hasPrefix("0x") {
            value.removeFirst(2)
        }
        guard value.rangeOfCharacter(from: CharacterSet.hexadecimals.inverted) == nil else {
            return nil
        }
        self.init(hexWC: value)
    }

    func toHexStringWithPrefix() -> String {
        "0x" + toHexString()
    }

    /// Pads data with `value` from the left to total width of `count`
    ///
    /// - Parameters:
    ///   - count: total padded with=
    ///   - value: padding value, default is 0
    /// - Returns: padded data of size `count`
    func leftPadded(to count: Int, with value: UInt8 = 0) -> Data {
        if self.count >= count { return self }
        return Data(repeating: value, count: count - self.count) + self
    }

    func rightPadded(to count: Int, with value: UInt8 = 0) -> Data {
        if self.count >= count { return self }
        return self + Data(repeating: value, count: count - self.count)
    }

    func endTruncated(to count: Int) -> Data {
        guard self.count > count else { return self }
        return prefix(count)
    }

    init?(randomOfSize count: Int) {
        var bytes: [UInt8] = .init(repeating: 0, count: count)
        let result = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        guard result == errSecSuccess else {
            return nil
        }
        self.init(bytes)
    }
}
