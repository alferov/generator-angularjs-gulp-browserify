'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var util = require('util');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var objectAssign = require('object-assign');

// Helpers
var isArray = function(obj) {
  return Array.isArray(obj);
};

var isObject = function(obj) {
  return obj !== null && typeof obj === 'object';
};

// Perform a shallow copy of an object ignoring specified properties
var copyExcept = function(obj, except) {
  var result = {};

  if (!isArray(except) || !isObject(obj)) {
    return ;
  }

  for (var prop in obj) {
    if (except.indexOf(prop) >= 0 && obj.hasOwnProperty(prop)) {
      continue ;
    }
    result[prop] = obj[prop];
  }

  return result;
};

// Generator initialization
var Generator = module.exports = function() {
  yeoman.generators.Base.apply(this, arguments);
};

util.inherits(Generator, yeoman.generators.Base);

Generator.prototype.welcome = function() {
  if (!this.options['skip-welcome-message']) {
    this.log(yosay([
        chalk.red('Welcome!'),
        chalk.yellow(['You\'re using the fantastic generator for scaffolding an',
        'application with AngularJS, SASS, Gulp, and Browserify!'].join('\s'))
      ].join('\n')
    ));
  }
};

Generator.prototype.askForGeneratorName = function() {
  var done = this.async();
  var prompts = [{
    name: 'appname',
    message: 'What\'s the name of your app?',
    default: 'app'
  }];
  this.prompt(prompts, function(props) {
    this.appname = props.appname;
    done();
  }.bind(this));
};

Generator.prototype.copyAll = function() {
  var templateRoot = this.sourceRoot();
  var destinationRoot = this.destinationRoot();
  var files = glob.sync('**', { dot: true, nodir: true, cwd: templateRoot });
  var cp = this.copy;
  var exclude = ['package.json', '.gitignore', '.npmignore'];

  for (var i in files) {
    var file = files[i];

    if (exclude.indexOf(file) >= 0) {
      continue ;
    }

    var dest = path.join(destinationRoot, files[i]);
    cp.call(this, path.join(templateRoot, files[i]), dest);
  }
};

Generator.prototype.gitignore = function() {
  var templateRoot = this.sourceRoot();
  var done = this.async();

  var onGitignoreOpen = function(exists) {
    if (exists) {
      this.copy('.gitignore', '.gitignore');
      done();
    }
  };

  var onNpmignoreOpen = function(exists) {
    if (exists) {
      this.copy('.npmignore', '.gitignore');
      done();
    }
  };

  fs.exists(templateRoot + '/.gitignore', onGitignoreOpen.bind(this));
  fs.exists(templateRoot + '/.npmignore', onNpmignoreOpen.bind(this));
};

Generator.prototype.packageJSON = function() {
  var templateRoot = this.sourceRoot();
  var destinationRoot = this.destinationRoot();
  var packageJson = templateRoot + '/package.json';
  var done = this.async();

  var onPackageJsonSync = function(err, content) {
    var exclude = [
      'author',
      'repository',
      'private',
      'engines'
    ];

    var newValues = {
      name: this.appname,
      version: '1.0.0'
    }

    if (err) {
      this.log.error('Could not open package.json for reading.', err);
      done();
      return ;
    }

    try {
      var pkg = JSON.parse(content);
    } catch(err) {
      this.log.error('Could not parse package.json', err);
      done();
    }

    var copy = objectAssign(copyExcept(pkg, exclude), newValues);
    var json = JSON.stringify(copy, null, 2);
    var filename = destinationRoot + '/package.json';

    fs.writeFile(filename, json, done);
  };

  fs.readFile(packageJson, { encoding: 'utf-8' }, onPackageJsonSync.bind(this));
};

Generator.prototype.npm = function() {
  this.npmInstall();
};
