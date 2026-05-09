//
//  UInt256.swift
//  Multisig
//
//  Created by Dmitry Bespalov on 15.06.20.
//  Copyright © 2020 Gnosis Ltd. All rights reserved.
//

import Foundation
import BigInt

typealias UInt256 = BigUInt
typealias Int256 = BigInt

extension UInt256 {
    var data32: Data {
        Data(ethHex: String(self, radix: 16)).leftPadded(to: 32).suffix(32)
    }
}
