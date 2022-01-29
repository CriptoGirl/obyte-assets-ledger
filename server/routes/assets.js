"use strict";
const express = require('express');
const router = express.Router();
var headlessWallet = require('headless-obyte');
var network = require('ocore/network.js');
var composer = require('ocore/composer.js');
const db = require('ocore/db');
const conf = require('ocore/conf');

function sendError(err, status, res) {
	console.error('Error:', err)
	let error = 'Server Error'
	if (err.message) error = err.message
	if (typeof err === 'string' || err instanceof String ) error = err
	if (res) res.status(status).send( { error } )
	return false;
}

router.get('/', async (req, res) => {
	try {
		var assets = await db.query(
			`SELECT a.unit FROM assets AS a, unit_authors AS u
			WHERE u.address = ? AND a.unit = u.unit`,
			[global.firstAddress]);

		var moreAssets = conf.allowedExternalAssets.filter(unit => (unit && unit !== 'base'));
		assets = assets.concat(moreAssets.map(unit => ({unit})));
		assets = assets.filter((v,i,a)=>a.findIndex(t=>(t.unit === v.unit))===i);

		res.send(assets)
	}
	catch (err) { return sendError(err, 500, res) }
});

router.post('/', async (req, res) => {
	try {
		if (!global.firstAddress || !global.changeAddress) {
			throw Error('Wallet is locked. Enter passphrase in console.');
		}
		var callbacks = composer.getSavingCallbacks({
			ifError: function(err){ sendError(err, 500, res) },
			ifNotEnoughFunds: function(err){ sendError(err, 500, res) },
			ifOk: function(objJoint){
				network.broadcastJoint(objJoint);
				console.error('==== Asset ID:'+ objJoint.unit.unit);
				res.status(201);
				res.send({ unit: objJoint.unit.unit })
			}
		});

		var asset = {
			is_private: false,
			is_transferrable: true,
			auto_destroy: true,
			fixed_denominations: false,
			issued_by_definer_only: true,
			cosigned_by_definer: false,
			spender_attested: false
		}

		composer.composeAssetDefinitionJoint(global.firstAddress, asset, headlessWallet.signer, callbacks);
	}
	catch (err) { return sendError(err, 500, res) }
})

router.post('/register/', async (req, res) => {
	try {
		if (!global.firstAddress || !global.changeAddress) {
			throw Error('Wallet is locked. Enter passphrase in console.');
		}
		const data = req.body;
		var trigger = { 
			outputs: {base: 1e8}, 
			address: global.changeAddress,
			data: {}
		};
		
		trigger.data['symbol'] = String(data.symbol).toUpperCase();
		trigger.data['description'] = data.description || conf.defaultAssetDescription;
		trigger.data['decimals'] = data.decimals || 0;
		trigger.data['asset'] = data.asset;

		network.requestFromLightVendor('light/dry_run_aa', { trigger: trigger, address: conf.tokenRegistryAA }, function (ws, request, arrResponses) {
			if (arrResponses[0].response.error) return sendError('Error:'+ arrResponses[0].response.error, 500, res)
			if (arrResponses[0].response.info) return sendError('Already registered.', 500, res)
			const responseMessage = arrResponses[0].objResponseUnit.messages.find(function (message) { return (message.app === 'data'); });
			if (!responseMessage) return sendError('Error. Please register manually on Obyte Token Registry', 500, res)

			var objMessage = {
				app: "data",
				payload: trigger.data
			};
			var opts = {
				paying_addresses: [trigger.address],
				change_address: trigger.address,
				amount: trigger.outputs.base,
				to_address: conf.tokenRegistryAA,
				messages: [objMessage]
			};
		
			headlessWallet.sendMultiPayment(opts, function(err, unit){
				if (err) return sendError(err, 500, res)
				console.error('==== Unit ID:'+ unit);
				res.status(201);
				res.send({ unit })
			});
		});
	}
	catch (err) { return sendError(err, 500, res) }
})

router.post('/remove-deposit/', async (req, res) => {
	try {
		if (!global.firstAddress || !global.changeAddress) {
			throw Error('Wallet is locked. Enter passphrase in console.');
		}
		const data = req.body;
		var trigger = { 
			outputs: {base: 1e4}, 
			address: global.changeAddress,
			data: {}
		};
		
		trigger.data['withdraw'] = 1;
		trigger.data['amount'] = 1e8;
		trigger.data['symbol'] = String(data.symbol).toUpperCase();
		trigger.data['asset'] = data.asset;

		network.requestFromLightVendor('light/dry_run_aa', { trigger: trigger, address: conf.tokenRegistryAA }, function (ws, request, arrResponses) {
			if (arrResponses[0].response.error) return sendError('Error:'+ arrResponses[0].response.error, 500, res)
			if (arrResponses[0].response.info) return sendError('Info:'+ arrResponses[0].response.info, 500, res)
			const responseMessage = arrResponses[0].objResponseUnit.messages.find(function (message) { return (message.app === 'payment'); });
			if (!responseMessage) return sendError('Error. Please withdraw manually on Obyte Token Registry', 500, res)

			var objMessage = {
				app: "data",
				payload: trigger.data
			};
			var opts = {
				paying_addresses: [trigger.address],
				change_address: trigger.address,
				amount: trigger.outputs.base,
				to_address: conf.tokenRegistryAA,
				messages: [objMessage]
			};
		
			headlessWallet.sendMultiPayment(opts, function(err, unit){
				if (err) return sendError(err, 500, res)
				console.error('==== Unit ID:'+ unit);
				res.status(201);
				res.send({ unit })
			});
		});
	}
	catch (err) { return sendError(err, 500, res) }
})

module.exports = router;
