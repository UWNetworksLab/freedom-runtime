(function() {
  console.log('injection executed.');
  var test = document.createElement('pre');
  test.innerHTML = 'Injection proof.';
  document.body.appendChild(test);
  window.addEventListener('message', function(m) {
    console.log('injection got message');
  });
})();
