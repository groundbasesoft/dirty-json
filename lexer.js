// Copyright 2016, 2015, 2014 Ryan Marcus
// This file is part of dirty-json.
// 
// dirty-json is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// dirty-json is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with dirty-json.  If not, see <http://www.gnu.org/licenses/>.

"use strict";

let Q = require("q");
let Lexer = require("lex");

// terminals
const LEX_KV = 0;
const LEX_KVLIST = 1;
const LEX_VLIST = 2;
const LEX_BOOLEAN = 3;
const LEX_COVALUE = 4;
const LEX_CVALUE = 5;
const LEX_FLOAT = 6;
const LEX_INT = 7;
const LEX_KEY = 8;
const LEX_LIST = 9;
const LEX_OBJ = 10;
const LEX_QUOTE = 11;
const LEX_RB = 12;
const LEX_RCB = 13;
const LEX_TOKEN = 14;
const LEX_VALUE = 15;

// non-terminals
const LEX_COLON = -1;
const LEX_COMMA = -2;
const LEX_LCB = -3;
const LEX_LB = -4;
const LEX_DOT = -5;


const lexMap = {
    ":": {type: LEX_COLON},
    ",": {type: LEX_COMMA},
    "{": {type: LEX_LCB},
    "}": {type: LEX_RCB},
    "[": {type: LEX_LB},
    "]": {type: LEX_RB},
    ".": {type: LEX_DOT} // TODO: remove?
};

const lexSpc = [
    [/:/, LEX_COLON],
    [/,/, LEX_COMMA],
    [/{/, LEX_LCB],
    [/}/, LEX_RCB],
    [/\[/, LEX_LB],
    [/\]/, LEX_RB],
    [/\./, LEX_DOT] // TODO: remove?
];

function stripslashes (str) {
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // +   improved by: Ates Goral (http://magnetiq.com)
  // +      fixed by: Mick@el
  // +   improved by: marrtins
  // +   bugfixed by: Onno Marsman
  // +   improved by: rezna
  // +   input by: Rick Waldron
  // +   reimplemented by: Brett Zamir (http://brett-zamir.me)
  // +   input by: Brant Messenger (http://www.brantmessenger.com/)
  // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
  // *     example 1: stripslashes('Kevin\'s code');
  // *     returns 1: "Kevin's code"
  // *     example 2: stripslashes('Kevin\\\'s code');
  // *     returns 2: "Kevin\'s code"
  return (str + '').replace(/\\(.?)/g, function (s, n1) {
    switch (n1) {
    case '\\':
      return '\\';
    case '0':
      return '\u0000';
    default:
      return n1;
    }
  });
}

function getLexer(string) {
    let lexer = new Lexer();
    lexer.addRule(/"((?:[^"\\]+|\\.)*)("|$)/, (lexeme, txt) => {
	return {type: LEX_QUOTE, value: stripslashes(txt)};
    });

    lexer.addRule(/'((?:[^'\\]+|\\.)*)('|$)/, (lexeme, txt) => {
	return {type: LEX_QUOTE, value: stripslashes(txt)};
    });

    lexer.addRule(/[\-0-9]*\.[0-9]*/, lexeme => {
	return {type: LEX_FLOAT, value: parseFloat(lexeme)};
    });

    lexer.addRule(/[\-0-9]+/, lexeme => {
	return {type: LEX_INT, value: parseInt(lexeme)};
    });

    lexSpc.forEach(item => {
	lexer.addRule(item[0], lexeme => {
	    return {type: item[1], value: lexeme};
	});
    });

    lexer.addRule(/\s/, lexeme => {
	// chomp whitespace...
    });

    lexer.addRule(/./, lexeme => {
	let lt = LEX_TOKEN;
	let val = lexeme;

	
	return {type: lt, value: val};
    });

    lexer.setInput(string);

    return lexer;
}



module.exports.lexString = lexString;
function lexString(str, emit) {
    let lex = getLexer(str);

    let token = "";
    while ((token = lex.lex())) {
	emit(token);
    }
    
}

module.exports.getAllTokens = getAllTokens;
function getAllTokens(str) {
    let toR = Q.defer();

    let arr = [];
    let emit = function (i) {
	arr.push(i);
    };

    lexString(str, emit);

    toR.resolve(arr);
    return toR.promise;
}



