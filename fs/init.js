load('api_config.js');
load('api_mqtt.js');
load('api_timer.js');
load('api_dht.js');
load('api_config.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_dht.js');
load('api_mq135.js');

let deviceName = Cfg.get('device.id');
let ppm = 0;
let correctedPPM = 0;
let topic = '/devices/' + deviceName + '/events';
print('Topic: ', topic);

let isConnected = false;

let dhtPin = Cfg.get('app.dht');
let dht = DHT.create(dhtPin, DHT.DHT11);
MQ.MQ135.attach(0);

function readPPMData(){
  let rzero = MQ.MQ135.getRZero();
  let calibTemp = dht.getTemp();
  let calibHumidity = dht.getHumidity();
  let correctedRZero = MQ.MQ135.getCorrectedRZero(calibTemp, calibHumidity);
  let resistance = MQ.MQ135.getResistance();
  ppm = MQ.MQ135.getPPM();
  correctedPPM = MQ.MQ135.getCorrectedPPM(calibTemp,calibHumidity);  
  print('MQ135 RZero: ',rzero,' Corrected RZero: ',correctedRZero,'\n');
  print('Resistance: ',resistance," kohm\n");
  print('PPM: ',ppm,' Corrected PPM: ',correctedPPM,' ppm\n');
  return correctedPPM;
}

let getInfo = function() {
  return JSON.stringify({
    temp: dht.getTemp(),
    hum: dht.getHumidity(),
    ppm: readPPMData()
  });
};

Timer.set(
  60 * 1000,
  true,
  function() {
    if (isConnected) {
      publishData();
    }
  },
  null
);

Timer.set(
  5000,
  true,
  function() {
    print('Info:', getInfo());
  },
  null
);

MQTT.setEventHandler(function(conn, ev) {
  if (ev === MQTT.EV_CONNACK) {
    print('CONNECTED');
    isConnected = true;
    publishData();
  }
}, null);

function publishData() {
  let ok = MQTT.pub(topic, getInfo());
  if (ok) {
    print('Published');
  } else {
    print('Error publishing');
  }
}

// Monitor network connectivity.
Net.setStatusEventHandler(function(ev, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);

