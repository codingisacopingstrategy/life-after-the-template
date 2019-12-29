module.exports = function(grunt) {

    grunt.initConfig({
        less: {
            development: {
                files: {
                    "theme/html/html.css": "src/html/html.less",
                    "theme/epub/epub.css": "src/epub/epub.less",
                    "theme/pdf/pdf.css": "src/pdf/pdf.less",
                }
            },
        },
        watch: {
            styles: {
                files: ['src/**/*.less'], // which files to watch
                tasks: ['less'],
                options: {
                    nospawn: true,
                    livereload: true
                }
            },
        },
        exec: {
            push: 'git push origin master && git push gh master'
        },
        sshconfig : {
            someserver : {
                host : 'example.com',
                username : 'alice',
                privateKey: grunt.file.read("/Users/alice/.ssh/id_rsa")
            }
        },
        sshexec : {
            deploy : {
                command : [
                            'all',
                            'the --commands',
                            'you --need --on --your --server',
                           ].join(' && '),
                options : {
                    config : 'someserver'
                }
            }
        }
    });

    grunt.registerTask('default', ['less', 'sshexec:deploy']);
    grunt.registerTask('push', ['exec:push']);
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-ssh');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

};
