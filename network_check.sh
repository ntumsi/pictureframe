#!/bin/bash

echo "Picture Frame Network Check"
echo "=========================="
echo

# Get IP addresses
echo "Network Interfaces:"
ip addr | grep -E "inet " | grep -v "127.0.0.1" | awk '{print $2, $NF}' | while read -r ip iface; do
  echo "  $iface: $ip"
done
echo

# Check listening ports
echo "Listening Ports:"
ss -tulpn | grep -E ':(5000|3000)' | while read -r line; do
  echo "  $line"
done
echo

# Test curl
echo "API Connection Test:"
echo -n "  Testing localhost:5000... "
if curl -s http://localhost:5000/api/images > /dev/null; then
  echo "SUCCESS"
else
  echo "FAILED"
fi
echo

# Get hostname
echo "Hostname: $(hostname)"
echo

# Get firewall status
echo "Firewall Status:"
if command -v ufw > /dev/null; then
  echo "  UFW status:"
  sudo ufw status | sed 's/^/  /'
elif command -v iptables > /dev/null; then
  echo "  IPTables rules (only showing relevant):"
  sudo iptables -L INPUT | grep -E '5000|3000|http|web' | sed 's/^/  /'
else
  echo "  No firewall detected or tools not available"
fi
echo

echo "Suggested Access URLs:"
ip addr | grep -E "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d/ -f1 | while read -r ip; do
  echo "  Express: http://$ip:5000"
  echo "  Serve:   http://$ip:3000"
done
echo

echo "=========================="
echo "If you can't access the app from other devices:"
echo "1. Check if any firewall is blocking ports 5000 and 3000"
echo "2. Make sure your device is on the same network"
echo "3. Try running the app with './start.sh' to use Express"
echo "4. For advanced troubleshooting, see README.md"