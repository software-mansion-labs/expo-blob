package local.modules;

import java.util.Arrays;
import java.util.List;

import expo.modules.kotlin.ModulesProvider;
import expo.modules.kotlin.modules.Module;

public class ExpoLocalModulesList implements ModulesProvider {
    private static class LazyHolder {
        static final List<Class<? extends Module>> modulesList = Arrays.<Class<? extends Module>>asList(
                local.modules.app.testView.class,
                src.nested.simpleModule.class
        );
    }

    @Override
    public List<Class<? extends Module>> getModulesList() {
        return local.modules.ExpoLocalModulesList.LazyHolder.modulesList;
    }
}
