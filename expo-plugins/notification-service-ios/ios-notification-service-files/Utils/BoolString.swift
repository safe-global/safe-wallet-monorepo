//
//  BoolString.swift
//  Multisig
//
//  Created by Dmitry Bespalov on 26.07.21.
//  Copyright © 2021 Gnosis Ltd. All rights reserved.
//

import Foundation

struct BoolString: Hashable, Codable {
    var value: Bool

    init(_ value: Bool) {
        self.value = value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let string = try container.decode(String.self)
        value = string == "true"
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(value ? "true" : "false")
    }
}

extension BoolString: ExpressibleByStringLiteral {
    init(stringLiteral value: StringLiteralType) {
        self.init(value == "true")
    }
}

extension BoolString: CustomStringConvertible {
    var description: String {
        String(describing: value)
    }
}
