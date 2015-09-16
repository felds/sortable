(function() {
  var SELECTOR, addEventListener, clickEvent, sortable, touchDevice, trimRegExp;

  SELECTOR = 'table[data-sortable]';

  trimRegExp = /^\s+|\s+$/g;

  touchDevice = 'ontouchstart' in document.documentElement;

  clickEvent = touchDevice ? 'touchstart' : 'click';

  addEventListener = function(el, event, handler) {
    if (el.addEventListener != null) {
      return el.addEventListener(event, handler, false);
    } else {
      return el.attachEvent("on" + event, handler);
    }
  };

  sortable = {
    init: function(options) {
      var table, tables, _i, _len, _results;
      if (options == null) {
        options = {};
      }
      if (options.selector == null) {
        options.selector = SELECTOR;
      }
      tables = document.querySelectorAll(options.selector);
      _results = [];
      for (_i = 0, _len = tables.length; _i < _len; _i++) {
        table = tables[_i];
        _results.push(sortable.initTable(table));
      }
      return _results;
    },
    initTable: function(table) {
      var i, th, ths, _i, _len, _ref;
      if (((_ref = table.tHead) != null ? _ref.rows.length : void 0) !== 1) {
        return;
      }
      if (table.getAttribute('data-sortable-initialized') === 'true') {
        return;
      }
      table.setAttribute('data-sortable-initialized', 'true');
      ths = table.querySelectorAll('th');
      for (i = _i = 0, _len = ths.length; _i < _len; i = ++_i) {
        th = ths[i];
        if (th.getAttribute('data-sortable') !== 'false') {
          sortable.setupClickableTH(table, th, i);
        }
      }
      return table;
    },
    setupClickableTH: function(table, th, i) {
      var type;
      if (th.getAttribute('data-sort-type')) {
        type = this.getType(th.getAttribute('data-sort-type'));
      } else {
        type = sortable.getColumnType(table, i);
      }
      if (type != null) {
        th.setAttribute('data-sort-type', type.name);
      } else {
        th.setAttribute('data-sortable', false);
        return;
      }
      return addEventListener(th, clickEvent, function(e) {
        var newSortedDirection, row, rowArray, rowArrayObject, sorted, sortedDirection, tBody, ths, _i, _j, _k, _len, _len1, _len2, _ref, _results;
        sorted = this.getAttribute('data-sorted') === 'true';
        sortedDirection = this.getAttribute('data-sorted-direction');
        if (sorted) {
          newSortedDirection = sortedDirection === 'ascending' ? 'descending' : 'ascending';
        } else {
          newSortedDirection = type.defaultSortDirection;
        }
        ths = this.parentNode.querySelectorAll('th');
        for (_i = 0, _len = ths.length; _i < _len; _i++) {
          th = ths[_i];
          th.setAttribute('data-sorted', 'false');
          th.removeAttribute('data-sorted-direction');
        }
        this.setAttribute('data-sorted', 'true');
        this.setAttribute('data-sorted-direction', newSortedDirection);
        tBody = table.tBodies[0];
        rowArray = [];
        _ref = tBody.rows;
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          row = _ref[_j];
          rowArray.push([sortable.getNodeValue(row.cells[i]), row]);
        }
        if (sorted) {
          rowArray.reverse();
        } else {
          rowArray.sort(type.compare);
        }
        _results = [];
        for (_k = 0, _len2 = rowArray.length; _k < _len2; _k++) {
          rowArrayObject = rowArray[_k];
          _results.push(tBody.appendChild(rowArrayObject[1]));
        }
        return _results;
      });
    },
    getColumnType: function(table, i) {
      var row, text, type, _i, _j, _len, _len1, _ref, _ref1;
      _ref = table.tBodies[0].rows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        text = sortable.getNodeValue(row.cells[i]);
        _ref1 = this.types;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          type = _ref1[_j];
          if (type.isOfType(text)) {
            return type;
          }
        }
      }
    },
    getNodeValue: function(node) {
      if (!node) {
        return '';
      }
      if (node.getAttribute('data-value') !== null) {
        return node.getAttribute('data-value');
      }
      if (typeof node.innerText !== 'undefined') {
        return node.innerText.replace(trimRegExp, '');
      }
      return node.textContent.replace(trimRegExp, '');
    },
    getType: function(name) {
      var matches;
      matches = this.types.filter(function(x) {
        return x.name === name;
      });
      if (matches.length) {
        return matches[0];
      }
    },
    getTypeIndex: function(name) {
      var k, v, _i, _len, _ref;
      _ref = this.types;
      for (k = _i = 0, _len = _ref.length; _i < _len; k = ++_i) {
        v = _ref[k];
        if (v.name === name) {
          return k;
        }
      }
    },
    insertTypeAfter: function(name, type) {
      var typeIndex;
      typeIndex = this.getTypeIndex(name);
      return this.types.splice(typeIndex + 1, 0, type);
    },
    insertTypeBefore: function(name, type) {
      var typeIndex;
      typeIndex = this.getTypeIndex(name);
      return this.types.splice(typeIndex, 0, type);
    },
    types: [
      {
        name: 'numeric',
        regexp: /^-?[£$¤]?[\d,.]+%?$/,
        isOfType: function(a) {
          return this.regexp.test(a);
        },
        defaultSortDirection: 'descending',
        compare: function(a, b) {
          var aa, bb;
          aa = parseFloat(a[0].replace(/[^0-9.-]/g, ''), 10);
          bb = parseFloat(b[0].replace(/[^0-9.-]/g, ''), 10);
          if (isNaN(aa)) {
            aa = 0;
          }
          if (isNaN(bb)) {
            bb = 0;
          }
          return bb - aa;
        }
      }, {
        name: 'semver',
        regexp: /\d+\.\d+\.\d+/,
        isOfType: function(a) {
          return this.regexp.test(a);
        },
        defaultSortDirection: 'descending',
        compare: function(a, b) {
          var k, na, nb, pa, pb, _i, _len;
          pa = a[0].split('.');
          pb = b[0].split('.');
          for (k = _i = 0, _len = pa.length; _i < _len; k = ++_i) {
            na = pa[k];
            na = Number(pa[k]);
            nb = Number(pb[k]);
            if (na > nb) {
              return 1;
            }
            if (nb > na) {
              return -1;
            }
            if (!isNaN(na) && isNaN(nb)) {
              return 1;
            }
            if (isNaN(na) && !isNaN(nb)) {
              return -1;
            }
          }
          return 0;
        }
      }, {
        name: 'date',
        regexp: null,
        isOfType: function(a) {
          if (this.regexp != null) {
            return this.regexp.test(a);
          } else {
            return !isNaN(Date.parse(a));
          }
        },
        defaultSortDirection: 'ascending',
        compare: function(a, b) {
          var aa, bb;
          aa = Date.parse(a[0]);
          bb = Date.parse(b[0]);
          if (isNaN(aa)) {
            aa = 0;
          }
          if (isNaN(bb)) {
            bb = 0;
          }
          return aa - bb;
        }
      }, {
        name: 'alpha',
        regexp: null,
        isOfType: function(a) {
          return true;
        },
        defaultSortDirection: 'ascending',
        compare: function(a, b) {
          return a[0].localeCompare(b[0]);
        }
      }
    ]
  };

  setTimeout(sortable.init, 0);

  window.Sortable = sortable;

}).call(this);
