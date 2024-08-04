from flask import Flask, request
import socket
import ssl
from scapy.all import IP, TCP, sr1, RandShort
from flask_socketio import SocketIO, join_room
from threading import Lock

app = Flask(__name__)
socketio = SocketIO(app, async_mode="threading", cors_allowed_origins="*")

timeout = 0.3

scan_lock = Lock()
scan_counter = 0

@socketio.on('startScan')
def handle_start_scan(json):
    global scan_counter
    target_ip = json['target_ip']
    ports = list(range(1, 60000)) 
    session_id = request.sid
    join_room(session_id)
    
    with scan_lock:
        scan_counter = len(ports)

    print(f"[+] Starting scan on {target_ip}")
    for port in ports:
        socketio.start_background_task(scan_port, target_ip, port, session_id, lambda: scan_completed(session_id))

def scan_completed(session_id):
    global scan_counter
    with scan_lock:
        scan_counter -= 1
        if scan_counter == 0:
            print("[+] Scan completed!")
            socketio.emit('scanCompleted', {'message': 'Scan completed!'}, room=session_id)


def banner_grabbing(ip, port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)

    if port == 443:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        try:
            s = ctx.wrap_socket(s, server_hostname=ip)
        except ssl.SSLError as e:
            return f"[-] SSL error on port {port}: {e}"

    try:
        s.connect((ip, port))

        if port in [80, 443]:
            s.send(b"GET / HTTP/1.1\r\nHost: %s\r\n\r\n" % ip.encode())

        banner = s.recv(1024).decode(errors='ignore')
        return (port, banner.strip()) if banner else None

    except socket.error as e:
        return None
    finally:
        s.close()

def scan_port(target_ip, port, session_id, callback):
    source_port = RandShort()
    packet = IP(dst=target_ip) / TCP(sport=source_port, dport=port, flags="S")
    response = sr1(packet, timeout=timeout, verbose=0)

    socketio.emit('scanProgress', {'ip': target_ip, 'port': port, 'message': f"Scanning port {port}..."}, room=session_id)

    if response:
        if response[TCP].flags == "SA":
            result = banner_grabbing(target_ip, port)
            if result:
                port, banner = result
                socketio.emit('scanResult', {'ip':target_ip,'port': port, 'banner': banner}, room=session_id)
                print(f"[+] Port {port} is open: {banner}")
            else:
                socketio.emit('scanResult', {'ip':target_ip,'port': port, 'banner': None}, room=session_id)
                print(f"[+] Port {port} is open but no banner retrieved.")
        callback()
    else:
        print(f"[-] Scanning port {port}...")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001)
