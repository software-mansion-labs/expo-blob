#!/usr/bin/env ruby

print('hejo')

require('xcodeproj')
project_path = '/Users/hubertb/Projects/expo/apps/sandbox/ios/sandbox.xcodeproj'
project = Xcodeproj::Project.open(project_path)

project.new_group('test_group')

# Xcodeproj::Project::Object::PBXSourcesBuildPhase.

main_target = project.targets().find { |t| t.name == 'sandbox' }
if main_target.nil?() 
    puts "target not found"
    exit
end

compileSourcesPhase = main_target.build_phases().find{ |p| p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)}

compileSourcesPhase.files.each do |f|
    puts f.file_ref
end

file_ref = project.new_file('/Users/hubertb/Projects/expo/apps/sandbox/testfile.swift')
compileSourcesPhase.add_file_reference(file_ref)

compileSourcesPhase.files.each do |f|
    puts f.file_ref
end

# project.targets() do |target|
#     if target.name() == 'sandbox' 
              
#     end    
# end
project.save(project_path)

# require('find')

# dir = '/Users/hubertb/Projects/expo/apps/sandbox/ios/localModules'
# abort("Directory '#{dir} does not exist.") unless Dir.exist?(dir)

# main_target = project.targets.first

# main_target.

# Find.find(dir) do |path|
#     if File.file?(path)
#         puts path

#     end
# end