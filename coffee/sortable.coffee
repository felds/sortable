SELECTOR = 'table[data-sortable]'

trimRegExp = /^\s+|\s+$/g

touchDevice = 'ontouchstart' of document.documentElement
clickEvent = if touchDevice then 'touchstart' else 'click'

addEventListener = (el, event, handler) ->
  if el.addEventListener?
    el.addEventListener event, handler, false
  else
    el.attachEvent "on#{ event }", handler

sortable =
  init: (options={}) ->
    options.selector ?= SELECTOR

    tables = document.querySelectorAll options.selector
    sortable.initTable table for table in tables

  initTable: (table) ->
    return if table.tHead?.rows.length isnt 1
    return if table.getAttribute('data-sortable-initialized') is 'true'

    table.setAttribute 'data-sortable-initialized', 'true'

    ths = table.querySelectorAll('th')

    for th, i in ths
      if th.getAttribute('data-sortable') isnt 'false'
        sortable.setupClickableTH table, th, i

    table

  setupClickableTH: (table, th, i) ->
    type = sortable.getColumnType table, i

    unless type?
      th.setAttribute 'data-sortable', false
      return

    addEventListener th, clickEvent, (e) ->
      sorted = @getAttribute('data-sorted') is 'true'
      sortedDirection = @getAttribute 'data-sorted-direction'

      if sorted
        newSortedDirection = if sortedDirection is 'ascending' then 'descending' else 'ascending'
      else
        newSortedDirection = type.defaultSortDirection

      ths = @parentNode.querySelectorAll('th')
      for th in ths
        th.setAttribute 'data-sorted', 'false'
        th.removeAttribute 'data-sorted-direction'

      @setAttribute 'data-sorted', 'true'
      @setAttribute 'data-sorted-direction', newSortedDirection

      tBody = table.tBodies[0]
      rowArray = []

      for row in tBody.rows
        rowArray.push [sortable.getNodeValue(row.cells[i]), row]

      if sorted
        rowArray.reverse()
      else
        rowArray.sort type.compare

      for rowArrayObject in rowArray
        tBody.appendChild rowArrayObject[1]

  getColumnType: (table, i) ->
    for row in table.tBodies[0].rows
      text = sortable.getNodeValue row.cells[i]
      for type in @types
        return type if type.isOfType text

  getNodeValue: (node) ->
    return '' if not node
    return node.getAttribute('data-value') if node.getAttribute('data-value') isnt null
    return node.innerText.replace(trimRegExp, '') if typeof node.innerText isnt 'undefined'
    node.textContent.replace trimRegExp, ''

  getType: (name) ->
    # not relying on Array.prototype.find since it was introduced in ES6 and
    # have bad browser support at this time
    # (consider changing it in the future)
    # @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find#Browser_compatibility
    matches = @types.filter (x) -> x.name is name
    matches[0] if matches.length

  getTypeIndex: (name) ->
    # not relying on Array.prototype.findIndex since it was introduced in ES6 and
    # have bad browser support at this time
    # (consider changing it in the future)
    # @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex#Browser_compatibility
    for v, k in @types
      return k if v.name is name

  insertTypeAfter: (name, type) ->
    typeIndex = @getTypeIndex name
    @types.splice typeIndex + 1, 0, type

  insertTypeBefore: (name, type) ->
    typeIndex = @getTypeIndex name
    @types.splice typeIndex, 0, type

  types: [
      name: 'numeric'
      isOfType: (a) ->
        numberRegExp = /^-?[£$¤]?[\d,.]+%?$/
        a.match numberRegExp
      defaultSortDirection: 'descending'
      compare: (a, b) ->
        aa = parseFloat(a[0].replace(/[^0-9.-]/g, ''), 10)
        bb = parseFloat(b[0].replace(/[^0-9.-]/g, ''), 10)
        aa = 0 if isNaN(aa)
        bb = 0 if isNaN(bb)
        bb - aa
    ,
      name: 'date'
      isOfType: (a) ->
        not isNaN Date.parse(a)
      defaultSortDirection: 'ascending'
      compare: (a, b) ->
        aa = Date.parse(a[0])
        bb = Date.parse(b[0])
        aa = 0 if isNaN(aa)
        bb = 0 if isNaN(bb)
        aa - bb
    ,
      name: 'alpha'
      isOfType: (a) -> true # default
      defaultSortDirection: 'ascending'
      compare: (a, b) ->
        a[0].localeCompare b[0]
  ]



setTimeout sortable.init, 0

window.Sortable = sortable
