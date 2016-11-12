'use strict';

var ConvertBase = require('convert-base'),
    helpers = require('../helpers'),
    constants = require('../constants');

var converter = new ConvertBase();

var HARDWARE_CODES = constants.hardwareCodes,
    REASON_CODES = constants.reasonCodes,
    MODE_OPERATION_CODES = constants.modeOperationCodes;

module.exports = function decoder(rawData) {
  if (!rawData) {
    throw new Error('Ingrese un valor válido para "rawData".');
  }

  // rowData tiene una longitud fija de 70 bytes,
  // cada byte es representado por dos caracteres hexadecimales
  if (rawData.length !== 140) {
    throw new Error('La trama debe tener 70 bytes (140 caracteres hexadecimales).');
  }

  return {
    /**
     * Identifies the Cellocator system
     * @return {string}
     */
    systemCode: function systemCode() {
      var byteFrom1To4;

      byteFrom1To4 = rawData.substr(0, 8);

      return helpers.hexadecimalToAscii(byteFrom1To4);
    },

    /**
     * Message type identifies the kind of message
     * @return {integer}
     */
    messageType: function messageType() {
      var byte5;

      byte5 = rawData.substr(8, 2);

      return converter.convert(byte5, 16, 10);
    },

    /**
     * This field contains a value that is uniquely assigned for every Cellocator
     * @return {integer}
     */
    unitsId: function unitsId() {
      var byteFrom6To9;

      byteFrom6To9 = rawData.substr(10, 8);

      return converter.convert(
        helpers.reverseHexadecimal(byteFrom6To9), 16, 10
      );
    },

    /**
     * This is a bitmapped field
     * @return {object}
     */
    communicationControlField: function communicationControlField() {
      var bytefrom10to11,
          bitsFromByte10,
          bitsFromByte11;

      bytefrom10to11 = rawData.substr(18, 4);

      bitsFromByte10 = helpers.lpad(converter.convert(
        bytefrom10to11.substr(2, 2), 16, 2
      ), 8);

      bitsFromByte11 = helpers.lpad(converter.convert(
        bytefrom10to11.substr(0, 2), 16, 2
      ), 8);

      return {
        // LSB => Bit Menos Significativo
        activeTransmission: bitsFromByte11.substr(-1),
        garminDisabled: bitsFromByte11.substr(0, 1),
        garminNotConnected: bitsFromByte11.substr(1, 1),
        directFromRam: bitsFromByte11.substr(2, 1),
        pspModeIsEnabled: bitsFromByte11.substr(3, 2),
        notCanOriginatedSpeed: bitsFromByte11.substr(5, 1),
        // MSB => Bit Mas Significativo
        notCanOriginatedOdometer: bitsFromByte11.substr(0, 1),
        // MSB => Bit Mas Significativo
        noHibernation: bitsFromByte10.substr(0, 1),
        momentarySpeed: bitsFromByte10.substr(1, 1),
        h: bitsFromByte10.substr(3, 5)
      }
    },

    /**
     * The Message numerator field contains a value that is increased
     * @return {integer}
     */
    messageNumerator: function messageNumerator() {
      var byte12;

      byte12 = rawData.substr(22, 2);

      return converter.convert(byte12, 16, 10);
    },

    /**
     * @return {object}
     */
    unitsHardwareVersion: function unitsHardwareVersion() {
      var byte13,
          modelId,
          model,
          modemCode,
          modem,
          isCorrectHardware;

      byte13 = converter.convert(
        rawData.substr(24, 2), 16, 2
      );

      modelId = converter.convert(
        byte13.substr(3, 5), 2, 10
      );

      modemCode = converter.convert(
        byte13.substr(0, 3), 2, 16
      );

      for (var current = 0; current < HARDWARE_CODES.length; current++) {
        isCorrectHardware = (
          HARDWARE_CODES[current].model.id === modelId &&
          HARDWARE_CODES[current].modem.code === modemCode
        );

        if (isCorrectHardware) {
          model = HARDWARE_CODES[current].model.name;
          modem = HARDWARE_CODES[current].modem.name;
          break;
        }
      }

      return {
        modem: modem,
        model: model
      }
    },

    /**
     * @return {integer}
     */
    unitsSoftwareVersion: function unitsSoftwareVersion() {
      var byte14;

      byte14 = rawData.substr(26, 2) ;

      return converter.convert(byte14, 16, 10) ;
    },

    /**
     * @return {integer}
     */
    protocolVersionIdentifier: function protocolVersionIdentifier() {
      var byte15;

      byte15 = rawData.substr(28, 2) ;

      return converter.convert(byte15, 16, 10) ;
    },

    /**
     * @return {object}
     */
    unitsStatusCurrentGsmOperator: function unitsStatusCurrentGsmOperator() {
      var byte16,
          unitsStatus,
          currentGsmOperator;

      byte16 = rawData.substr(30, 2);

      unitsStatus = helpers.lpad(converter.convert(
        byte16.substr(-1), 16, 2
      ), 4);

      currentGsmOperator = byte16.substr(0, 1);

      return {
        // MSB => Bit Mas Significativo
        speedEstimatedByGps: unitsStatus.substr(0, 1),
        correctTime: unitsStatus.substr(1, 1),
        homeNetwork: unitsStatus.substr(2, 1),
        // LSB => Bit Menos Significativo
        gpsCommunicationAvailable: unitsStatus.substr(-1),
        currentGsmOperator1stNibble: currentGsmOperator
      }
    },

    /**
     * @return {string}
     */
    currentGsmOperator: function currentGsmOperator() {
      return rawData.substr(32, 2);
    },

    /**
     * @return {integer}
     */
    transmissionReasonSpecificData: function transmissionReasonSpecificData() {
      var byte18;

      byte18 = rawData.substr(34, 2);

      return converter.convert(byte18, 16, 10);
    },

    /**
     * @return {object}
     */
    transmissionReason: function transmissionReason() {
      var byte19;

      byte19 = converter.convert(
        rawData.substr(36, 2), 16, 10
      );

      return {
        code: byte19,
        name: REASON_CODES[byte19]
      }
    },

    /**
     * @return {object}
     */
    unitsModeOfOperation: function unitsModeOfOperation() {
      var byte20;

      byte20 = rawData.substr(38, 2);

      return {
        code: byte20,
        name: MODE_OPERATION_CODES[byte20]
      }
    },

    /**
     * @return {object}
     */
    unitsInputOutputStatus1stByte: function unitsInputOutputStatus1stByte() {
      var byte21;

      byte21 = helpers.lpad(converter.convert(
        rawData.substr(40, 2), 16, 2
      ), 8);

      return {
        // MSB => Bit Mas Significativo
        unlockInactive: byte21.substr(0, 1),
        panicInactive: byte21.substr(1, 1),
        drivingStatus: byte21.substr(2, 1),
        shockInactive: byte21.substr(6, 1),
        // LSB => Bit Menos Significativo
        doorInactive: byte21.substr(-1)
      }
    },

    /**
     * @return {object}
     */
    unitsInputOutputStatus2stByte: function unitsInputOutputStatus2stByte() {
      var byte22;

      byte22 = helpers.lpad(converter.convert(
        rawData.substr(42, 2), 16, 2
      ), 8);

      return {
        // MSB => Bit Mas Significativo
        ignitionPortStatus: byte22.substr(0, 1),
        accelerometerStatus: byte22.substr(1, 1),
        lock: byte22.substr(5, 1)
      }
    },

    /**
     * @return {object}
     */
    unitsInputOutputStatus3stByte: function unitsInputOutputStatus3stByte() {
      var byte23;

      byte23 = helpers.lpad(converter.convert(
        rawData.substr(44, 2), 16, 2
      ), 8);

      return {
        gpsPower: byte23.substr(4, 1),
        gradualStopInactive: byte23.substr(5, 1),
        sirenInactive: byte23.substr(6, 1)
      }
    },

    /**
     * @return {object}
     */
    unitsInputOutputStatus4stByte: function unitsInputOutputStatus4stByte() {
      var bytefrom24to25,
          bitsFromByte24,
          byte25,
          plmn;

      bytefrom24to25 = rawData.substr(46, 4) ;

      bitsFromByte24 = helpers.lpad(converter.convert(
        bytefrom24to25.substr(0, 2), 16, 2
      ), 8);

      byte25 = bytefrom24to25.substr(2, 2);

      plmn = converter.convert(
        `${this.unitsStatusCurrentGsmOperator().currentGsmOperator1stNibble}${this.currentGsmOperator()}${byte25}`, 16, 10
      );

      return {
        // MSB => Bit Mas Significativo
        notCharging: bitsFromByte24.substr(0, 1),
        standardImmobilizer: bitsFromByte24.substr(2, 1),
        globalOutput: bitsFromByte24.substr(4, 1),
        // LSB => Bit Menos Significativo
        ledInactive: bitsFromByte24.substr(-1),
        plmn: plmn
      }
    },

    /**
     * Represents the main supply voltage, normally it would be a vehicle's battery
     * @return {double}
     */
    analogInput1value: function analogInput1value() {
      var byte26;

      byte26 = rawData.substr(50, 2);

      return converter.convert(byte26, 16, 10) * 0.1176470588235;
    },

    /**
     * Represents backup battery voltage
     * @return {double}
     */
    analogInput2value: function analogInput2value() {
      var byte27;

      byte27 = rawData.substr(52, 2);

      return converter.convert(byte27, 16, 10) * 0.01647058823;
    },

    /**
     * @return {double}
     */
    analogInput3value: function analogInput3value() {
      var byte28;

      byte28 = rawData.substr(54, 2);

      return (converter.convert(byte28, 16, 10) * 0.4314) - 40;
    },

    /**
     * Represents voltage on the first optional analog input
     * @return {double}
     */
    analogInput4value: function analogInput4value() {
      var byte29;

      byte29 = rawData.substr(56, 2) ;

      return converter.convert(byte29, 16, 10);
    },

    /**
     * Distance accumulator feature
     * @return {integer}
     */
    mileageCounter: function mileageCounter() {
      var bytefrom30to32;

      bytefrom30to32 = rawData.substr(58, 6);

      return converter.convert(
        helpers.reverseHexadecimal(bytefrom30to32), 16, 10
      );
    },

    /**
     * @return {string}
     */
    multiPurposeField: function multiPurposeField() {
      var bytefrom33to38;

      bytefrom33to38 = rawData.substr(64, 12);

      return helpers.reverseHexadecimal(bytefrom33to38);
    },

    /**
     * @return {object}
     */
    lastGpsFix: function lastGpsFix() {
      var bytefrom39to40,
          bitsFromBytes,
          dayOfMonth,
          hours,
          minutes;

      bytefrom39to40 = rawData.substr(76, 4);

      bitsFromBytes = helpers.lpad(
        converter.convert(
          helpers.reverseHexadecimal(bytefrom39to40), 16, 2
        ), 16
      );

      dayOfMonth = helpers.lpad(
        converter.convert(bitsFromBytes.substr(0, 5), 2, 10), 2
      );

      hours = helpers.lpad(
        converter.convert(bitsFromBytes.substr(5, 5), 2, 10), 2
      );

      minutes = helpers.lpad(
        converter.convert(bitsFromBytes.substr(10, 6), 2, 10), 2
      );

      return {
        dayOfMonth: dayOfMonth,
        hours: hours,
        minutes: minutes
      }
    },

    /**
     * @return {string}
     */
    locationStatus: function locationStatus() {
      var byte41;

      byte41 = rawData.substr(80, 2);

      return helpers.lpad(
        converter.convert(byte41, 16, 2), 8
      );
    },

    mode1: function mode1() {
      var byte42;

      byte42 = rawData.substr(82, 2);

      return helpers.lpad(
        converter.convert(byte42, 16, 2), 8
      );
    },

    mode2: function mode2() {
      var byte43;

      byte43 = rawData.substr(84, 2);

      return helpers.lpad(
        converter.convert(byte43, 16, 2), 8
      );
    },

    /**
     * Number of satellite measurements used for current position fix
     * @return {integer}
     */
    numberOfSatellitesUsed: function numberOfSatellitesUsed() {
      var byte44;

      byte44 = rawData.substr(86, 2);

      return converter.convert(byte44, 16, 10);
    },

    /**
     * Longitude and latitude coordinates of current position fix
     * @return {object}
     */
    longitudeAndLatitude: function longitudeAndLatitude() {
      var lng,
          lat,
          decimals,
          radians,
          bytefrom45to52;

      bytefrom45to52 = rawData.substr(88, 16);

      lng = helpers.reverseHexadecimal(bytefrom45to52.substr(0, 8));
      lat = helpers.reverseHexadecimal(bytefrom45to52.substr(8, 8));

      decimals = coordinatesDecimals(lng, lat);
      radians = coordinatesRadians(lng, lat);

      return {
        decimals: {
          longitude: decimals.longitude,
          latitude: decimals.latitude
        },
        radians: {
          longitude: radians.longitude,
          latitude: radians.latitude
        }
      }
    },

    /**
     * Altitude of current position fix
     * @return {string}
     */
    altitude: function altitude() {
      var bytefrom53to56,
          gpsz;

      bytefrom53to56 = rawData.substr(104, 8);

      gpsz = converter.convert(
        helpers.reverseHexadecimal(bytefrom53to56), 16, 10
      ) * 0.01;

      return `${gpsz} M`;
    },

    /**
     * Current speed
     * @return {string}
     */
    groundSpeed: function groundSpeed() {
      var bytefrom57to60,
          speed;

      bytefrom57to60 = rawData.substr(112, 8);

      speed = converter.convert(
        helpers.reverseHexadecimal(bytefrom57to60), 16, 10
      ) * 0.036;

      return `${speed.toFixed(3)} km/h`;
    },

    /**
     * Direction (angle) of the speed vector
     * @return {string}
     */
    speedDirection: function speedDirection() {
      var bytefrom61to62,
          direction;

      bytefrom61to62 = rawData.substr(120, 4);

      direction = converter.convert(
        helpers.reverseHexadecimal(bytefrom61to62), 16, 10
      );

      return direction * (180 / Math.PI) * 0.001;
    },

    /**
     * Universal coordinated time of the position fix. Seconds
     * @return {string}
     */
    utcTimeSeconds: function utcTimeSeconds() {
      var byte63;

      byte63 = rawData.substr(124, 2);

      return helpers.lpad(
        converter.convert(byte63, 16, 10), 2
      );
    },

    /**
     * Universal coordinated time of the position fix. minutes
     * @return {string}
     */
    utcTimeMinutes: function utcTimeMinutes() {
      var byte64;

      byte64 = rawData.substr(126, 2) ;

      return helpers.lpad(
        converter.convert(byte64, 16, 10), 2
      );
    },

    /**
     * Universal coordinated time of the position fix. Hours
     * @return {string}
     */
    utcTimeHours: function utcTimeHours() {
      var byte65;

      byte65 = rawData.substr(128, 2) ;

      return helpers.lpad(
        converter.convert(byte65, 16, 10), 2
      );
    },

    /**
     * Universal coordinated date of the position fix. Days
     * @return {string}
     */
    utcTimeDay: function utcTimeDay() {
      var byte66;

      byte66 = rawData.substr(130, 2) ;

      return helpers.lpad(
        converter.convert(byte66, 16, 10), 2
      );
    },

    /**
     * Universal coordinated date of the position fix. Months
     * @return {string}
     */
    utcTimeMonth: function utcTimeMonth() {
      var byte67;

      byte67 = rawData.substr(132, 2) ;

      return helpers.lpad(
        converter.convert(byte67, 16, 10), 2
      );
    },

    /**
     * Universal coordinated date of the position fix. Years
     * @return {string}
     */
    utcTimeYear: function utcTimeYear() {
      var bytefrom68to69;

      bytefrom68to69 = rawData.substr(134, 4);

      return helpers.lpad(
        converter.convert(
          helpers.reverseHexadecimal(bytefrom68to69), 16, 10
        ), 4
      );
    },

    errorDetectionCode: function errorDetectionCode() {
      var byte70,
          bytefrom4to69,
          checksum;

      byte70 = rawData.substr(138, 2).toUpperCase();
      bytefrom4to69 = rawData.substr(8, 130);

      checksum = helpers.checksum(bytefrom4to69);

      return {
        code: byte70,
        checksum: checksum
      }
    }
  }
}

