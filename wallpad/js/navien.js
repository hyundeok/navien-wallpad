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
		{deviceId: 'Light1', subId: '1', state: 'ON',  name: '침실', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(8, '0e2f81020001540c', 'hex'), commandHex: Buffer.alloc(8, 'f70e214101019902', 'hex')},
		{deviceId: 'Light1', subId: '1', state: 'OFF', name: '침실', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(8, '0e2f81020000550c', 'hex'), commandHex: Buffer.alloc(8, 'f70e214101009800', 'hex')},
		{deviceId: 'Light2', subId: '1', state: 'ON',  name: '작업실', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(8, '0e3f81020001440c', 'hex'), commandHex: Buffer.alloc(8, 'f70e314101018902', 'hex')},
		{deviceId: 'Light2', subId: '1', state: 'OFF', name: '작업실', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(8, '0e3f81020000450c', 'hex'), commandHex: Buffer.alloc(8, 'f70e314101008800', 'hex')},
		{deviceId: 'Light3', subId: '1', state: 'ON',  name: '드레스룸', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(8, '0e4f81020001340c', 'hex'), commandHex: Buffer.alloc(8, 'f70e41410101f982', 'hex')},
		{deviceId: 'Light3', subId: '1', state: 'OFF', name: '드레스룸', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(8, '0e4f81020000350c', 'hex'), commandHex: Buffer.alloc(8, 'f70e41410100f880', 'hex')},
		{deviceId: 'Light4', subId: '1', state: 'ON',  name: '거실1', stateMask: {pos: 5, value: '1'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e11410101a902', 'hex')},
		{deviceId: 'Light4', subId: '1', state: 'OFF', name: '거실1', stateMask: {pos: 5, value: '0'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e11410100a800', 'hex')},
		{deviceId: 'Light4', subId: '2', state: 'ON',  name: '거실2', stateMask: {pos: 6, value: '1'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e12410101aa04', 'hex')},
		{deviceId: 'Light4', subId: '2', state: 'OFF', name: '거실2', stateMask: {pos: 6, value: '0'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e12410100ab04', 'hex')},
		{deviceId: 'Light4', subId: '3', state: 'ON',  name: '거실3',  stateMask: {pos: 7, value: '1'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e13410101ab06', 'hex')},
		{deviceId: 'Light4', subId: '3', state: 'OFF', name: '거실3', stateMask: {pos: 7, value: '0'}, stateHex: Buffer.alloc(5, '0e1f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e13410100aa04', 'hex')},
		{deviceId: 'Light5', subId: '1', state: 'ON',  name: '주방1', stateMask: {pos: 5, value: '1'}, stateHex: Buffer.alloc(5, '0e5f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e51410101e982', 'hex')},
		{deviceId: 'Light5', subId: '1', state: 'OFF', name: '주방1', stateMask: {pos: 5, value: '0'}, stateHex: Buffer.alloc(5, '0e5f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e51410100e880', 'hex')},
		{deviceId: 'Light5', subId: '2', state: 'ON',  name: '주방2', stateMask: {pos: 6, value: '1'}, stateHex: Buffer.alloc(5, '0e5f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e52410101ea84', 'hex')},
		{deviceId: 'Light5', subId: '2', state: 'OFF', name: '주방2', stateMask: {pos: 6, value: '0'}, stateHex: Buffer.alloc(5, '0e5f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e52410100eb84', 'hex')},
		{deviceId: 'Light5', subId: '3', state: 'ON',  name: '주방3',  stateMask: {pos: 7, value: '1'}, stateHex: Buffer.alloc(5, '0e5f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e53410101eb86', 'hex')},
		{deviceId: 'Light5', subId: '3', state: 'OFF', name: '주방3', stateMask: {pos: 7, value: '0'}, stateHex: Buffer.alloc(5, '0e5f810400', 'hex'), commandHex: Buffer.alloc(8, 'f70e53410100ea84', 'hex')},
		{deviceId: 'Ventilator', subId: '1', state: 'LOW', name: '환기', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(11, '32018105000101030043f8', 'hex'), commandHex: Buffer.alloc(8, 'f7320142010186f4', 'hex')},
		{deviceId: 'Ventilator', subId: '1', state: 'MID', name: '환기', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(11, '32018105000102030040f6', 'hex'), commandHex: Buffer.alloc(8, 'f7320142010285f4', 'hex')},
		{deviceId: 'Ventilator', subId: '1', state: 'HIGH', name: '환기', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(11, '32018105000103030041f8', 'hex'), commandHex: Buffer.alloc(8, 'f7320142010384f4', 'hex')},
		{deviceId: 'Ventilator', subId: '1', state: 'OFF', name: '환기', stateMask: {pos: -1, value: ''}, stateHex: Buffer.alloc(11, '32018105000000030043f6', 'hex'), commandHex: Buffer.alloc(8, 'f7320141010084f0', 'hex')},
	],
	TOPIC_PREFIX: 'homenet-js'
};

//
var log = (...args) => console.log('[' + new Date().toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}) + ']', args.join(' '));
var homeStatus = {};
var lastReceive = new Date().getTime();
var mqttReady = false;
var queue = new Array();

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
		console.log(client);
	});
});

client.on('message', (topic, message) => {
	if (!mqttReady) return;

	console.log(topic);
	console.log(message);
	var topics = topic.split('/');
	var msg = message.toString();
	console.log(msg);

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
			return;
		}

		//console.log(objFound);
		queue.push(objFound);		
	}
});

// EW11 연결
const sock = new net.Socket();
sock.connect(CONFIG.options.socket.port, CONFIG.options.socket.deviceIP, function() {
	log('[Socket] Connected socket');
});

const parser = sock.pipe(new DelimiterParser({ delimiter: Buffer.from([0xf7]) }));
parser.on('data', buffer => {
	if (!mqttReady) return;

	//console.log(buffer);
	var hex = new Array();
	Array.from(buffer.entries()).forEach(e => {
		hex[e[0]] = e[1];
	});

	//
	CONST.DEVICES.forEach(device => {
		if (device.stateMask.pos == -1) {
			if (buffer.equals(device.stateHex)) {
				publishProc(device);
			}
		} else {
			var head = Buffer.alloc(device.stateHex.length);
			buffer.copy(head, 0, 0, device.stateHex.length);
			if (device.stateHex.equals(head)) {
				if (hex[device.stateMask.pos] == device.stateMask.value) {
					publishProc(device);
				}
			}
		}
	});
});

//
const publishProc = (objFound) => {
	if (objFound == null) return ;

	//console.log(objFound);
	var targetName = objFound.deviceId + '-' + objFound.subId;
	var topic = CONST.TOPIC_PREFIX + '/' + targetName + '/status';
	var current = homeStatus[targetName];

	if(current == null || current != objFound.state) {
		if(queue.length > 0) {
			var found = queue.find(q => q.deviceId + '-' + q.subId === targetName && q.state === current);
			if (found != null) return;
		}

		// 그외 상태반영
		homeStatus[targetName] = objFound.state;
		client.publish(topic, objFound.state, {retain: true});
		log('[MQTT] (Publish)', topic, ':', objFound.state);
	}
}

//
const commandProc = () => {
  if (queue.length == 0) return;

  var obj = queue.shift();
  sock.write(obj.commandHex);
  log('[Socket] (Send)', obj.deviceId + "-" + obj.subId, obj.name, '->', obj.state);
}

setTimeout(() => {
	mqttReady = true;
	log('Ready MQTT...')
}, CONST.mqttDelay);
setInterval(commandProc, 100);
