/*jslint node: true */
"use strict";

// these can be overridden with conf.json file in data folder
exports.bLight = process.env.testnet ? true : false;
exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';
exports.bNoPassphrase = process.env.testnet ? true : false;
exports.deviceName = 'Obyte Assets Ledger';
exports.bIgnoreUnpairRequests = true;
exports.bSingleAddress = false; // DO NOT CHANGE
exports.bStaticChangeAddress = true; // DO NOT CHANGE
exports.payout_address = ''; // where Bytes can be moved manually.
exports.allowedExternalAssets = []; // asset IDs on additional allowed assets.
exports.tokenRegistryAA = 'O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ';
exports.defaultAssetDescription = 'Asset by obyte-assets-ledger';

// emails
exports.admin_email = '';
exports.from_email = '';

// TOR is recommended.
//exports.socksHost = '127.0.0.1';
//exports.socksPort = 9050;

// consolidate unspent outputs when there are too many of them, value of 0 means do not try to consolidate.
exports.MAX_UNSPENT_OUTPUTS = 100;
exports.CONSOLIDATION_INTERVAL = 3600*1000;
