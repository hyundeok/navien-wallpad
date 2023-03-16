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

// EW11 연결
const sock = new net.Socket();
sock.connect(CONFIG.options.socket.port, CONFIG.options.socket.deviceIP, function() {
	log('[Socket] Connected socket');
});

const parser = sock.pipe(new DelimiterParser({ delimiter: Buffer.from([0xf7]) }));
parser.on('data', buffer => {
	//console.log(buffer);

	var target = Buffer.alloc(3, "120181", "hex");
	var head = Buffer.alloc(3);
	buffer.copy(head, 0, 0, 3);
	if (head.equals(target)) {
		var hex = new Array();
		var tmp = "";
		Array.from(buffer.entries()).forEach(e => {
			hex[e[0]] = e[1];
			tmp += padding(e[1].toString()) + " ";
		});
		console.log(tmp);
	}
});

const padding = (data) => {
	var str = "";
	if (data < 10) {
		str += "  " + data;
	} else if (data < 100) {
		str += " " + data;
	} else {
		str += data;
	}

	return str;
}
