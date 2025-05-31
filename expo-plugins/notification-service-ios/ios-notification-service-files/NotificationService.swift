import UserNotifications
import RNNotifeeCore
import MMKV
import SwiftCryptoTokenFormatter
import BigInt

struct ExtensionStore: Codable {
    let chains: [String: String]
    let contacts: [String: String]
}

func loadExtensionStore() -> ExtensionStore? {
    guard let groupDir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.global.safe.mobileapp")?.path else {
        NSLog("[NotifeeDebug] Failed to get app group directory")
        return nil
    }
    guard let kv = MMKV(mmapID: "extension", cryptKey: nil, rootPath: groupDir, mode: .multiProcess, expectedCapacity: 0) else {
        NSLog("[NotifeeDebug] Failed to open MMKV")
        return nil
    }
    guard let json = kv.string(forKey: "notification-extension-data") else {
        NSLog("[NotifeeDebug] No data found for notification-extension-data key")
        return nil
    }
    guard let data = json.data(using: String.Encoding.utf8) else {
        NSLog("[NotifeeDebug] Failed to convert json to data")
        return nil
    }
    return try? JSONDecoder().decode(ExtensionStore.self, from: data)
}


func parseNotification(userInfo: [AnyHashable: Any], store: ExtensionStore) -> (String, String)? {
    NSLog("[NotifeeDebug] Parsing notification with userInfo: \(userInfo)")
    
    guard let type = userInfo["type"] as? String else {
        NSLog("[NotifeeDebug] No type found in notification")
        return nil
    }
    NSLog("[NotifeeDebug] Notification type: \(type)")
    
    let chainId = userInfo["chainId"] as? String
    let address = userInfo["address"] as? String
    
    NSLog("[NotifeeDebug] ChainId: \(chainId ?? "nil"), Address: \(address ?? "nil")")

    let chainName = chainId.flatMap { store.chains[$0] } ?? (chainId != nil ? "Chain Id \(chainId!)" : "")
    let safeName = address.flatMap { store.contacts[$0] } ?? (address ?? "")
    
    NSLog("[NotifeeDebug] Resolved chainName: \(chainName), safeName: \(safeName)")

    switch type {
    case "INCOMING_ETHER":
        let symbol = userInfo["symbol"] as? String ?? "ETH"
        let formatter = TokenFormatter()
        let value = userInfo["value"] as? String ?? ""
        let decimals = Int(18)
        let amount = formatter.string(
            from: BigDecimal(BigInt(value) ?? BigInt(0), decimals),
            decimalSeparator: Locale.autoupdatingCurrent.decimalSeparator ?? ".",
            thousandSeparator: Locale.autoupdatingCurrent.groupingSeparator ?? ",")
        
        return ("Incoming \(symbol) (\(chainName))", "\(safeName): \(amount) \(symbol) received")
    case "INCOMING_TOKEN":
        return ("Incoming token (\(chainName))", "\(safeName): tokens received")
    case "EXECUTED_MULTISIG_TRANSACTION":
        let status = (userInfo["failed"] as? String) == "true" ? "failed" : "successful"
        return ("Transaction \(status) (\(chainName))", "\(safeName): Transaction \(status)")
    case "CONFIRMATION_REQUEST":
        return ("Confirmation required (\(chainName))", "\(safeName): A transaction requires your confirmation!")
    default:
        return nil
    }
}

class NotificationService: UNNotificationServiceExtension {
    let appGroup = "group.global.safe.mobileapp"
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    
    override init() {
        super.init()
        if let groupDir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)?.path {
            MMKV.initialize(rootDir: groupDir)
        } else {
            NSLog("[NotifeeDebug] Failed to initialize MMKV: couldn't get app group directory")
        }
    }
  
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        NSLog("[NotifeeDebug] Received notification request with id: \(request.identifier)")
        self.contentHandler = contentHandler
        self.bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        if let mutable = self.bestAttemptContent {
            NSLog("[NotifeeDebug] Successfully created mutable content")
            
            if let store = loadExtensionStore() {
                NSLog("[NotifeeDebug] Successfully loaded extension store")
                
                if let parsed = parseNotification(userInfo: request.content.userInfo, store: store) {
                    NSLog("[NotifeeDebug] Successfully parsed notification: title=\(parsed.0), body=\(parsed.1)")
                    mutable.title = parsed.0
                    mutable.body = parsed.1
                    mutable.badge = 1
                } else {
                    NSLog("[NotifeeDebug] Failed to parse notification")
                }
            } else {
                NSLog("[NotifeeDebug] Failed to load extension store")
            }
            
            NotifeeExtensionHelper.populateNotificationContent(request, with: mutable, withContentHandler: contentHandler)
        } else {
            NSLog("[NotifeeDebug] Failed to create mutable content")
            contentHandler(request.content)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        NSLog("[NotifeeDebug] Service extension time will expire")
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
}
