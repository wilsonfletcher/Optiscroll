/**
 * u.js plugin
 * create instance of Optiscroll
 * and when called again you can call functions
 * or change instance settings
 *
 * ```
 * u(el).optiscroll({ options })
 * u(el).optiscroll('method', arg)
 * ```
 */

(function (u) {

  var pluginName = 'optiscroll';

  u.fn[pluginName] = function(options) {
    var method, args;

    if( typeof options === 'string' ) {
      args = Array.prototype.slice.call(arguments);
      method = args.shift();
    }

    return this.each(function() {
      var _el = u(this);
      var inst = _el.data(pluginName);

      // start new optiscroll instance
      if(!inst) {
        inst = new window.Optiscroll(this, options || {});
        _el.data(pluginName, inst);
      }
      // allow exec method on instance
      else if( inst && typeof method === 'string' ) {
        inst[method].apply(inst, args);
        if(method === 'destroy') {
          _el.removeData(pluginName);
        }
      }
    });
  };

})( u );
