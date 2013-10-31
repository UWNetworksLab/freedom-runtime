benchmark performs the operations laid out at
http://ziutek.github.io/web_bench/
in order to allow performance comparison with those
python/go frameworks.

Namely, for url /<text>/number, respond with contents:
def get(self, txt, num):
  for i in xrange(int(num)):
    self.write("%d: %s\n" % (i, txt))