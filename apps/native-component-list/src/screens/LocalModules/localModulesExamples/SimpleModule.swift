import ExpoModulesCore
import WebKit

public class SimpleModule: Module {
  public func definition() -> ModuleDefinition {
    Constant("test") {
      return "Swift constant 1283"
    }
    
    Constant("testOtherFile") {
      let a = TestClass()
      return a.a;
    }

    Function("addNumbers") { (a: Double, b: Double) -> Int in
      return a + b
    }
    Class(TestClass.self) {
      Constructor { (a: Int) in
        TestClass(a)
      }

      Property("a") { (c: TestClass) in
        c.a
      }
    }
  }
}

public class TestClass{
  var a
}