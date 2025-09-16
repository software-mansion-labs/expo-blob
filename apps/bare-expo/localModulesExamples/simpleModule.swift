import ExpoModulesCore
import WebKit

public class simpleModule: Module {
  public func definition() -> ModuleDefinition {
    Constant("test") {
        return "Swift constant 1283"
    }
  }
}
