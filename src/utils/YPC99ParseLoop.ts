import { Buffer } from 'buffer';

const JFIF_SOI = Buffer.from('ffd8', 'hex');
const JFIF_EOI = Buffer.from('ffd9', 'hex');

const FRAME_CONTROL_HEADER = Buffer.from('05338b11', 'hex');

const FRAME_HEADER_LEN = 11;

const FRAME_COMMAND_POS = 4;
const FRAME_IMAGE_LENGTH_MSB_POS = 6;
const FRAME_IMAGE_LENGTH_LSB_POS = 7;
const FRAME_IMAGE_SOI_OFFSET = 17;

const FRAME_COMMAND_IMAGE = 0x25;

var framebuffer = Buffer.from([]);
var image_frame_len = 0;

function byteArraytoHexString(byteArray: any) {
    return byteArray.reduce((output: any, elem: any) => (output + ('0' + elem.toString(16)).slice(-2)), '');
}


function YPC99ParseLoop(data: any, callback: Function) {
    var packet = data;

    while (packet.length > 0) {
        if (image_frame_len == 0) {
            // Encontra o header de controle do frame
            var ctrl_header_pos = packet.indexOf(FRAME_CONTROL_HEADER, 0, 'hex');

            if (ctrl_header_pos == -1) {
                return
            }

            // Encontra a posição final do header de controle do frame
            var ctrl_header_end = ctrl_header_pos + FRAME_HEADER_LEN;
            var ctrl_header = packet.subarray(ctrl_header_pos, ctrl_header_end);
            // console.log("Ctrl header", byteArraytoHexString(ctrl_header), " end: ", ctrl_header_end)

            // Obtém o comando do frame
            var frame_command = ctrl_header[FRAME_COMMAND_POS];

            // Se o comando do frame for de imagem continua
            if (frame_command == FRAME_COMMAND_IMAGE) {
                // console.log("SUCESSO");
                // Relative packet
                var image_start_pos = ctrl_header_pos + FRAME_HEADER_LEN;

                // Obtém o tamanho do frame de imagem conforme a posição no header de controle
                image_frame_len = ctrl_header.readIntLE(FRAME_IMAGE_LENGTH_MSB_POS, 2) - 1;

                // console.log(
                //     "Frame image length: ",
                //     byteArraytoHexString(
                //         ctrl_header.subarray(FRAME_IMAGE_LENGTH_MSB_POS, FRAME_IMAGE_LENGTH_LSB_POS + 1)
                //     ),
                //     " ",
                //     image_frame_len
                // );

                var image_frame_end = image_start_pos + image_frame_len;

                // console.log(
                //     "image frame start:", image_start_pos,
                //     "image frame len", image_frame_len,
                //     "ends", image_frame_end,
                //     "first bytes:", byteArraytoHexString(packet.subarray(image_start_pos, image_start_pos + 2)),
                //     "last bytes:", byteArraytoHexString(packet.subarray(image_frame_end - 2, image_frame_end))
                // );

                if (packet.subarray(image_start_pos + FRAME_IMAGE_SOI_OFFSET, image_start_pos + FRAME_IMAGE_SOI_OFFSET + 2).toString('hex') == JFIF_SOI.toString('hex')) {
                    framebuffer = Buffer.from('');
                    // Skip header before SOI marker
                    image_frame_len = image_frame_len - FRAME_IMAGE_SOI_OFFSET;
                    image_start_pos = image_start_pos + FRAME_IMAGE_SOI_OFFSET;
                    // console.log(
                    //     "Skipping header. Starting at: ",
                    //     byteArraytoHexString(packet.subarray(image_start_pos, image_start_pos + 2)),
                    //     "image frame len:", image_frame_len
                    // );
                } else if (framebuffer == null || framebuffer == Buffer.from([])) {
                    // console.log("Did not find JFIF SOF, dumping packet:", packet.toString("hex"));
                    return
                }

                // Sometimes image frame overlaps multiple network packets
                // console.log("image frame length: ", image_frame_len, " rest of packet: ", packet.subarray(image_start_pos).length);

                if (image_frame_len > packet.subarray(image_start_pos).length) {
                    // console.log("Image frame overlaps packet");
                    framebuffer = Buffer.concat([framebuffer, packet.subarray(image_start_pos)]);

                    image_frame_len = image_frame_len - packet.subarray(image_start_pos).length;
                    packet = ""
                    // console.log(image_frame_len, " image bytes in next packet");
                } else {
                    //Sometimes multiple image frames coincide in the same packet
                    framebuffer = Buffer.concat([framebuffer, packet.subarray(image_start_pos, image_frame_end)]);

                    image_frame_len = 0
                    // console.log(
                    //     "End of frame:",
                    //     byteArraytoHexString(packet.subarray(image_frame_end - 2, image_frame_end + 4))
                    // );

                    if (packet.subarray(image_frame_end - 2, image_frame_end).toString('hex') == JFIF_EOI.toString('hex')) {
                        // console.log("Found end of frame 1");
                        // socket.emit('image', framebuffer.toString('base64'))
                        callback(framebuffer.toString('base64'));
                        framebuffer = Buffer.from([]);
                    }

                    // Skip all packet consumed in this packet
                    packet = packet.subarray(image_frame_end);
                }
            } else {
                packet = packet.subarray(ctrl_header_end + 1);
            }
        } else {
            // Continuation of a previous image
            // Sometimes an image frame overlaps multiple packets
            if (image_frame_len > packet.length) {
                framebuffer = Buffer.concat([framebuffer, packet]);
                image_frame_len = image_frame_len - packet.length;
                packet = "";
            } else {
                framebuffer = Buffer.concat([framebuffer, packet.subarray(0, image_frame_len)]);
                if (packet.subarray(image_frame_len - 2, image_frame_len).toString('hex') == JFIF_EOI.toString('hex')) {
                    // console.log("Found end of frame 2");
                    // socket.emit('image', framebuffer.toString('base64'))
                    callback(framebuffer.toString('base64'));
                    framebuffer = Buffer.from([]);
                }
                packet = packet.subarray(image_frame_len);
                image_frame_len = 0;
            }
        }
    }
}

export default YPC99ParseLoop;