function coordinatesDecimals(argLongitude, argLatitude) {
  var lng,
      lat,
      longitude,
      latitude;

  // calcular longitud
  if (argLongitude.substr(0, 1) === 'F' || argLongitude.substr(0, 1) === 'f') {
    lng = converter.convert(
      helpers.notBinary(
        converter.convert(argLongitude, 16, 2)
      ), 2, 10
    );

    longitude = (lng + 1) * -1 * (180 / Math.PI) * Math.pow(10, -8);
  } else {
    lng = converter.convert(argLongitude, 16, 10);
    longitude = lng * (180 / Math.PI) * Math.pow(10, -9);
  }

  // calcular latitud
  if (argLatitude.substr(0, 1) === 'F' || argLatitude.substr(0, 1) === 'f') {
    lat = converter.convert(
      helpers.notBinary(
        converter.convert(argLatitude, 16, 2)
      ), 2, 10
    );

    lat = (lat + 1) * -1;
  } else {
    lat = converter.convert(argLatitude, 16, 10);
  }

  latitude = lat * (180 / Math.PI) * Math.pow(10, -8);

  return {
    longitude: longitude,
    latitude: latitude
  }
}

function coordinatesRadians(argLongitude, argLatitude) {
  var degrees,
      minutes,
      seconds,
      longitude,
      latitude,
      cardinalPoint;

  // calcular longitud
  degrees = converter.convert(argLongitude, 16, 10) * (180 / Math.PI) * Math.pow(10, -8);
  minutes = (degrees - parseInt(degrees)) * 60;
  seconds = (minutes - parseInt(minutes)) * 60;

  degrees = parseInt(degrees);
  minutes = parseInt(minutes);
  seconds = parseFloat(seconds.toFixed(2));

  // see: http://www.coordenadas-gps.com/sistema-de-coordenadas
  if (degrees > 0 && degrees <= 180) {
    cardinalPoint = 'E'; // Este
  } else if (degrees < 0 && degrees >= -180) {
    cardinalPoint = 'W'; // Oeste
  }

  longitude = `${Math.abs(degrees)}°${Math.abs(minutes)}'${Math.abs(seconds)}"${cardinalPoint}`;

  // calcular latitud
  degrees = ((converter.convert(argLatitude, 16, 10) * 180) / Math.PI) * Math.pow(10, -8);
  minutes = (degrees - parseInt(degrees)) * 60;
  seconds = (minutes - parseInt(minutes)) * 60;

  degrees = parseInt(degrees);
  minutes = parseInt(minutes);
  seconds = parseFloat(seconds.toFixed(2));

  // see: http://www.coordenadas-gps.com/sistema-de-coordenadas
  if (degrees > 0 && degrees <= 90) {
    cardinalPoint = 'N'; // Norte
  } else if (degrees < 0 && degrees >= -90) {
    cardinalPoint = 'S'; // Sur
  }

  latitude = `${Math.abs(degrees)}°${Math.abs(minutes)}'${Math.abs(seconds)}"${cardinalPoint}`;

  return {
    longitude: longitude,
    latitude: latitude
  }
}
