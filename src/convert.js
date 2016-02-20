//Enumerations
var IGNORE = "ignore";
var ERROR = -2;

//Class to store student mark data
function Student(lastName, firstName) {
  this.lastName = lastName || "";
  this.firstName = firstName || "";
  this.termMarks = [];
  this.term = 0;
  this.termFinal = 0;
  this.summativeMarks = [];
  this.summative = 0;
  this.examMarks = [];
  this.exam = 0;
  this.oldAvg = 0;
  this.finalAvg = 0;
}

function studentGrades(lines, termMarks) {
  //Converts a level to a percent
  var getPercent = function(str) {

    //Ignore the mark if there's no input
    if (!str) return IGNORE;

    //Removes unnecessary whitespace from CSV
    str = str.trim();

    //If the input was just a whitespace character (now removed), ignore the mark
    if (str === "") return IGNORE;

    //If the mark is written with the operator first (e.g. -4), reverse it (becomes 4-)
    //var operators = "+-";
    //if (operators.indexOf(str.substring(0, 1))!=-1) str = str.split("").reverse().join("");

    //If the program read in an input that isn't valid, return an error.
    if (termMarks[str] === undefined) return Dispatcher.emit("error", {message: `Not a valid level: ${str}`});

    //Return the corresponding percentage in the table
    return termMarks[str];
  }
  var results = [];

  var header = lines.shift();
  while (header[0] != "Type") {
    header = lines.shift();
    if (!header || !header.length || header.length<0) return Dispatcher.emit('error', {message: "Either \"Type\" is missing from the header row or the CSV uses the wrong deliminator."});
  }

  for (var h=0; h<header.length; h++) {
    header[h] = header[h].replace(/(\r\n|\n|\r)/gm,"");
  }

  //Parse student marks
  for (var row=0; row<lines.length; row++) {

    //Ignore blank lines or lines with no marks
    if (lines[row].length<=2) continue;

    //create a new Student and add any marks found in O.A, S, or E columns to their arrays
    var s = new Student(lines[row][0], lines[row][1]);
    for (var col=2; col<header.length; col++) {
      var percent = IGNORE;
      if (header[col].indexOf("O.A")===0 || header[col].indexOf("S")===0 || header[col].indexOf("E")===0) {
        percent = getPercent(lines[row][col]);
      }

      //Stop program on invalid input
      if (!percent && percent !== 0) {
        return;
      } else {
        if (header[col].indexOf("O.A")===0) {
          s.termMarks.push(percent);
        } else if (header[col].indexOf("S")===0 && header[col].length<=2) {
          s.summativeMarks.push(percent);
        } else if (header[col].indexOf("E")===0 && header[col].length<=2) {
          s.examMarks.push(percent);
        }
      }
    }

    //Average all marks in each category, but only if the marks for that category aren't all IGNORE.
    var ignored = 0;
    for (var i=0; i<s.termMarks.length; i++) {
      if (s.termMarks[i] != IGNORE && s.termMarks[i]>=0) {
        s.term += s.termMarks[i];
      } else {
        ignored++;
      }
    }
    if (ignored == s.termMarks.length) {
      s.term=IGNORE;
    } else {
      s.term /= (s.termMarks.length - ignored);
    }

    ignored=0;
    for (i=0; i<s.summativeMarks.length; i++) {
      if (s.summativeMarks[i]>=0) {
        s.summative += s.summativeMarks[i];
      } else {
        ignored++;
      }
    }
    if (ignored == s.summativeMarks.length) {
      s.summative=IGNORE;
    } else {
      s.summative /= (s.summativeMarks.length - ignored);
    }

    //For the post-exam term mark, if the nth exam mark is larger than the nth
    //term mark, calculate the average using that exam mark rather than the term mark.
    ignored=0;
    for (i=0; i<s.termMarks.length; i++) {
      if (s.examMarks[i] && (!s.termMarks[i] || s.termMarks[i] == IGNORE || (s.termMarks[i] && s.examMarks[i]>s.termMarks[i]))) {
        s.termFinal += s.examMarks[i];
      } else {
        if (s.termMarks[i] != IGNORE && s.termMarks[i]>=0) {
          s.termFinal += s.termMarks[i];
        } else {
          ignored++;
        }
      }
    }
    if (ignored == s.termMarks.length) {
      s.termFinal=IGNORE;
    } else {
      s.termFinal /= (s.termMarks.length - ignored);
    }

    ignored=0;
    for (i=0; i<s.examMarks.length; i++) {
      if (s.examMarks[i] != IGNORE && s.examMarks[i]>=0) {
        s.exam += s.examMarks[i];
      } else {
        ignored++;
      }
    }
    if (ignored == s.examMarks.length) {
      s.exam=IGNORE;
    } else {
      s.exam  /= (s.examMarks.length - ignored);
    }

    //Calculate final average using the post-exam term mark and
    //"old" average using the pre-exam term mark with appropriate
    //sectional weighting
    if (s.summative != IGNORE && s.exam != IGNORE) {
      s.finalAvg = s.termFinal*0.7 + s.summative*0.1 + s.exam*0.2;
      s.oldAvg = s.term*0.7 + s.summative*0.1 + s.exam*0.2;
    } else if (s.summative != IGNORE && s.exam == IGNORE) {
      s.finalAvg = s.termFinal*0.7 + s.summative*0.3;
      s.oldAvg = s.term*0.7 + s.summative*0.3;
    } else if (s.summative == IGNORE && s.exam != IGNORE) {
      s.finalAvg = s.termFinal*0.7 + s.exam*0.3;
      s.oldAvg = s.term*0.7 + s.exam*0.3;
    } else {
      s.finalAvg = s.termFinal;
      s.oldAvg = s.term;
    }

    //Add the student to the list of results
    results.push(s);
  }

  console.log(results.map((s)=>s.oldAvg));
  return [
    ['Student', 'Term', 'Term Post-Exam', 'Summative', 'Exam', 'Old Final', 'Final']
  ].concat(results.map((s) => [
    `${s.lastName}, ${s.firstName}`,
    (s.term != IGNORE) ? (s.term.toFixed(2) + "%") : "---",
    (s.termFinal != IGNORE) ? (s.termFinal.toFixed(2) + "%") : "---",
    (s.summative != IGNORE) ? (s.summative.toFixed(2) + "%") : "---",
    (s.exam != IGNORE) ? (s.exam.toFixed(2) + "%") : "---",
    (s.oldAvg != IGNORE ? s.oldAvg.toFixed(2) + "%" : "---"),
    (s.finalAvg != IGNORE ? s.finalAvg.toFixed(2) + "%" : "---")
  ]));
}
