module.exports = function(grunt) {

grunt.config.init({
pkg: grunt.file.readJSON('package.json'),
  jshint: {
    all: ['lib/*.js', 'test/*.js', 'Gruntfile.js']
  }
});
	grunt.loadNpmTasks('grunt-contrib-jshint');  
 	grunt.registerTask('default', ['jshint']);
};