var fs = require("fs");
function fswrite(l, o) {
  var a = typeof o == "object" ? Js(o) : o;
  fs.createWriteStream(l).write(a);
  clg("fs write successfully!!");
  a = "";
}
function fsread(l) {
  if (!edey(l)) return "";
  return fs.readFileSync(l, "utf8");
}
function fsdelete(l) {
  if (!edey(l)) return;
  fs.unlink(l, function (err) {
    if (!err) console.log("unlinked");
  });
}

function edey(l) {
  return fs.existsSync(l);
}

function cta(o) {
  var a = [];
  for (var i in o) a.push(i);
  return a;
}
function cto(a, v) {
  var o = {};
  for (var i = 0; i < ocn(a); i++) {
    o[a[i]] = v ? v : "";
  }
  return o;
}
function datemap(dm = "") {
  var y = date("y", dm),
    m = date("m", dm),
    d = date("dt", dm),
    o = {
      ls: date("ls"),
      is: date("is"),
      f: date("f", dm),
      y: y,
      m: m,
      d: d,
      dy: date("dy", dm),
      h: date("h", dm),
      mn: date("mn", dm),
      s: date("s", dm),
      ms: date("ms", dm),
      t: date("f", dm).split(" ")[4],
      key: date("v"),
    };
  return o;
}
function date(r, dm) {
  var o = dm ? dm : new Date(),
    v;
  if (r === "f") v = o.toString().split("+")[0];
  if (r === "m") v = o.getMonth();
  if (r === "y") v = o.getFullYear();
  if (r === "dt") v = o.getDate();
  if (r === "dy") v = o.getDay();
  if (r === "do") v = o;
  if (r === "h") v = o.getHours();
  if (r === "mn") v = o.getMinutes();
  if (r === "s") v = o.getSeconds();
  if (r === "ms") v = o.getMilliseconds();
  if (r == "is") v = o.toISOString();
  if (r == "st") v = o.toString();
  if (r == "ls") v = o.toLocaleString();
  if (r == "st") v = o.toString();
  if (r == "v") v = o.valueOf();
  return v;
}
function $$$(e, i, c, at, y) {
  var d = document.createElement(e);
  if (i) d.id = i;
  if (c) d.className = c;
  attme(d, at);
  if (y) feedme(d, y);
  return d;
}
function attme(c, o) {
  if (!o) return;
  for (var i in o) c.setAttribute(i, o[i]);
}
function feedme(p, c) {
  if (!p || !c) return;
  if (typeof c === "string" || typeof c === "number") {
    p.innerHTML += c;
  } else {
    for (var i in c) if (c[i]) APP(p, c[i]);
  }
}
function APP(p, c) {
  if (!p || !c) return;
  try {
    p.appendChild(c);
  } catch (err) {
    var pi = iso(p) && p.id ? p.id : "",
      ci = iso(c) && c.id ? p.id : "";
    console.log(pi + "-----" + ci);
  }
}
var iso = (el) => {
  return typeof el === "object";
};
function clg(t, ex) {
  console.log(t, ex);
}
function ocn(o) {
  var c = 0;
  for (var i in o) {
    c += 1;
  }
  return c;
}
function rnd(f, r, nt) {
  if (!f) return nt ? "" : 0;
  if (f && !r) return f;
  var s = f.toString(),
    w = isfra(f),
    x,
    y,
    z,
    b,
    g,
    h,
    j;
  if (!w) return f;
  j = dome();
  s = j.toString();
  h = s.split(".");
  if (ocn(h[1]) > r) j = dome();
  return j;
  function dome() {
    s = s.split(".");
    y = s[1];
    if (r >= ocn(y)) return parseFloat(s[0] + "." + y);
    b = ocn(y);
    w = y.slice(0, r);
    x = y.slice(r, b).split("");
    if (parse(x[0]) > 4) {
      z = parse(w.charAt(ocn(w) - 1)) + 1;
      z = w.slice(0, ocn(w) - 1) + "" + z;
      return parseFloat(s[0] + "." + z);
    }
    for (var i = ocn(x) - 1; i > -1; i--)
      if (i != 0)
        if (parse(x[i]) > 4 && parse(x[i - 1]) != 9)
          x[i - 1] = parse(x[i - 1]) + 1;
    if (parse(x[0]) > 4) {
      z = parse(w.charAt(ocn(w) - 1)) + 1;
      z = w.slice(0, ocn(w) - 1) + "" + z;
      return parseFloat(s[0] + "." + z);
    }
    return parseFloat(s[0] + "." + w);
  }
}
function revarray(v) {
  var c = [],
    r = "";
  for (var i = ocn(v) - 1; i > -1; i--) c.push(v[i]);
  return c;
}
var flashbox = (v, ia, r) => {
  var h = small("Notice", "blue").e,
    rd = colbox("nopad", 3, 2, 4, 11),
    eo = { e: rd, f1: myf1 },
    it,
    x1,
    y = 0.8,
    zz = {};
  APP(document.body, rd);
  rootstyle(
    rd,
    "position:fixed;overflow:hidden;z-index:99999999999999;right:.3em;top:3em;width:39%;"
  );
  function myf1(v, ia, r) {
    y = 0.5;
    var k = "flash-" + datemap().key + (ocn(zz) + 1),
      x1 = sect(
        r ? "bred" : "bgreen",
        "ohidden my-2 px-2 py-3 widthun white animated zoomIn",
        "",
        [
          par(
            [
              strong([icon2(r ? "fminode" : "fplnode", "white")]).e,
              small(v, "white", "font13").e,
            ],
            "pad2"
          ),
        ]
      ),
      x2;
    zz[k] = x1;
    clg(k);
    APP(rd, x1);
    rootstyle(
      x1,
      "border-radius:.2em;overflow:hidden;z-index:99999999999999;box-shadow:.2em .5em .4em #bbba;transition:opacity:.4s;"
    );
    x2 = setTimeout(() => {
      myfx(k);
      clearTimeout(x2);
    }, 90);
    clg(k);
  }
  function myfx(k) {
    if (!zz[k]) return;
    var it = ia
        ? setInterval(() => {
            y = y - 0.1;
            zz[k].style.opacity = y;
            if (y < 0.1) clearInterval(it);
          }, 100)
        : "",
      x1 = setTimeout(() => {
        if (zz[k]) X(zz[k]);
        delete zz[k];
        clearTimeout(x1);
      }, 3000);
  }
  return eo;
};
var strong = (tx, id, c, at) => {
  var rd = $$$("strong", id, c, at),
    eo = {};
  eo.e = rd;
  typeof tx === "string" || typeof tx === "number"
    ? (rd.innerHTML = tx)
    : feedme(rd, tx);
  return eo;
};
var small = (tx, id, c, at) => {
  var rd = $$$("small", id, c, at),
    eo = {};
  eo.e = rd;
  typeof tx === "string" || typeof tx === "number"
    ? (rd.innerHTML = tx)
    : feedme(rd, tx);
  return eo;
};
var sup = (tx, id, c, at) => {
  var rd = $$$("sup", id, c, at),
    eo = { e: rd };
  typeof tx === "string" || typeof tx === "number"
    ? (rd.innerHTML = tx)
    : feedme(rd, tx);
  return eo;
};
var sub = (tx, id, c, at) => {
  var rd = $$$("sub", id, c, at),
    eo = { e: rd };
  typeof tx === "string" || typeof tx === "number"
    ? (rd.innerHTML = tx)
    : feedme(rd, tx);
  return eo;
};
var center = (tx, id, c, at) => {
  var rd = $$$("center", id, c, at),
    eo = {};
  eo.e = rd;
  typeof tx === "string" ? (rd.innerHTML = tx) : feedme(rd, tx);
  return eo;
};
var colbox = function (id, l, m, s, x, cl, c, at) {
  var rd = DIV(
    id,
    "col-lg-" + l + " col-md-" + m + " col-sm-" + s + " col-xs-" + x + " colbox"
  );
  if (cl) for (var i in cl) APP(rd, cl[i]);
  if (c) addclass(rd, c);
  if (at) attme(rd, at);
  return rd;
};
var DIV = (id, c, at, cl) => {
  var rd = $$$("div", id, c);
  attme(rd, at);

  if (cl) feedme(rd, cl);
  return rd;
};
var sect = (id, c, at, cl) => {
  var rd = $$$("section", id, c);
  attme(rd, at);

  if (cl) feedme(rd, cl);
  return rd;
};
var par = function (tx, id, c, at) {
  var p = $$$("p", id, c);
  attme(p, at);
  if (typeof tx != "object") {
    p.innerHTML = tx ? tx : "";
  } else {
    feedme(p, tx);
  }
  return p;
};
var anc = function (rf, cn, cl, id, ro) {
  var a = $$$("a", id, cl);
  if (rf) a.href = rf;
  if (cn) {
    if (typeof cn != "object") {
      a.innerHTML = cn;
    } else {
      feedme(a, cn);
    }
  }
  attme(a, ro);
  return a;
};
var icon2 = (v, i, c, at) => {
  var a = $$$("i", i, INC[v]);
  if (c) addclass(a, c);
  if (at) attme(a, at);
  return a;
};
function addclass(e, c) {
  e.className = claz(e) ? claz(e) + " " + c : c;
}
function claz(c) {
  return c.className;
}
function rootstyle(e, o) {
  attme(e, { style: o });
}
function X(c) {
  if (c.parentNode) POP(c.parentNode, c);
}
function POP(p, c) {
  p.removeChild(c);
}
function capname(n) {
  if (n.length === 1) return n.toUpperCase();
  var a = n.charAt(0).toUpperCase(),
    b = n.slice(1, n.length).toLowerCase(),
    c = a + b;
  return c;
}
function acronym(w) {
  var a = w.split("."),
    s = true;
  if (ocn(a) > 1) {
    for (var i in a)
      if (ocn(a[i]) > 1) {
        s = false;
        break;
      }
  } else {
    s = false;
  }
  return s;
}
function cleaname(n) {
  if (!n) return "";
  if (parseInt(n) || typeof n === "number") return n;
  var a = n.split(" "),
    c = "",
    d = [];
  for (var i = 0; i < a.length; i++) {
    if (a[i]) {
      d.push(acronym(a[i]) ? a[i].toUpperCase() : capname(a[i]));
    }
  }
  for (var k = 0; k < d.length; k++) {
    if (k === d.length - 1) {
      c += d[k];
    } else {
      c += d[k] + " ";
    }
  }
  if (acronym(c)) return c.toUpperCase();
  return c;
}
function cleantxt(n) {
  if (!n) return "";
  if (parseInt(n) || typeof n === "number") return n;
  var a = n.split(" "),
    c = "",
    d = [];
  for (var i = 0; i < a.length; i++) {
    if (a[i]) {
      d.push(a[i]);
    }
  }
  for (var k = 0; k < d.length; k++) {
    if (k === d.length - 1) {
      c += d[k];
    } else {
      c += d[k] + " ";
    }
  }
  return c;
}
function joinus(a) {
  var v = "";
  for (var i in a) {
    v = v + "" + a[i];
  }
  return v;
}
function ee(e) {
  var r = e || window.event;
  r = e.target || e.srcElement;
  return r;
}
function mrgarrays(a, b) {
  var o = {};
  for (var i in a) o[a[i]] = b[i];
  return o;
}
function jp(s) {
  if (!s) return "";
  if (typeof s == "object") return s;
  var o;
  try {
    o = JSON.parse(s);
    return o;
  } catch (err) {
    return false;
  }
}
function Js(o) {
  return JSON.stringify(o);
}
function isfra(n) {
  var r = false;
  n = n.toString();
  if (n.indexOf(".") > 0) {
    r = true;
  }
  return r;
}
function parse(s) {
  if (!s) return "";
  var t = s.toString();
  if (isfra(t)) {
    return parseFloat(s);
  } else {
    return parseInt(s);
  }
}
function clonetxt(tx) {
  if (typeof tx != "string") return tx;
  var a = tx.split(""),
    b = "";
  for (var i in a) b += a[i];

  return b;
}
function clonea(a) {
  var r = [];
  for (var i in a) r.push(a[i]);
  return r;
}
function cloneo(a) {
  if (!a) return {};
  var x = jp(clonetxt(Js(a))),
    r = {};
  for (var i in a) r[i] = x[i];
  return r;
}
function barme(t) {
  if (!t) return "0";
  var k = typeof t == "number" ? unbar(t.toString()) : unbar(t),
    s = k,
    a = [],
    x,
    y,
    cx = s.length,
    st = "";
  if (s.length < 4) return s;
  for (var i = 0; i < cx; i++) {
    a.unshift(s.slice(s.length - 3, s.length));
    s = s.slice(0, s.length - 3);
    if (s.length < 4) {
      a.unshift(s);
      break;
    }
  }
  for (var i in a) {
    st += a[i] + ",";
  }
  st = st.slice(0, st.length - 1);
  return st;
}
function unbar(t) {
  if (!t) return;
  var x = t,
    r = "";
  x = x.replace("N", "");
  x = x.split(",");
  for (var i in x) {
    r += x[i];
  }
  return r;
}
function ourids(o) {
  var a = {};
  for (var i in o) {
    if (!o[i].id || o[i].id == "undefined") continue;
    a[o[i].id] = i;
  }

  return a;
}
function ov2a(o) {
  return Object.values(o);
}
function unspace(a) {
  var b = a.split(" "),
    c = "";
  for (var i in b) c += b[i];
  return c;
}

