import chunk
import socket
import binascii
import time

BUFFER_SIZE = 16384

JFIF_SOI = b'\xff\xd8'
JFIF_EOI = b'\xff\xd9'

FRAME_CONTROL_HEADER = b'\x05\x33\x8b\x11'

FRAME_HEADER_LEN = 11

FRAME_COMMAND_POS = 4
FRAME_HEADER_LENGTH_POS = 6
FRAME_IMAGE_LENGTH_MSB_POS = 6
FRAME_IMAGE_LENGTH_LSB_POS = 7
FRAME_IMAGE_SOI_OFFSET = 17

FRAME_COMMAND_ENABLE_STREAM = 0x0e
FRAME_COMMAND_IMAGE = b'\x25'

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
print("Binding " + socket.gethostname())
#sock.bind((socket.gethostname(), 80))
sock.bind(("localhost", 80))
sock.listen(1)

cicle = 1
(client_sock, address) = sock.accept()
print(address, " connected")
data = client_sock.recv(BUFFER_SIZE)
    
print(binascii.hexlify(data))
while True:
    is_first = True

    filename = "simulation/assets/GREEN.jpg" if cicle % 2 == 0 else "simulation/assets/RED.jpg"
    cicle += 1
    time.sleep(1)
    
    with open(filename, "rb") as f:
        bytes_read = f.read()

        big_endian_size = 2

        range_size = len(bytes_read)//big_endian_size
        if len(bytes_read) % big_endian_size != 0:
            range_size += 1

        bytes_test = [bytes_read[i*big_endian_size:(i+1)*big_endian_size][::] for i in range(range_size)]

        bytes_read = b''.join(bytes_test)

    print(f"{bytes_read.hex()}")

    chunk_size = 2048

    range_size = len(bytes_read) // chunk_size
    if len(bytes_read) % chunk_size != 0:
        range_size += 1

    for i in range(range_size):
        if is_first:
            payload = FRAME_CONTROL_HEADER
            payload += FRAME_COMMAND_IMAGE
            payload += b'\x00'
            #payload += b'\x12\x04'
            total_size = len(bytes_read) + 18
            image_len = total_size.to_bytes(
                (total_size.bit_length() + 7) // 8, 'little')

            payload += image_len
            payload += b'\x00\x00\x03\x00\x0f\x00\x00\x01\x95\x8f\x00\x00\x00\x00\x00\x00\xcc\x1e\x00\x00'
            payload += bytes_read[i*chunk_size:(i+1)*chunk_size]
        else:
            payload = FRAME_CONTROL_HEADER
            payload += FRAME_COMMAND_IMAGE
            payload += b'\x00'

            total_size = len(bytes_read) - len(bytes_read[i*chunk_size:(i+1)*chunk_size])
            image_len = total_size.to_bytes((total_size.bit_length() + 7) // 8, 'little')

            payload += image_len
            payload += b'\x00\x00\x02\x51'
            payload += bytes_read[i*chunk_size:(i+1)*chunk_size]

        print(f"{len(payload)}")

        client_sock.send(
            payload
        )
        is_first = False


# 05 33 8b 11 0f 00 01 00  00 00 00
# Frame 1 - Sop at 0xFA
# 05 33 8b 11 25 00 12 04 00 00 03 00 0f 00 00 01 95 8f 00 00 00 00 00 00 cc 1e 00 00 ff d8
#  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29
# Frame 1 - middle of packet 0x4FA (0x400) = 1024
# 05 33 8b 11 25 00 01 04 00 00 02 51 4d 34 51 4d a6 d1 45 34 d3 68 a2 92 9a 68 a2 99 45 14 53 29

# Frame 2
# 05 33 8b 11 25 00 12 04 00 00 03 00 0f 00 00 01 95 8f 00 00 00 00 00 00 18 1f 00 00 ff d8
