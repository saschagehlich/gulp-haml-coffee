var map = require('map-stream');
var rext = require('replace-ext');
var _ = require('lodash');
var path = require('path');
var hamlc = require('haml-coffee');
var gutil = require('gulp-util');

module.exports = function(_options) {
  if(!_options) _options = {};

  // Map each file to this function
  function hamlStream(file, cb) {
    options = _.clone(_options);
    if (file.isNull()) return cb(null, file); // pass along
    if (file.isStream()) return cb(new Error("gulp-haml-coffee: Streaming not supported"));

    // gulp-haml-coffee compiles to plain HTML per default. If the `js` option is set,
    // it will compile to a JS function.
    var output;

    // Define the default module name by substracting 
    // the fileBase from the filePath
    var filePath = path.normalize(file.path);
    var fileBase = path.normalize(file.base);
    var defaultModuleName = filePath.replace(fileBase, '');

    // If there is a function in options.name use it to 
    // evaluate 
    var evaluatedModuleName;
    if(options.name !== undefined && typeof options.name === 'function'){
      evaluatedModuleName = options.name(file)
    }else if(options.name !== undefined && typeof options.name === 'string'){
      evaluatedModuleName = options.name;
    }

    options.name = evaluatedModuleName || defaultModuleName;

    try {
      if (options.js) {
        output = hamlc.template(file.contents.toString("utf8"), options.name, options.namespace, options);
        file.path = rext(file.path, ".js");
      } else {
        output = hamlc.render(file.contents.toString("utf8"), options.locals || {}, options);
        file.path = rext(file.path, ".html");
      }
    } catch (e) {
      throw new gutil.PluginError('gulp-haml-coffee',
        'Error compiling ' + file.path + ': ' + e, {
        showStack: true
      });
    }

    file.contents = new Buffer(output);

    cb(null, file);
  }

  // Return a stream
  return map(hamlStream);
};
