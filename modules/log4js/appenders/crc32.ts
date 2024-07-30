/**
 * 循环冗余校验码 CRC32
 * 参考：https://stackoverflow.com/questions/18638900/javascript-crc32
 */
export var Utf8Encode = function(str: string) {
  str = str.replace(/\r\n/g, '\n');
  var utftext = '';

  for (var n = 0; n < str.length; n++) {
    var c = str.charCodeAt(n);
    if (c < 128) {
      utftext += String.fromCharCode(c);
    } else if (c > 127 && c < 2048) {
      utftext += String.fromCharCode((c >> 6) | 192);
      utftext += String.fromCharCode((c & 63) | 128);
    } else {
      utftext += String.fromCharCode((c >> 12) | 224);
      utftext += String.fromCharCode(((c >> 6) & 63) | 128);
      utftext += String.fromCharCode((c & 63) | 128);
    }
  }
  return utftext;
};

export var makeCRCTable = function() {
  var c;
  var crcTable = [];
  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
};

/**
 * CRCTable
 * @type {Array}
 */
var crcTable = makeCRCTable();

export const crc32 = (str: string, crc?: any) => {
  str = Utf8Encode(str.toString());
  if (crc === 'undefined' || crc === null) {
    crc = 0;
  }
  crc = crc ^ -1;
  for (var i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
  }
  return (crc ^ -1) >>> 0;
};
