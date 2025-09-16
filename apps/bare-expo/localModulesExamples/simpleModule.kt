package src.nested

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

public class simpleModule : Module() {
    override fun definition() = ModuleDefinition {
        Constant("test") { ->
            "Kotlin constant 1 new localModulesProvider"
        }
    }
}
