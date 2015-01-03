/*
 * Copyright © Jamie Mason, @fold_left,
 * https://github.com/JamieMason
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function() {

  var matchers = {};
  var priv = {};

  /**
   * @inner
   * @param  {Object} object
   * @param  {Function} fn
   */
  priv.each = function(object, fn) {
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        fn.call(this, object[key], key, object);
      }
    }
  };

  /**
   * @inner
   * @param  {Object} object
   * @param  {Function} fn
   * @param  {*} memo
   * @return {*} memo
   */
  priv.reduce = function(object, fn, memo) {
    priv.each.call(this, object, function(el, ix, list) {
      memo = fn(memo, el, ix, list);
    });
    return memo;
  };

  /**
   * @inner
   * @param  {Array} array
   * @param  {Function} fn
   * @return {Boolean}
   */
  priv.all = function(array, fn) {
    var i;
    var len = array.length;
    for (i = 0; i < len; i++) {
      if (fn.call(this, array[i], i, array) === false) {
        return false;
      }
    }
    return true;
  };

  /**
   * @inner
   * @param  {String} matcherName
   * @return {Boolean}
   */
  priv.expectAllMembers = function(matcherName) {
    return priv.all.call(this, this.actual, function(item) {
      return matchers[matcherName].call({
        actual: item
      });
    });
  };

  /**
   * Assert subject is of type
   * @inner
   * @param  {*} subject
   * @param  {String} type
   * @return {Boolean}
   */
  priv.is = function(subject, type) {
    return Object.prototype.toString.call(subject) === '[object ' + type + ']';
  };

  /**
   * Assert subject is an HTML Element with the given node type
   * @inner
   * @param  {*} subject
   * @param  {String} type
   * @return {Boolean}
   */
  priv.isHtmlElementOfType = function(subject, type) {
    return subject &&
      subject.nodeType === type;
  };

  /**
   * Convert Array-like Object to true Array
   * @inner
   * @param  {*} list
   * @return {Array}
   */
  priv.toArray = function(list) {
    return [].slice.call(list);
  };

  /**
   * @inner
   * @param  {String} matcherName
   * @param  {String} memberName
   * @return {Boolean}
   */
  priv.assertMember = function( /* matcherName, memberName, ... */ ) {
    var args = priv.toArray(arguments);
    var matcherName = args.shift();
    var memberName = args.shift();
    return priv.is(this.actual, 'Object') &&
      matchers[matcherName].apply({
        actual: this.actual[memberName]
      }, args);
  };

  /**
   * @summary
   * Format the failure message for member matchers such as toHaveString('surname').
   *
   * @inner
   * @param  {Object}  util   Provided by Jasmine.
   * @param  {String}  name   Name of the matcher, such as toBeString.
   * @param  {Array}   args   converted arguments.
   * @param  {Boolean} pass   Whether the test passed.
   * @param  {*}       actual The expected value.
   * @return {String}         The message to display on failure.
   */
  priv.formatFailMessage = function(util, name, args, pass, actual) {
    if (name.search(/^toHave/) === -1) {
      return util.buildFailureMessage.apply(null, [name, pass, actual].concat(args));
    }
    var memberName = args.shift();
    return util.buildFailureMessage.apply(null, [name, pass, actual].concat(args))
      .replace('Expected', 'Expected member "' + memberName + '" of')
      .replace(' to have ', ' to be ');
  };

  /**
   * @summary
   * Convert Jasmine 1.0 matchers into the format introduced in Jasmine 2.0.
   *
   * @inner
   * @param  {Object} v1Matchers
   * @return {Object} v2Matchers
   */
  priv.adaptMatchers = function(v1Matchers) {
    return priv.reduce(v1Matchers, function(v2Matchers, matcher, name) {
      v2Matchers[name] = function(util) {
        return {
          compare: function(actual /*, expected, ...*/ ) {
            var args = priv.toArray(arguments).slice(1);
            var pass = matcher.apply({
              actual: actual
            }, args);
            return {
              pass: pass,
              message: priv.formatFailMessage(util, name, args, pass, actual)
            };
          }
        };
      };
      return v2Matchers;
    }, {});
  };

  /**
   * @inner
   * @param {String} toBeX
   * @return {Function}
   */
  priv.createToBeArrayOfXsMatcher = function(toBeX) {
    return function() {
      return priv.is(this.actual, 'Array') &&
        priv.expectAllMembers.call(this, toBeX);
    };
  };

  /**
   * @inner
   *
   * @summary
   * Report how many instance members the given Object has.
   *
   * @param  {Object} object
   * @return {Number}
   */
  priv.countMembers = function(object) {
    return priv.reduce(object, function(memo /*, el, ix*/ ) {
      return memo + 1;
    }, 0);
  };

  /**
   * @alias    toBeArray
   * @summary  <code>expect(array).toBeArray();</code>
   */
  matchers.toBeArray = function() {
    return this.actual instanceof Array;
  };

  /**
   * @alias    toBeArrayOfSize
   * @summary  <code>expect(array).toBeArrayOfSize(size:Number);</code>
   */
  matchers.toBeArrayOfSize = function(size) {
    return priv.is(this.actual, 'Array') &&
      this.actual.length === size;
  };

  /**
   * @alias    toBeEmptyArray
   * @summary  <code>expect(array).toBeEmptyArray();</code>
   */
  matchers.toBeEmptyArray = function() {
    return matchers.toBeArrayOfSize.call(this, 0);
  };

  /**
   * @alias    toBeNonEmptyArray
   * @summary  <code>expect(array).toBeNonEmptyArray();</code>
   */
  matchers.toBeNonEmptyArray = function() {
    return priv.is(this.actual, 'Array') &&
      this.actual.length > 0;
  };

  /**
   * @alias    toBeArrayOfObjects
   * @summary  <code>expect(array).toBeArrayOfObjects();</code>
   */
  matchers.toBeArrayOfObjects = function() {
    return priv.is(this.actual, 'Array') &&
      priv.expectAllMembers.call(this, 'toBeObject');
  };

  /**
   * @alias    toBeArrayOfStrings
   * @summary  <code>expect(array).toBeArrayOfStrings();</code>
   */
  matchers.toBeArrayOfStrings = function() {
    return priv.is(this.actual, 'Array') &&
      priv.expectAllMembers.call(this, 'toBeString');
  };

  /**
   * @alias    toBeArrayOfNumbers
   * @summary  <code>expect(array).toBeArrayOfNumbers();</code>
   */
  matchers.toBeArrayOfNumbers = function() {
    return priv.is(this.actual, 'Array') &&
      priv.expectAllMembers.call(this, 'toBeNumber');
  };

  /**
   * @alias    toBeArrayOfBooleans
   * @summary  <code>expect(array).toBeArrayOfBooleans();</code>
   */
  matchers.toBeArrayOfBooleans = function() {
    return priv.is(this.actual, 'Array') &&
      priv.expectAllMembers.call(this, 'toBeBoolean');
  };

  /**
   * @alias    toBeBoolean
   * @summary  <code>expect(boolean).toBeBoolean();</code>
   */
  matchers.toBeBoolean = function() {
    return matchers.toBeTrue.call(this) ||
      matchers.toBeFalse.call(this);
  };

  /**
   * @alias    toBeTrue
   * @summary  <code>expect(boolean).toBeTrue();</code>
   */
  matchers.toBeTrue = function() {
    return this.actual === true ||
      this.actual instanceof Boolean &&
      this.actual.valueOf() === true;
  };

  /**
   * @alias    toBeFalse
   * @summary  <code>expect(boolean).toBeFalse();</code>
   */
  matchers.toBeFalse = function() {
    return this.actual === false ||
      this.actual instanceof Boolean &&
      this.actual.valueOf() === false;
  };

  /**
   * @alias    toBeWindow
   * @summary  <code>expect(window).toBeWindow();</code>
   */
  matchers.toBeWindow = function() {
    return this.actual &&
      typeof this.actual === 'object' &&
      this.actual.window === this.actual;
  };

  /**
   * @alias    toBeDocument
   * @summary  <code>expect(document).toBeDocument();</code>
   */
  matchers.toBeDocument = function() {
    return this.actual &&
      typeof this.actual === 'object' &&
      this.actual instanceof window.HTMLDocument;
  };

  /**
   * @alias    toBeHtmlNode
   * @summary  <code>expect(htmlElement).toBeHtmlNode();</code>
   */
  matchers.toBeHtmlNode = function() {
    return priv.isHtmlElementOfType(this.actual, 1);
  };

  /**
   * @alias    toBeHtmlTextNode
   * @summary  <code>expect(htmlElement).toBeHtmlTextNode();</code>
   */
  matchers.toBeHtmlTextNode = function() {
    return priv.isHtmlElementOfType(this.actual, 3);
  };

  /**
   * @alias    toBeHtmlCommentNode
   * @summary  <code>expect(htmlElement).toBeHtmlCommentNode();</code>
   */
  matchers.toBeHtmlCommentNode = function() {
    return priv.isHtmlElementOfType(this.actual, 8);
  };

  /**
   * @alias    toBeDate
   * @summary  <code>expect(date).toBeDate();</code>
   */
  matchers.toBeDate = function() {
    return this.actual instanceof Date;
  };

  /**
   * @alias    toBeIso8601
   * @summary  <code>expect(string).toBeIso8601();</code>
   */
  matchers.toBeIso8601 = function() {
    return matchers.toBeString.call(this) &&
      this.actual.length >= 10 &&
      new Date(this.actual).toString() !== 'Invalid Date' &&
      new Date(this.actual)
      .toISOString()
      .slice(0, this.actual.length) === this.actual;
  };

  /**
   * @alias    toBeBefore
   * @summary  <code>expect(date).toBeBefore(date);</code>
   */
  matchers.toBeBefore = function(date) {
    return matchers.toBeDate.call(this) &&
      matchers.toBeDate.call({
        actual: date
      }) &&
      this.actual.getTime() < date.getTime();
  };

  /**
   * @alias    toBeAfter
   * @summary  <code>expect(date).toBeAfter(date);</code>
   */
  matchers.toBeAfter = function(date) {
    return matchers.toBeBefore.call({
      actual: date
    }, this.actual);
  };

  /**
   * @alias    toThrowAnyError
   * @summary  <code>expect(function).toThrowAnyError();</code>
   */
  matchers.toThrowAnyError = function() {
    var threwError = false;
    try {
      this.actual();
    } catch (e) {
      threwError = true;
    }
    return threwError;
  };

  /**
   * @alias    toThrowErrorOfType
   * @summary  <code>expect(function).toThrowErrorOfType(type:String);</code>
   */
  matchers.toThrowErrorOfType = function(type) {
    var threwErrorOfType = false;
    try {
      this.actual();
    } catch (e) {
      threwErrorOfType = (e.name === type);
    }
    return threwErrorOfType;
  };

  /**
   * @alias    toBeNumber
   * @summary  <code>expect(number).toBeNumber();</code>
   */
  matchers.toBeNumber = function() {
    return !isNaN(parseFloat(this.actual)) &&
      !priv.is(this.actual, 'String');
  };

  /**
   * @alias    toBeEvenNumber
   * @summary  <code>expect(number).toBeEvenNumber();</code>
   */
  matchers.toBeEvenNumber = function() {
    return matchers.toBeNumber.call(this) &&
      this.actual % 2 === 0;
  };

  /**
   * @alias    toBeOddNumber
   * @summary  <code>expect(number).toBeOddNumber();</code>
   */
  matchers.toBeOddNumber = function() {
    return matchers.toBeNumber.call(this) &&
      this.actual % 2 !== 0;
  };

  /**
   * @alias    toBeCalculable
   * @summary  <code>expect(mixed).toBeCalculable();</code>
   *           <p>Assert subject can be used in Mathemetic calculations despite
   *           not being a Number, for example <code>"1" * "2" === 2</code> but
   *           <code>"wut?" * 2 === NaN</code>.</p>
   */
  matchers.toBeCalculable = function() {
    return !isNaN(this.actual * 2);
  };

  /**
   * @alias    toBeWithinRange
   * @summary  <code>expect(number).toBeWithinRange(floor:Number, ceiling:Number);</code>
   */
  matchers.toBeWithinRange = function(floor, ceiling) {
    return matchers.toBeNumber.call(this) &&
      this.actual >= floor &&
      this.actual <= ceiling;
  };

  /**
   * @alias    toBeWholeNumber
   * @summary  <code>expect(number).toBeWholeNumber();</code>
   */
  matchers.toBeWholeNumber = function() {
    return matchers.toBeNumber.call(this) &&
      (this.actual === 0 || this.actual % 1 === 0);
  };

  /**
   * @alias    toBeObject
   * @summary  <code>expect(object).toBeObject();</code>
   */
  matchers.toBeObject = function() {
    return this.actual instanceof Object;
  };

  /**
   * @alias    toBeEmptyObject
   * @summary  <code>expect(object).toBeEmptyObject();</code>
   */
  matchers.toBeEmptyObject = function() {
    return priv.is(this.actual, 'Object') &&
      priv.countMembers(this.actual) === 0;
  };

  /**
   * @alias    toBeNonEmptyObject
   * @summary  <code>expect(object).toBeNonEmptyObject();</code>
   */
  matchers.toBeNonEmptyObject = function() {
    return priv.is(this.actual, 'Object') &&
      priv.countMembers(this.actual) > 0;
  };

  /**
   * @alias    toImplement
   * @summary  <code>expect(object).toImplement(interface:Object);</code>
   *           <p>Assert subject is a true Object which features at least the same
   *           keys as <code>other</code> regardless of whether it also has other
   *           members.</p>
   */
  matchers.toImplement = function(other) {
    if (!priv.is(this.actual, 'Object') || !priv.is(other, 'Object')) {
      return false;
    }
    for (var key in other) {
      if (other.hasOwnProperty(key)) {
        if (key in this.actual) {
          continue;
        }
        return false;
      }
    }
    return true;
  };

  /**
   * @alias    toBeFunction
   * @summary  <code>expect(function).toBeFunction();</code>
   */
  matchers.toBeFunction = function() {
    return this.actual instanceof Function;
  };

  /**
   * @alias    toBeString
   * @summary  <code>expect(string).toBeString();</code>
   */
  matchers.toBeString = function() {
    return priv.is(this.actual, 'String');
  };

  /**
   * @alias    toBeEmptyString
   * @summary  <code>expect(string).toBeEmptyString();</code>
   */
  matchers.toBeEmptyString = function() {
    return this.actual === '';
  };

  /**
   * @alias    toBeNonEmptyString
   * @summary  <code>expect(string).toBeNonEmptyString();</code>
   */
  matchers.toBeNonEmptyString = function() {
    return matchers.toBeString.call(this) &&
      this.actual.length > 0;
  };

  /**
   * @alias    toBeHtmlString
   * @summary  <code>expect(string).toBeHtmlString();</code>
   */
  matchers.toBeHtmlString = function() {
    // <           start with opening tag "<"
    //  (          start group 1
    //    "[^"]*"  allow string in "double quotes"
    //    |        OR
    //    '[^']*'  allow string in "single quotes"
    //    |        OR
    //    [^'">]   cant contains one single quotes, double quotes and ">"
    //  )          end group 1
    //  *          0 or more
    // >           end with closing tag ">"
    return matchers.toBeString.call(this) &&
      this.actual.search(/<("[^"]*"|'[^']*'|[^'">])*>/) !== -1;
  };

  /**
   * @alias    toBeJsonString
   * @summary  <code>expect(string).toBeJsonString();</code>
   */
  matchers.toBeJsonString = function() {
    var isParseable;
    var json;
    try {
      json = JSON.parse(this.actual);
    } catch (e) {
      isParseable = false;
    }
    return isParseable !== false &&
      json !== null;
  };

  /**
   * @alias    toBeWhitespace
   * @summary  <code>expect(string).toBeWhitespace();</code>
   */
  matchers.toBeWhitespace = function() {
    return matchers.toBeString.call(this) &&
      this.actual.search(/\S/) === -1;
  };

  /**
   * @alias    toStartWith
   * @summary  <code>expect(string).toStartWith(expected:String);</code>
   */
  matchers.toStartWith = function(expected) {
    if (!matchers.toBeNonEmptyString.call(this) || !matchers.toBeNonEmptyString.call({
        actual: expected
      })) {
      return false;
    }
    return this.actual.slice(0, expected.length) === expected;
  };

  /**
   * @alias    toEndWith
   * @summary  <code>expect(string).toEndWith(expected:String);</code>
   */
  matchers.toEndWith = function(expected) {
    if (!matchers.toBeNonEmptyString.call(this) || !matchers.toBeNonEmptyString.call({
        actual: expected
      })) {
      return false;
    }
    return this.actual.slice(this.actual.length - expected.length, this.actual.length) === expected;
  };

  /**
   * @alias    toBeLongerThan
   * @summary  <code>expect(string).toBeLongerThan(other:String);</code>
   */
  matchers.toBeLongerThan = function(other) {
    return matchers.toBeString.call(this) &&
      matchers.toBeString.call({
        actual: other
      }) &&
      this.actual.length > other.length;
  };

  /**
   * @alias    toBeShorterThan
   * @summary  <code>expect(string).toBeShorterThan(other:String);</code>
   */
  matchers.toBeShorterThan = function(other) {
    return matchers.toBeString.call(this) &&
      matchers.toBeString.call({
        actual: other
      }) &&
      this.actual.length < other.length;
  };

  /**
   * @alias    toBeSameLengthAs
   * @summary  <code>expect(string).toBeSameLengthAs(other:String);</code>
   */
  matchers.toBeSameLengthAs = function(other) {
    return matchers.toBeString.call(this) &&
      matchers.toBeString.call({
        actual: other
      }) &&
      this.actual.length === other.length;
  };

  /**
   * @alias    toHaveArray
   * @summary  <code>expect(object).toHaveArray(key:String);</code>
   */
  matchers.toHaveArray = function(key) {
    return priv.assertMember.call(this, 'toBeArray', key);
  };

  /**
   * @alias    toHaveArrayOfBooleans
   * @summary  <code>expect(object).toHaveArrayOfBooleans(key:String);</code>
   */
  matchers.toHaveArrayOfBooleans = function(key) {
    return priv.assertMember.call(this, 'toBeArrayOfBooleans', key);
  };

  /**
   * @alias    toHaveArrayOfNumbers
   * @summary  <code>expect(object).toHaveArrayOfNumbers(key:String);</code>
   */
  matchers.toHaveArrayOfNumbers = function(key) {
    return priv.assertMember.call(this, 'toBeArrayOfNumbers', key);
  };

  /**
   * @alias    toHaveArrayOfObjects
   * @summary  <code>expect(object).toHaveArrayOfObjects(key:String);</code>
   */
  matchers.toHaveArrayOfObjects = function(key) {
    return priv.assertMember.call(this, 'toBeArrayOfObjects', key);
  };

  /**
   * @alias    toHaveArrayOfSize
   * @summary  <code>expect(object).toHaveArrayOfSize(key:String, size:Number);</code>
   */
  matchers.toHaveArrayOfSize = function(key, size) {
    return priv.assertMember.call(this, 'toBeArrayOfSize', key, size);
  };

  /**
   * @alias    toHaveNonEmptyArray
   * @summary  <code>expect(object).toHaveNonEmptyArray(key:String);</code>
   */
  matchers.toHaveNonEmptyArray = function(key) {
    return priv.assertMember.call(this, 'toBeNonEmptyArray', key);
  };

  /**
   * @alias    toHaveEmptyArray
   * @summary  <code>expect(object).toHaveEmptyArray(key:String);</code>
   */
  matchers.toHaveEmptyArray = function(key) {
    return priv.assertMember.call(this, 'toBeEmptyArray', key);
  };

  /**
   * @alias    toHaveArrayOfStrings
   * @summary  <code>expect(object).toHaveArrayOfStrings(key:String);</code>
   */
  matchers.toHaveArrayOfStrings = function(key) {
    return priv.assertMember.call(this, 'toBeArrayOfStrings', key);
  };

  /**
   * @alias    toHaveBoolean
   * @summary  <code>expect(object).toHaveBoolean(key:String);</code>
   */
  matchers.toHaveBoolean = function(key) {
    return priv.assertMember.call(this, 'toBeBoolean', key);
  };

  /**
   * @alias    toHaveFalse
   * @summary  <code>expect(object).toHaveFalse(key:String);</code>
   */
  matchers.toHaveFalse = function(key) {
    return priv.assertMember.call(this, 'toBeFalse', key);
  };

  /**
   * @alias    toHaveTrue
   * @summary  <code>expect(object).toHaveTrue(key:String);</code>
   */
  matchers.toHaveTrue = function(key) {
    return priv.assertMember.call(this, 'toBeTrue', key);
  };

  /**
   * @alias    toHaveHtmlNode
   * @summary  <code>expect(object).toHaveHtmlNode(key:String);</code>
   */
  matchers.toHaveHtmlNode = function(key) {
    return priv.assertMember.call(this, 'toBeHtmlNode', key);
  };

  /**
   * @alias    toHaveDate
   * @summary  <code>expect(object):toHaveDate(key:String);</code>
   */
  matchers.toHaveDate = function(key) {
    return priv.assertMember.call(this, 'toBeDate', key);
  };

  /**
   * @alias    toHaveDateAfter
   * @summary  <code>expect(object):toHaveDateAfter(key:String, date:Date);</code>
   */
  matchers.toHaveDateAfter = function(key, date) {
    return priv.assertMember.call(this, 'toBeAfter', key, date);
  };

  /**
   * @alias    toHaveDateBefore
   * @summary  <code>expect(object):toHaveDateBefore(key:String, date:Date);</code>
   */
  matchers.toHaveDateBefore = function(key, date) {
    return priv.assertMember.call(this, 'toBeBefore', key, date);
  };

  /**
   * @alias    toHaveIso8601
   * @summary  <code>expect(object):toHaveIso8601(key:String);</code>
   */
  matchers.toHaveIso8601 = function(key) {
    return priv.assertMember.call(this, 'toBeIso8601', key);
  };

  /**
   * @alias    toHaveNumber
   * @summary  <code>expect(object):toHaveNumber(key:String);</code>
   */
  matchers.toHaveNumber = function(key) {
    return priv.assertMember.call(this, 'toBeNumber', key);
  };

  /**
   * @alias    toHaveNumberWithinRange
   * @summary  <code>expect(object):toHaveNumberWithinRange(key:String, floor:Number, ceiling:Number);</code>
   */
  matchers.toHaveNumberWithinRange = function(key, floor, ceiling) {
    return priv.assertMember.call(this, 'toBeWithinRange', key, floor, ceiling);
  };

  /**
   * @alias    toHaveCalculable
   * @summary  <code>expect(object):toHaveCalculable(key:String);</code>
   */
  matchers.toHaveCalculable = function(key) {
    return priv.assertMember.call(this, 'toBeCalculable', key);
  };

  /**
   * @alias    toHaveEvenNumber
   * @summary  <code>expect(object):toHaveEvenNumber(key:String);</code>
   */
  matchers.toHaveEvenNumber = function(key) {
    return priv.assertMember.call(this, 'toBeEvenNumber', key);
  };

  /**
   * @alias    toHaveOddNumber
   * @summary  <code>expect(object):toHaveOddNumber(key:String);</code>
   */
  matchers.toHaveOddNumber = function(key) {
    return priv.assertMember.call(this, 'toBeOddNumber', key);
  };

  /**
   * @alias    toHaveWholeNumber
   * @summary  <code>expect(object):toHaveWholeNumber(key:String);</code>
   */
  matchers.toHaveWholeNumber = function(key) {
    return priv.assertMember.call(this, 'toBeWholeNumber', key);
  };

  /**
   * @alias    toHaveMethod
   * @summary  <code>expect(object).toHaveMethod(key:String);</code>
   */
  matchers.toHaveMethod = function(key) {
    return priv.assertMember.call(this, 'toBeFunction', key);
  };

  /**
   * @alias    toHaveObject
   * @summary  <code>expect(object).toHaveObject(key:String);</code>
   */
  matchers.toHaveObject = function(key) {
    return priv.assertMember.call(this, 'toBeObject', key);
  };

  /**
   * @alias    toHaveEmptyObject
   * @summary  <code>expect(object).toHaveEmptyObject(key:String);</code>
   */
  matchers.toHaveEmptyObject = function(key) {
    return priv.assertMember.call(this, 'toBeEmptyObject', key);
  };

  /**
   * @alias    toHaveNonEmptyObject
   * @summary  <code>expect(object).toHaveNonEmptyObject(key:String);</code>
   */
  matchers.toHaveNonEmptyObject = function(key) {
    return priv.assertMember.call(this, 'toBeNonEmptyObject', key);
  };

  /**
   * @alias    toHaveMember
   * @summary  <code>expect(object).toHaveMember(key:String);</code>
   */
  matchers.toHaveMember = function(key) {
    return key && priv.is(this.actual, 'Object') &&
      key in this.actual;
  };

  /**
   * @alias    toHaveEmptyString
   * @summary  <code>expect(object):toHaveEmptyString(key:String);</code>
   */
  matchers.toHaveEmptyString = function(key) {
    return priv.assertMember.call(this, 'toBeEmptyString', key);
  };

  /**
   * @alias    toHaveHtmlString
   * @summary  <code>expect(object):toHaveHtmlString(key:String);</code>
   */
  matchers.toHaveHtmlString = function(key) {
    return priv.assertMember.call(this, 'toBeHtmlString', key);
  };

  /**
   * @alias    toHaveJsonString
   * @summary  <code>expect(object):toHaveJsonString(key:String);</code>
   */
  matchers.toHaveJsonString = function(key) {
    return priv.assertMember.call(this, 'toBeJsonString', key);
  };

  /**
   * @alias    toHaveNonEmptyString
   * @summary  <code>expect(object):toHaveNonEmptyString(key:String);</code>
   */
  matchers.toHaveNonEmptyString = function(key) {
    return priv.assertMember.call(this, 'toBeNonEmptyString', key);
  };

  /**
   * @alias    toHaveString
   * @summary  <code>expect(object):toHaveString(key:String);</code>
   */
  matchers.toHaveString = function(key) {
    return priv.assertMember.call(this, 'toBeString', key);
  };

  /**
   * @alias    toHaveStringLongerThan
   * @summary  <code>expect(object):toHaveStringLongerThan(key:String, other:String);</code>
   */
  matchers.toHaveStringLongerThan = function(key, other) {
    return priv.assertMember.call(this, 'toBeLongerThan', key, other);
  };

  /**
   * @alias    toHaveStringSameLengthAs
   * @summary  <code>expect(object):toHaveStringSameLengthAs(key:String, other:String);</code>
   */
  matchers.toHaveStringSameLengthAs = function(key, other) {
    return priv.assertMember.call(this, 'toBeSameLengthAs', key, other);
  };

  /**
   * @alias    toHaveStringShorterThan
   * @summary  <code>expect(object):toHaveStringShorterThan(key:String, other:String);</code>
   */
  matchers.toHaveStringShorterThan = function(key, other) {
    return priv.assertMember.call(this, 'toBeShorterThan', key, other);
  };

  /**
   * @alias    toHaveWhitespaceString
   * @summary  <code>expect(object):toHaveWhitespaceString(key:String);</code>
   */
  matchers.toHaveWhitespaceString = function(key) {
    return priv.assertMember.call(this, 'toBeWhitespace', key);
  };

  // Create adapters for the original matchers so they can be compatible with Jasmine 2.0.
  var matchersV2 = priv.adaptMatchers(matchers);

  beforeEach(function() {
    if (typeof this.addMatchers === 'function') {
      this.addMatchers(matchers);
    } else if (typeof jasmine.addMatchers === 'function') {
      jasmine.addMatchers(matchersV2);
    }
  });

}());
