//
//  CharacterSet+Hex.swift
//  Multisig
//
//  Created by Moaaz on 5/22/20.
//  Copyright © 2020 Gnosis Ltd. All rights reserved.
//

import Foundation

extension CharacterSet {

    static var hexadecimalNumbers: CharacterSet {
        return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
    }

    static var hexadecimalLetters: CharacterSet {
        return ["a", "b", "c", "d", "e", "f", "A", "B", "C", "D", "E", "F"]
    }

    static var hexadecimals: CharacterSet {
        return hexadecimalNumbers.union(hexadecimalLetters)
    }
}
