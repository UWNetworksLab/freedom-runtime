freedom.on('render', function(page) {
  var result = "", i;
  for (i = 0; i < page[0]; i++) {
    result += i + ": " + page[1] + "\n";
  }
  freedom.emit('page', result);
});
