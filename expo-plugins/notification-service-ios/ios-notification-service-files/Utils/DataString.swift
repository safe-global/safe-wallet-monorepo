//
//  DataString.swift
//  Multisig
//
//  Created by Dmitry Bespalov on 16.06.20.
//  Copyright © 2020 Gnosis Ltd. All rights reserved.
//

import Foundation

struct DataString: Hashable, Codable {
    let data: Data

    init(_ data: Data) {
        self.data = data
    }

    init(hex: String) {
        self.data = Data(hex: hex)
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let string = try container.decode(String.self)
        data = Data(hex: string)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(data.toHexStringWithPrefix())
    }

}

extension DataString: ExpressibleByStringLiteral {
    init(stringLiteral value: StringLiteralType) {
        self.init(Data(ethHex: value))
    }
}

extension DataString: CustomStringConvertible {
    var description: String {
        data.toHexStringWithPrefix()
    }
}