async function enrollmentProgress(enrollment) {
  if (!enrollment) {
    return;
  }

  let modulecount = 0;
  let moduledone = 0;

  let modules = enrollment.moduleProgress;

  for (let module of modules) {
    let mo = module.contentProgress;
    modulecount += 1 + ocn(mo);
    if (ocn(modules[i].quizAttempt)) moduledone++;
    for (var v in mo) if (mo[v].completed) moduledone++;
  }

  // Calculate overall progress
  let progress =
    moduledone > 0 ? ((moduledone / modulecount) * 100).toFixed(1) : 0;

  return progress;
}
async function fixProgress(app) {
  const enrolls = await app.locals.db
    .collection("enrollments")
    .find()
    .toArray();
  for (var i in enrolls) myf1(enrolls[i]);

  async function myf1(enrollment) {
    if (!enrollment) {
      return;
    }

    let modulecount = 0;
    let moduledone = 0;

    let modules = enrollment.moduleProgress;

    for (var i in modules) {
      let mo = modules[i].contentProgress;
      modulecount += 1 + ocn(mo);
      if (ocn(modules[i].quizAttempt)) moduledone++;
      for (var v in mo) if (mo[v].completed) moduledone++;
    }

    // Calculate overall progress
    let progress =
      moduledone > 0 ? ((moduledone / modulecount) * 100).toFixed(1) : 0;

    if (parse(enrollment.progress) == progress) return;
    clg(
      `${enrollment.courseId}'s progress  from ${enrollment.progress} to`,
      progress
    );
    // Update enrollment in DB
    await app.locals.db.collection("enrollments").updateOne(
      { _id: enrollment._id },
      {
        $set: {
          progress: progress,
        },
      }
    );
    clg("enrollment data updated");
  }
}

function rfa(a, c) {
  let o = [];
  for (var i in a) if (a[i] != c) o.push(a[i]);
  return o;
}

module.exports = {
  datemap,
  ov2a,
  unspace,
  enrollmentProgress,
  fixProgress,
  barme,
  rfa,
  ourids,
  rnd,
  clonea,
  cloneo,
  clonetxt,
  date,
  $$$,
  clg,
  ocn,
  parse,
  mrgarrays,
  revarray,
  flashbox,
  cleaname,
  addclass,
  claz,
  rootstyle,
  cleantxt,
  joinus,
  anc,
  center,
  sup,
  Js,
  sub,
  ee,
  edey,
  cta,
  cto,
  fswrite,
  fsread,
  jp,
  fsdelete,
};
