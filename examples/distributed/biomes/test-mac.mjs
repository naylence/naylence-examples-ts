import os from 'os';

const interfaces = os.networkInterfaces();

console.log('Network Interfaces:');
console.log(JSON.stringify(interfaces, null, 2));

console.log('\nMAC Addresses Found:');
for (const [name, ifaces] of Object.entries(interfaces)) {
  for (const iface of ifaces) {
    if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
      console.log(`${name}: ${iface.mac}`);
      
      // Check if locally administered
      const firstByte = parseInt(iface.mac.substring(0, 2), 16);
      const isLocallyAdministered = (firstByte & 0x02) !== 0;
      const isMulticast = (firstByte & 0x01) !== 0;
      
      console.log(`  First byte: 0x${firstByte.toString(16).padStart(2, '0')}`);
      console.log(`  Locally administered: ${isLocallyAdministered}`);
      console.log(`  Multicast: ${isMulticast}`);
    }
  }
}

console.log(`\nHostname: ${os.hostname()}`);
