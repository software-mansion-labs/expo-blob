#!/usr/bin/env ruby
# puts RUBY_ENGINE if defined?(RUBY_ENGINE)
# puts RUBY_VERSION
# puts RUBY_PLATFORM

# puts $LOAD_PATH
# puts "aaaaaaa"

# require 'rubygems'
# puts Gem.path  
# $LOAD_PATH.unshift('/Users/hubertb/Projects/expo/.direnv/ruby')
# puts $LOAD_PATH 
# puts "bbbbbbbbbb"

# puts $GEM_PATH
begin
    require 'xcodeproj'
rescue LoadError => e
  puts "Failed to load xcodeproj: #{e.message}"
end
# puts RbConfig.ruby


File.open("rb begin", "w") 

File.open('rb stats', "w") do |file|
    file.write(%x{echo $PATH})
    file.write('\n')
    file.write(%x{gem env})
end

require('xcodeproj')

project_path = '/Users/hubertb/Projects/expo/apps/sandbox/ios/sandbox.xcodeproj'
project = Xcodeproj::Project.open(project_path)

main_target = project.targets().find { |t| t.name == 'sandbox' }
if main_target.nil?() 
    puts "target not found"
    exit
end

compileSourcesPhase = main_target.build_phases().find{ |p| p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)}

# require('find')

dir = '/Users/hubertb/Projects/expo/apps/sandbox/ios/localModules'
abort("Directory '#{dir} does not exist.") unless Dir.exist?(dir)
 
# localModulesGroup = project.new_group('localModules')
# Find.find(dir) do |path|
#     if File.file?(path)
#         file_ref = localModulesGroup.new_file(path)
#         compileSourcesPhase.add_file_reference(file_ref)
#     end
# end

def mirrorStructureAndAddToCompileSources(path, group_now, compileSourcesPhase)
    if File.directory?(path)
        created_group = group_now.new_group(File.basename(path))
        Dir.foreach(path) do |dirent|
            next if dirent == '.' || dirent == '..'
            dirent_full_path = File.join(path, dirent)                
            mirrorStructureAndAddToCompileSources(dirent_full_path, created_group, compileSourcesPhase)
        end
    else
        file_ref = group_now.new_file(path)
        compileSourcesPhase.add_file_reference(file_ref)
    end
end

mirrorStructureAndAddToCompileSources(dir, project.main_group, compileSourcesPhase)

project.save(project_path)