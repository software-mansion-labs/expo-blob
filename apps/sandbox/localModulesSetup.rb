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



require 'xcodeproj'
project_path = '/Users/hubertb/Projects/expo-blob/apps/sandbox/ios/sandbox.xcodeproj'
project = Xcodeproj::Project.open(project_path)
main_target = project.targets().find { |t| t.name == 'sandbox' }
if main_target.nil?() 
    puts "target not found"
    exit
end


# Recursive function to print group contents
def print_references(group, indent = 0)
  puts "#{' ' * indent}Group: #{group.name}"
  
  # Iterate over child nodes of the group
  group.children.each do |child|
    if child.is_a?(Xcodeproj::Project::Object::PBXGroup)
      # Recursive call if the child is a group
      print_references(child, indent + 2)
    elsif child.is_a?(Xcodeproj::Project::Object::PBXFileReference)
      # Print details about the file reference
      puts "#{' ' * (indent + 2)}File: #{child.display_name} (#{child.path})"
    else
      # Optionally handle other types of references (e.g., frameworks)
      puts "#{' ' * (indent + 2)}Other Reference: #{child.display_name}"
    end
  end
end

# Start printing from the main group
puts "Project References:"
print_references(project.main_group)

folder_path = '/Users/hubertb/Projects/expo-blob/apps/sandbox/ios/localModules'
folder_reference = project.main_group.new_reference(folder_path, :group)

project.save(project_path)





# puts 2
# begin
#     require 'xcodeproj'
# rescue LoadError => e
#   puts "Failed to load xcodeproj: #{e.message}"
# end
# # puts RbConfig.ruby

# puts 3

# project_path = '/Users/hubertb/Projects/expo-blob/apps/sandbox/ios/sandbox.xcodeproj'
# project = Xcodeproj::Project.open(project_path)

# main_target = project.targets().find { |t| t.name == 'sandbox' }
# if main_target.nil?() 
#     puts "target not found"
#     exit
# end

# puts 5
# compileSourcesPhase = main_target.build_phases().find{ |p| p.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)}

# puts 6
# # require('find')

# dir = '/Users/hubertb/Projects/expo-blob/apps/sandbox/ios/localModules'
# abort("Directory '#{dir} does not exist.") unless Dir.exist?(dir)

# puts 7
# # localModulesGroup = project.new_group('localModules')
# # Find.find(dir) do |path|
# #     if File.file?(path)
# #         file_ref = localModulesGroup.new_file(path)
# #         compileSourcesPhase.add_file_reference(file_ref)
# #     end
# # end

# def mirrorStructureAndAddToCompileSources(path, group_now, compileSourcesPhase)
#     puts path
#     if File.directory?(path)
#         created_group = group_now.new_group(File.basename(path))
#         Dir.foreach(path) do |dirent|
#             next if dirent == '.' || dirent == '..'
#             dirent_full_path = File.join(path, dirent)                
#             mirrorStructureAndAddToCompileSources(dirent_full_path, created_group, compileSourcesPhase)
#         end
#     else
#         file_ref = group_now.new_file(File.readlink(path))
#         compileSourcesPhase.add_file_reference(file_ref)
#     end
# end

# puts 8
# mirrorStructureAndAddToCompileSources(dir, project.main_group, compileSourcesPhase)
# puts 9

# project.save(project_path)
# puts 10