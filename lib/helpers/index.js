'use strict';

var ConvertBase = require('convert-base');

var converter = new ConvertBase();

/**
 * Realiza la suma de comprobacion de trama (checksum)
 * @param {string} arg: cadena con valores hexadecimales
 * @return {string}
 */
exports.checksum = function checksum(argChunk) {
  var lsb,
      currentByte,
      sumHexadecimal,
      sumDecimal = 0;

  for (var i = 0; i < argChunk.length - 1; i += 2) {
    currentByte = argChunk.substr(i, 2);
    sumDecimal += converter.convert(currentByte, 16, 10);
  }

  sumHexadecimal = converter.convert(sumDecimal, 10, 16);

  // Extraemos el Bit Menos Significativo (LSB)
  lsb = sumHexadecimal.substr(-2);

  return lsb;
}

/**
 * Rellena el valor "argValue" por la izquierda hasta la longitud "argWidth" con el caracter "argCharacter" definido
 * @param {string} argValue: Valor que será rellenado
 * @param {integer} argWidth: Longitud final que tendrá el valor
 * @param {string} argCharacter: Caracter con el que será rellenado el valor
 * @return {string}
 */
exports.lpad = function lpad(argValue, argWidth, argCharacter) {
  var character = argCharacter ? argCharacter : '0',
      value = argValue ? argValue.toString() : '',
      width = argWidth ? argWidth : 0;

  return value.length >= width ? value : new Array(width - value.length + 1).join(character).concat(value);
}

/**
 * Invertir la cadena hexadecimal en pares
 * @param {string} hexadecimal: valor hexadecimal
 * @return {string}
 */
exports.reverseHexadecimal = function reverseHexadecimal(hexadecimal) {
  var reverse = '',
      currentChunk;

  for (var i = 0; i < hexadecimal.length - 1; i += 2) {
    currentChunk = hexadecimal.substring(i, i + 2);
    reverse = `${currentChunk}${reverse}`;
  }

  return reverse;
};

/**
* Convierte valores Hexadecimales ha Ascii
* @param {string} argValue: valor hexadecimal
* @return {string}
*/
exports.hexadecimalToAscii = function(argValue){
  var chunkAscii,
      ascii = '';

  for (var i = 0; i < argValue.length; i += 2) {
    chunkAscii = String.fromCharCode(
      parseInt(argValue.substr(i, 2), 16)
    );

    ascii = `${ascii}${chunkAscii}`;
  }

  return ascii;
}

/**
* Negar cada valor binario de la cadena
* @param {string} binary: valor binario
* @return {string}
*/
exports.notBinary = function(binary){
  var investBinary = '';

  // false => 0, -0, NaN, null, undefined, "", ''
  // true  => resto de valores
  if (binary) {
    for (var i = 0; i < binary.length; i++){
      if(binary.substring(i, i + 1) === '0') {
        investBinary = `${investBinary}1`;
      }
      else {
        investBinary = `${investBinary}0`;
      }
    }
  }

  return investBinary;
}
