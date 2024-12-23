const net = require('net');
const util = require('util');
const { SerialPort } = require('serialport')
const { DelimiterParser } = require('@serialport/parser-delimiter')
const mqtt = require('mqtt');
const CONFIG = require('../config.json');
const CONST = {
	mqttBroker: 'mqtt://' + CONFIG.options.mqtt.server,
	mqttDelay: CONFIG.options.mqtt.receiveDelay,
	mqttUser: CONFIG.options.mqtt.username,
	mqttPass: CONFIG.options.mqtt.password,
	clientID: 'Navien',
	DEVICES: [
		{deviceId: 'Light1', subId: '1', state: 'ON',  name: '거실1', stateMask: {pos: 5, value: '1'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHexList: [Buffer.alloc(8, 'f70e11410101a902', 'hex'), Buffer.alloc(8, 'f70e11c10200012a04', 'hex')]},
		{deviceId: 'Light1', subId: '1', state: 'OFF', name: '거실1', stateMask: {pos: 5, value: '0'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHexList: [Buffer.alloc(8, 'f70e11410100a800', 'hex'), Buffer.alloc(8, 'f70e11c10200002b04', 'hex')]},
		{deviceId: 'Light2', subId: '2', state: 'ON',  name: '거실2', stateMask: {pos: 6, value: '1'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHexList: [Buffer.alloc(8, 'f70e12410101aa04', 'hex'), Buffer.alloc(8, 'f70e12c10200012904', 'hex')]},
		{deviceId: 'Light2', subId: '2', state: 'OFF', name: '거실2', stateMask: {pos: 6, value: '0'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHexList: [Buffer.alloc(8, 'f70e12410100ab04', 'hex'), Buffer.alloc(8, 'f70e12c10200002802', 'hex')]},
		{deviceId: 'Light3', subId: '3', state: 'ON',  name: '거실3',  stateMask: {pos: 7, value: '1'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHexList: [Buffer.alloc(8, 'f70e13410101ab06', 'hex'), Buffer.alloc(8, 'f70e13c10200012804', 'hex')]},
		{deviceId: 'Light3', subId: '3', state: 'OFF', name: '거실3', stateMask: {pos: 7, value: '0'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHexList: [Buffer.alloc(8, 'f70e13410100aa04', 'hex'), Buffer.alloc(8, 'f70e13c10200002904', 'hex')]},
		{deviceId: 'Ventilator', subId: '1', state: 'LOW', name: '환기', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(11, '32018105000101030043f8', 'hex'), commandHexList: [Buffer.alloc(8, 'f7320142010186f4', 'hex')]},
		{deviceId: 'Ventilator', subId: '1', state: 'MID', name: '환기', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(11, '32018105000102030040f6', 'hex'), commandHexList: [Buffer.alloc(8, 'f7320142010285f4', 'hex')]},
		{deviceId: 'Ventilator', subId: '1', state: 'HIGH', name: '환기', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(11, '32018105000103030041f8', 'hex'), commandHexList: [Buffer.alloc(8, 'f7320142010384f4', 'hex')]},
		{deviceId: 'Ventilator', subId: '1', state: 'OFF', name: '환기', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(11, '32018105000000030043f6', 'hex'), commandHexList: [Buffer.alloc(8, 'f7320141010084f0', 'hex')]},
	],
	TOPIC_PREFIX: 'homenet-js'
};

//
var log = (...args) => console.log('[' + new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}) + ']', args.join(' '));
var homeStatus = {};
var lastReceive = new Date().getTime();
var mqttReady = false;
var queue = new Array();

// EW11 연결
const sock = new net.Socket();
sock.connect(CONFIG.options.socket.port, CONFIG.options.socket.deviceIP, function() {
	log('[Socket] Connected socket');
});

const parser = sock.pipe(new DelimiterParser({ delimiter: Buffer.from([0xf7]) }));
parser.on('data', buffer => {
	if (!mqttReady) return;

	try {
		var hex = new Array();
		Array.from(buffer.entries()).forEach(e => {
			hex[e[0]] = e[1];
		});

		//
		CONST.DEVICES.forEach(device => {
			if (device.stateMask.pos == -1) {
				if (buffer.equals(device.stateHex)) {
					publishProc(device, null);
				}
			} else {
				var head = Buffer.alloc(device.stateHex.length);
				buffer.copy(head, 0, 0, device.stateHex.length);
				if (device.stateHex.equals(head)) {
					// 공기질은 따로 처리한다
					if (device.deviceId == "AirQuality") {
						var gas = 0;
						if (device.stateMask.pos.length == 1) {
							gas = hex[device.stateMask.pos];
						} else {
							// 유해가스 계산
							// 04 10 : 4 * 255 + 10 = 1030
							gas = parseInt(hex[device.stateMask.pos[0]].toString()) * 255 + parseInt(hex[device.stateMask.pos[1]].toString());
						}
						//console.log(device.deviceId, device.subId, gas);
						publishProc(device, gas.toString());
					} else {
						if (hex[device.stateMask.pos] == device.stateMask.value) {
							publishProc(device, null);
						}
					}
				}
			}
		});
	} catch (e) {
	}
});

//
const client = mqtt.connect(CONST.mqttBroker, {
		clientId: CONST.clientID,
		username: CONST.mqttUser,
		password: CONST.mqttPass
	}
);

client.on('connect', () => {
	var device_list = Array.from(new Set(CONST.DEVICES.map(e => e.deviceId + "-" + e.subId)));
	var topics = new Array();

	console.log(device_list);
	device_list.forEach(targetName => {
		topics.push(CONST.TOPIC_PREFIX + '/' + targetName + '/status');
		topics.push(CONST.TOPIC_PREFIX + '/' + targetName + '/command');
	});

	client.subscribe(topics, (err) => {
		if (err) log('MQTT Subscribe fail! -', CONST.DEVICE_TOPIC);
		log('Success subscribe MQTT');
	});
});

client.on('message', (topic, message) => {
	if (!mqttReady) return;

	try {
		var topics = topic.split('/');
		var msg = message.toString();

		if(topics[2] == 'status') {
			//log('[MQTT] (청취)', topic, message, '[현재상태]', homeStatus[topic], '->', message.toString());
			//homeStatus[topic] = message.toString();
			//client.publish(topic, obj[stateName], {retain: true});
		} else {
			/*
				payload -> ON -> 4f 4e
				payload -> OFF -> 4f 46 46
			*/
			var objFound = CONST.DEVICES.find(e => topics[1] == e.deviceId + "-" + e.subId && topics[2] == 'command' && msg == e.state);
			if (typeof objFound == "undefined") {
				console.log("not found device");
			} else {
				//console.log(objFound);
				queue.push(objFound);
			}
		}
	} catch (e) {
	}
});

//
const publishProc = (objFound, state) => {
	if (objFound == null) return ;

	try {
		var targetName = objFound.deviceId + '-' + objFound.subId;
		var topic = CONST.TOPIC_PREFIX + '/' + targetName + '/status';
		var current = homeStatus[targetName];
		var inputState = state == null ? objFound.state : state;

		if(current == null || current != inputState) {
			if(queue.length > 0) {
				var found = queue.find(q => q.deviceId + '-' + q.subId === targetName && q.state === current);
				if (found != null) return;
			}

			// 그외 상태반영
			homeStatus[targetName] = inputState;
			client.publish(topic, inputState, {retain: true});
			log('[MQTT] (Publish)', topic, ':', inputState);
		}
	} catch (e) {
	}
}

//
const commandProc = () => {
	if (queue.length == 0) return;

	try {
		var obj = queue.shift();
		obj.commandHexList.forEach(command => {
			sock.write(command);
		});

		log('[Socket] (Send)', obj.deviceId + '-' + obj.subId, obj.name, '->', obj.state);
	} catch (e) {
	}
}

setTimeout(() => {
	mqttReady = true;
	log('Ready MQTT...')
}, CONST.mqttDelay);
setInterval(commandProc, 100);
